import { JSDOM } from 'jsdom';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createFixture } from '../server/git.js';
import type { Server } from 'node:http';
import React from 'react';
import { createApp } from '../server/app.js';
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' });
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  HTMLInputElement: dom.window.HTMLInputElement,
  HTMLTextAreaElement: dom.window.HTMLTextAreaElement,
  MutationObserver: dom.window.MutationObserver,
  IS_REACT_ACT_ENVIRONMENT: true,
});
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
const { render, screen, within, waitFor, cleanup, act } = await import('@testing-library/react');
const { default: userEvent } = await import('@testing-library/user-event');
const { default: App } = await import('../src/App.js');
const originalFetch = globalThis.fetch;
async function setup(stepDelay = 25) {
  window.localStorage.clear();
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jove-ui-'));
  const backend = createApp({ dataDir, stepDelay, piDiscovery: false, seed: true });
  const server = await new Promise<Server>((resolve) => {
    const s = backend.app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const address = server.address() as any;
  globalThis.fetch = ((input: any, init: any) =>
    originalFetch(
      typeof input === 'string' && input.startsWith('/api')
        ? `http://127.0.0.1:${address.port}${input}`
        : input,
      init,
    )) as typeof fetch;
  render(<App />);
  await userEvent
    .setup({ document: dom.window.document })
    .click(await screen.findByRole('button', { name: 'Open ' + backend.state.projects[0].name }));
  await userEvent
    .setup({ document: dom.window.document })
    .click(await screen.findByRole('tab', { name: 'General' }));
  return {
    backend,
    request: (route: string, body: unknown, method = 'POST') =>
      globalThis
        .fetch('/api' + route, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        .then(async (response) => {
          assert.ok(response.ok, await response.clone().text());
          return response.json();
        }),
    user: userEvent.setup({ document: dom.window.document }),
    async close() {
      cleanup();
      globalThis.fetch = originalFetch;
      backend.close();
      await new Promise<void>((resolve) => server.close(() => resolve()));
      fs.rmSync(dataDir, { recursive: true, force: true });
    },
  };
}
test('UI clips context, preserves drafts during refresh, merges selected findings, and implements from child', async () => {
  const ctx = await setup();
  try {
    const composer = screen.getByRole('textbox', { name: 'Message General' });
    await ctx.user.type(composer, 'Keep this unfinished thought');
    await act(async () => {
      await new Promise((r) => setTimeout(r, 2200));
    });
    assert.equal((composer as HTMLTextAreaElement).value, 'Keep this unfinished thought');
    const sourceMessage = ctx.backend.state.messages[1];
    await ctx.user.click(screen.getAllByRole('button', { name: 'Clip' })[1]);
    assert.equal(screen.queryByRole('dialog'), null);
    await screen.findByRole('textbox', { name: 'Message Clip 1' });
    assert.equal(
      ctx.backend.state.investigations.at(-1)?.model,
      ctx.backend.state.investigations[0].model,
    );
    assert.equal(ctx.backend.state.messages.at(-1)?.content, sourceMessage.content);
    assert.equal(ctx.backend.state.messages.at(-1)?.sourceMessageId, sourceMessage.id);
    assert.ok(screen.getByText('From General'));
    const childComposer = screen.getByRole('textbox', { name: 'Message Clip 1' });
    await ctx.user.type(childComposer, 'What is the risk?');
    const child = childComposer.closest('section')!;
    await ctx.user.click(within(child).getByRole('button', { name: 'Send message' }));
    await screen.findByText(
      'This is a deterministic local demonstration, not an AI answer. Choose a configured live provider for open-ended investigation.',
    );
    await ctx.user.click(within(child).getByLabelText('Investigation actions'));
    await ctx.user.click(within(child).getByRole('button', { name: 'Merge' }));
    const merge = screen.getByRole('dialog');
    assert.ok(within(merge).getByText('Context only. No code is changed.'));
    await ctx.user.click(within(merge).getByRole('button', { name: 'Merge findings' }));
    await screen.findByText('Findings merged. Both histories preserved.');
    await ctx.user.click(
      within(screen.getByRole('navigation', { name: 'Investigations' })).getByRole('tab', {
        name: 'Clip 1',
      }),
    );
    const side = screen.getByRole('tabpanel', { name: 'Clip 1' });
    await ctx.user.click(within(side).getByLabelText('Investigation actions'));
    await ctx.user.click(within(side).getAllByRole('button', { name: 'Add to queue' })[0]);
    assert.equal(screen.queryByRole('dialog'), null);
    await ctx.user.click(await screen.findByRole('button', { name: 'Start' }));
    await waitFor(() => assert.equal(ctx.backend.state.runs[0]?.status, 'completed'), {
      timeout: 10000,
    });
    const update = await screen.findByRole('article', {
      name: `Task update: ${ctx.backend.state.runs[0].objective}`,
    });
    assert.equal(
      screen.getAllByRole('article', {
        name: `Task update: ${ctx.backend.state.runs[0].objective}`,
      }).length,
      1,
    );
    assert.equal(update.textContent?.includes('agent_'), false);
    await ctx.user.click(await screen.findByRole('button', { name: 'Review' }, { timeout: 5000 }));
    await ctx.user.click(screen.getByRole('button', { name: 'Tests' }));
    await screen.findByText('passed', { exact: true });
    assert.ok(screen.getByText(/missing financial history is safely ineligible/));
    assert.equal(
      ctx.backend.state.runs[0].investigationId,
      ctx.backend.state.investigations.find((i) => i.title === 'Clip 1')!.id,
    );
  } finally {
    await ctx.close();
  }
});
test('UI creates project and work, cancels dialog without mutation, and has no account or settings controls', async () => {
  const ctx = await setup();
  try {
    await ctx.user.click(screen.getAllByRole('button', { name: 'Import project' })[0]);
    let dialog = screen.getByRole('dialog');
    await within(dialog).findByRole('button', { name: 'Browse path' });
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    assert.equal(ctx.backend.state.projects.length, 1);
    await ctx.user.click(screen.getAllByRole('button', { name: 'Import project' })[0]);
    dialog = screen.getByRole('dialog');
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    assert.equal(ctx.backend.state.projects.length, 1);
    await ctx.user.click(screen.getAllByRole('button', { name: 'Import project' })[0]);
    dialog = screen.getByRole('dialog');
    const repo = fs.mkdtempSync(path.join(ctx.backend.state.projects[0].path, 'ui-codebase-'));
    createFixture(repo);
    await waitFor(() =>
      assert.ok(
        (within(dialog).getByRole('textbox', { name: 'Codebase path' }) as HTMLInputElement).value,
      ),
    );
    await ctx.user.clear(within(dialog).getByRole('textbox', { name: 'Codebase path' }));
    await ctx.user.type(within(dialog).getByRole('textbox', { name: 'Codebase path' }), repo);
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Browse path' }));
    await waitFor(() =>
      assert.equal(
        (within(dialog).getByRole('button', { name: 'Import codebase' }) as HTMLButtonElement)
          .disabled,
        false,
      ),
    );
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Import codebase' }));
    await waitFor(() => assert.equal(ctx.backend.state.projects.length, 2));
    await screen.findByRole('textbox', { name: 'Message General' }, { timeout: 5000 });
    assert.equal(screen.queryByRole('button', { name: 'Start new work' }), null);
    assert.equal(ctx.backend.state.works.at(-1)!.isPrimary, true);
    await screen.findByRole('textbox', { name: 'Message General' });
    await ctx.user.click(screen.getByLabelText('Investigation actions'));
    await ctx.user.click(screen.getByRole('button', { name: 'New work' }));
    dialog = screen.getByRole('dialog');
    await ctx.user.type(
      within(dialog).getByRole('textbox', { name: 'Work objective' }),
      'Test fresh work',
    );
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Create work' }));
    await waitFor(() => assert.equal(ctx.backend.state.works.length, 3));
    await screen.findByRole('tab', { name: 'General' });
    assert.equal(ctx.backend.state.works.at(-1)!.title, 'Test fresh work');
    assert.equal(ctx.backend.state.works.at(-1)!.isPrimary, false);
    assert.equal(screen.queryByRole('button', { name: 'Local account' }), null);
    assert.equal(screen.queryByRole('button', { name: 'Settings' }), null);
  } finally {
    await ctx.close();
  }
});

test('sidebar tasks show progress without action icons and open persistent task details', async () => {
  const ctx = await setup(2500);
  try {
    const queue = await screen.findByRole('navigation', { name: 'Tasks' });
    await ctx.request(
      `/works/${ctx.backend.state.works[0].id}/queue`,
      { autoStart: false },
      'PATCH',
    );
    assert.equal(within(queue).queryByText('Up next'), null);
    assert.equal(within(queue).queryByRole('switch'), null);
    assert.equal(document.querySelector('.sidebar input'), null);
    for (const objective of ['First queued fix', 'Second queued fix']) {
      const menu = screen.getByLabelText('Investigation actions');
      if (!menu.parentElement?.hasAttribute('open')) await ctx.user.click(menu);
      await ctx.user.click(screen.getAllByRole('button', { name: 'Add to queue' })[0]);
      await waitFor(() =>
        assert.equal(
          screen.getAllByRole('article', { name: /Task update:/ }).length,
          objective === 'First queued fix' ? 1 : 2,
        ),
      );
      const cards = screen.getAllByRole('article', { name: /Task update:/ });
      const card = cards.at(-1)!;
      await ctx.user.click(within(card).getByRole('button', { name: 'Edit' }));
      const field = within(card).getByRole('textbox', { name: 'Task objective' });
      await ctx.user.clear(field);
      await ctx.user.type(field, objective);
      await ctx.user.click(within(card).getByRole('button', { name: 'Save' }));
      await within(queue).findByRole('heading', { name: objective });
    }
    assert.equal(ctx.backend.state.runs.length, 2);
    assert.equal(within(queue).queryByRole('button', { name: 'Start First queued fix' }), null);
    await ctx.request(`/runs/${ctx.backend.state.runs[0].id}/control`, { action: 'start' });
    await ctx.request(`/runs/${ctx.backend.state.runs[0].id}/control`, { action: 'pause' });
    await waitFor(() => assert.equal(ctx.backend.state.runs[0].status, 'paused'));
    await waitFor(() => assert.equal(ctx.backend.state.runs[0].attempts?.[0].status, 'paused'), {
      timeout: 5000,
    });
    await ctx.request(`/runs/${ctx.backend.state.runs[0].id}/control`, { action: 'resume' });
    await waitFor(() => assert.equal(ctx.backend.state.runs[0].status, 'completed'), {
      timeout: 15000,
    });
    const review = await within(queue).findByRole(
      'button',
      { name: 'First queued fix Ready to review' },
      { timeout: 5000 },
    );
    assert.equal(ctx.backend.state.runs[0].attempts?.length, 2);
    assert.equal(ctx.backend.state.runs[1].status, 'queued');
    await ctx.user.click(review);
    await screen.findByRole('button', { name: 'Back to investigations' });
    await ctx.user.click(screen.getByRole('button', { name: 'Back to investigations' }));
    assert.ok(document.querySelector('.sidebar')?.contains(queue));
    await ctx.user.click(within(queue).getByRole('button', { name: /Second queued fix Queued/ }));
    assert.ok(
      within(queue)
        .getByRole('button', { name: /Second queued fix Queued/ })
        .getAttribute('aria-current'),
    );
    await ctx.user.click(screen.getByRole('button', { name: 'Back to investigations' }));
    assert.equal(screen.queryByRole('button', { name: 'Back to investigations' }), null);
    assert.ok(screen.getByRole('navigation', { name: 'Tasks' }));
  } finally {
    await ctx.close();
  }
});

test('workspace loading shows Jove until the initial state arrives', async () => {
  let finish!: (response: Response) => void;
  globalThis.fetch = (() =>
    new Promise<Response>((resolve) => {
      finish = resolve;
    })) as typeof fetch;
  try {
    render(<App />);
    assert.ok(screen.getByRole('status').textContent?.includes('Opening your workspace'));
    assert.equal(screen.queryByRole('heading', { name: 'Projects' }), null);
    await act(async () => {
      finish(
        new Response(
          JSON.stringify({
            projects: [],
            works: [],
            investigations: [],
            messages: [],
            runs: [],
            providers: [],
          }),
        ),
      );
    });
    await screen.findByRole('heading', { name: 'What are we figuring out today?' });
    assert.equal(screen.queryByRole('status'), null);
  } finally {
    cleanup();
    globalThis.fetch = originalFetch;
  }
});

test('Paper navigation has one selected destination and no account controls', async () => {
  const ctx = await setup();
  try {
    const navigation = screen.getByRole('navigation', { name: 'Investigations' });
    assert.equal(
      within(navigation)
        .getAllByRole('tab')
        .filter((button) => button.getAttribute('aria-current') === 'page').length,
      1,
    );
    assert.ok(document.querySelector('.investigation-tabs'));
    assert.equal(screen.queryByRole('heading', { name: 'General' }), null);
    assert.equal(screen.queryByRole('textbox', { name: 'Search investigations' }), null);
    assert.equal(document.querySelector('.breadcrumbs'), null);
    assert.equal(screen.queryByText('In progress', { exact: true }), null);
    assert.deepEqual(
      within(screen.getByRole('navigation', { name: 'Change views' }))
        .getAllByRole('button')
        .map((button) => button.textContent),
      ['Diff', 'History', 'Terminal'],
    );
    const tasks = screen.getByRole('navigation', { name: 'Tasks' });
    assert.equal(within(tasks).queryByText('Tasks'), null);
    assert.equal(within(tasks).queryByRole('button', { name: /Toggle tasks for/ }), null);
    assert.equal(within(tasks).queryByText('General'), null);
    assert.equal(screen.queryByRole('button', { name: 'Local account' }), null);
    assert.equal(screen.queryByRole('button', { name: 'Settings' }), null);
  } finally {
    await ctx.close();
  }
});

test('project tasks share one list and opening a task selects its owning work', async () => {
  const ctx = await setup();
  try {
    const first = ctx.backend.state.works[0];
    const second = await ctx.request('/works', {
      projectId: first.projectId,
      title: 'Second work',
      objective: 'Separate execution',
    });
    await ctx.request(`/works/${second.work.id}/queue`, { autoStart: false }, 'PATCH');
    await ctx.request('/runs', {
      investigationId: second.investigation.id,
      objective: 'Second work execution',
      model: 'demo',
      queue: true,
    });
    const secondTasks = screen.getByRole('navigation', { name: 'Tasks' });
    await ctx.user.click(
      await within(secondTasks).findByRole(
        'button',
        { name: 'Second work execution Queued' },
        { timeout: 5000 },
      ),
    );
    await screen.findByRole('heading', { name: 'Second work execution', level: 1 });
    assert.equal(screen.getByRole('navigation', { name: 'Tasks' }), secondTasks);
    assert.equal(
      within(secondTasks)
        .getByRole('button', { name: 'Second work execution Queued' })
        .getAttribute('aria-current'),
      'page',
    );
    await ctx.user.click(screen.getByRole('button', { name: 'Back to investigations' }));
    assert.equal(screen.getByRole('textbox', { name: 'Message General' }).textContent, '');
  } finally {
    await ctx.close();
  }
});

test('new work starts with a centered composer and moves it below the first conversation', async () => {
  const ctx = await setup();
  try {
    await ctx.user.click(screen.getByLabelText('Investigation actions'));
    await ctx.user.click(screen.getByRole('button', { name: 'New work' }));
    const dialog = screen.getByRole('dialog');
    await ctx.user.type(
      within(dialog).getByRole('textbox', { name: 'Work objective' }),
      'Fresh conversation',
    );
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Create work' }));
    await waitFor(() => assert.equal(ctx.backend.state.works.at(-1)?.title, 'Fresh conversation'));
    await waitFor(() => assert.equal(screen.queryByRole('dialog'), null));
    const panel = await screen.findByRole('tabpanel', { name: 'General' });
    assert.ok(panel.classList.contains('empty-conversation'));
    assert.equal(screen.queryByText('Get your bearings.'), null);
    assert.equal(screen.queryByRole('heading', { name: 'Fresh conversation' }), null);
    await ctx.user.type(
      within(panel).getByRole('textbox', { name: 'Message General' }),
      'Inspect this codebase',
    );
    await ctx.user.click(within(panel).getByRole('button', { name: 'Send message' }));
    await waitFor(() => assert.equal(panel.classList.contains('empty-conversation'), false));
    await within(panel).findByText('Inspect this codebase', { exact: true });
  } finally {
    await ctx.close();
  }
});

test('home resumes a project and its examples do not create conversations or tasks', async () => {
  const ctx = await setup();
  try {
    const tabs = ctx.backend.state.investigations.length;
    const tasks = ctx.backend.state.runs.length;
    await ctx.user.click(screen.getByRole('link', { name: 'Jove home' }));
    assert.ok(screen.getByRole('heading', { name: 'What are we figuring out today?' }));
    assert.equal(screen.queryByRole('navigation', { name: 'Tasks' }), null);
    await ctx.user.click(screen.getByRole('button', { name: 'Preview clipping into a new tab' }));
    assert.ok(screen.getByText('Context ready. What would you like to know?'));
    await ctx.user.click(screen.getByRole('button', { name: 'Preview starting a task' }));
    assert.ok(screen.getByText('Ready to review. You decide what ships.'));
    assert.equal(ctx.backend.state.investigations.length, tabs);
    assert.equal(ctx.backend.state.runs.length, tasks);
    await ctx.user.click(screen.getByRole('button', { name: 'Open a project' }));
    await screen.findByRole('dialog', { name: 'Import a project' });
    await ctx.user.click(screen.getByRole('button', { name: 'Cancel' }));
    await ctx.user.click(
      screen.getByRole('button', { name: 'Open ' + ctx.backend.state.projects[0].name }),
    );
    await screen.findByRole('navigation', { name: 'Investigations' });
  } finally {
    await ctx.close();
  }
});

test('sending displays the user before the assistant immediately and reconciles without duplicates', async () => {
  const ctx = await setup();
  const request = globalThis.fetch;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  globalThis.fetch = (async (input, init) => {
    if (String(input).endsWith('/messages') && init?.method === 'POST') await gate;
    return request(input, init);
  }) as typeof fetch;
  try {
    const content = 'Show my question before the thinking indicator';
    await ctx.user.type(screen.getByRole('textbox', { name: 'Message General' }), content);
    await ctx.user.click(screen.getByRole('button', { name: 'Send message' }));
    const user = screen.getByText(content).closest('article')!;
    const assistant = screen.getByRole('article', { name: 'Assistant responding' });
    assert.equal(user.getAttribute('aria-busy'), 'true');
    assert.ok(
      user.compareDocumentPosition(assistant) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING,
    );
    assert.equal(
      ctx.backend.state.messages.some((m) => m.content === content),
      false,
    );
    await act(async () => {
      release();
    });
    await waitFor(() =>
      assert.equal(screen.queryByRole('article', { name: 'Assistant responding' }), null),
    );
    const saved = ctx.backend.state.messages.find(
      (m) => m.role === 'user' && m.content === content,
    )!;
    assert.ok(saved.clientMessageId);
    assert.equal(
      screen
        .getAllByRole('article', { name: 'Your message' })
        .filter((item) => item.textContent?.includes(content)).length,
      1,
    );
    assert.equal(document.querySelector('[aria-busy="true"]'), null);
  } finally {
    release();
    await ctx.close();
  }
});

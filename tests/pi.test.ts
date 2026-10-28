import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverPi, piChat, piModelId, PiRpc } from '../server/pi.js';
import { createApp } from '../server/app.js';
const fixture = fileURLToPath(new URL('./fixtures/pi-rpc.mjs', import.meta.url));
const model = piModelId('test', 'model/one');
function setup(scenario = 'normal') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jove-pi-rpc-'));
  return {
    root,
    config: {
      dataDir: root,
      piCommand: process.execPath,
      piArgs: [fixture, scenario],
      piTimeoutMs: 5000,
    },
    close: () => fs.rmSync(root, { recursive: true, force: true }),
  };
}
test('Pi discovery returns selectable models without exposing authentication', async () => {
  const t = setup();
  try {
    const result = await discoverPi(t.config);
    assert.equal(result.status, 'connected');
    assert.equal(result.models[0].id, model);
    assert.equal(result.defaultModel, model);
  } finally {
    t.close();
  }
});
test('Pi RPC streams LF-framed Unicode, selects model, reports tools/tests and waits for settled', async () => {
  const t = setup();
  const logs: string[] = [],
    texts: string[] = [],
    tests: any[] = [];
  try {
    const answer = await piChat(
      t.config,
      model,
      t.root,
      'Inspect',
      [],
      true,
      (s) => logs.push(s),
      new AbortController().signal,
      (r) => tests.push(r),
      (s) => texts.push(s),
    );
    assert.equal(answer, 'Final verified response');
    assert.ok(texts.includes('Read source.js\u2028safely'));
    assert.ok(logs.includes('read_file: source.js'));
    assert.equal(tests[0].status, 'passed');
  } finally {
    t.close();
  }
});
for (const [scenario, message] of [
  ['error', 'Authentication expired'],
  ['exit', 'exited'],
  ['malformed', 'invalid JSONL'],
])
  test(`Pi ${scenario} fails without claiming completion`, async () => {
    const t = setup(scenario);
    try {
      await assert.rejects(
        piChat(
          t.config,
          model,
          t.root,
          'Inspect',
          [],
          false,
          () => {},
          new AbortController().signal,
        ),
        new RegExp(message),
      );
    } finally {
      t.close();
    }
  });
test('Pi cancellation closes the process and preserves the caller abort', async () => {
  const t = setup('hang');
  const controller = new AbortController();
  try {
    const promise = piChat(
      t.config,
      model,
      t.root,
      'Inspect',
      [],
      false,
      () => {},
      controller.signal,
    );
    const timer = setTimeout(() => controller.abort(), 100);
    promise.finally(() => clearTimeout(timer)).catch(() => {});
    await assert.rejects(promise, /interrupt|abort|closed/i);
  } finally {
    t.close();
  }
});
test('Pi timeout stops a stalled run', async () => {
  const t = setup('hang');
  try {
    await assert.rejects(
      piChat(
        { ...t.config, piTimeoutMs: 200 },
        model,
        t.root,
        'Inspect',
        [],
        false,
        () => {},
        new AbortController().signal,
      ),
      /time limit/,
    );
  } finally {
    t.close();
  }
});
test('missing Pi executable gives actionable connection state', async () => {
  const t = setup();
  try {
    const result = await discoverPi({ ...t.config, piCommand: '/missing/pi' });
    assert.equal(result.status, 'unavailable');
    assert.match(result.reason, /executable not found/);
  } finally {
    t.close();
  }
});
test('Jove connects Pi models and routes an investigation through the harness', async () => {
  const t = setup();
  const instance = createApp({ ...t.config, piDiscovery: false, seed: true });
  const server = instance.app.listen(0, '127.0.0.1');
  await new Promise<void>((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${(server.address() as any).port}/api`;
  const request = async (route: string, body?: unknown, method = 'POST') => {
    const response = await fetch(base + route, {
      method,
      headers: { 'content-type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    assert.ok(response.ok, await response.clone().text());
    return response.json();
  };
  try {
    await request('/pi/refresh', {});
    const inv = instance.state.investigations[0];
    await request(`/investigations/${inv.id}`, { model }, 'PATCH');
    const result = await request(`/investigations/${inv.id}/messages`, {
      content: 'Inspect source',
    });
    assert.equal(result.content, 'Final verified response');
    assert.equal(result.model, model);
    const state = await request('/state', undefined, 'GET');
    assert.equal(state.pi.status, 'connected');
    assert.deepEqual(state.chatProgress, []);
  } finally {
    instance.close();
    await new Promise<void>((r) => server.close(() => r()));
    t.close();
  }
});

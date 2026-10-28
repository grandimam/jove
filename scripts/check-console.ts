import { chromium } from '@playwright/test';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createApp } from '../server/app.js';
const root = fs.mkdtempSync('/tmp/jove-console-browser-');
const instance = createApp({ dataDir: root, seed: true, piDiscovery: false });
instance.app.use(express.static(path.resolve('dist')));
const server = instance.app.listen(0, '127.0.0.1');
await new Promise<void>((r) => server.once('listening', r));
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${(server.address() as any).port}`);
  await page.getByRole('heading', { name: 'Main investigation' }).waitFor();
  const queue = page.getByRole('complementary', { name: 'Implementation queue' });
  await queue.getByRole('switch', { name: 'Auto-start next implementation' }).click();
  await page.waitForFunction(
    () => !(document.querySelector('[role=switch]') as HTMLInputElement)?.checked,
  );
  const output = page.locator('.console-output.assistant').first();
  const selected = await output
    .locator('.message-content p')
    .first()
    .evaluate((el) => {
      const text = el.firstChild!;
      const range = document.createRange();
      range.setStart(text, 0);
      range.setEnd(text, Math.min(42, text.textContent!.length));
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      return selection.toString().trim();
    });
  await output.getByRole('button', { name: 'Clip selection', exact: true }).waitFor();
  // State polling must leave the DOM selection and inline clip action intact.
  await page.waitForTimeout(2200);
  await page.screenshot({ path: '/tmp/jove-console-inline.png' });
  await output.getByRole('button', { name: 'Clip selection', exact: true }).click();
  const dialog = page.getByRole('dialog');
  const value = await dialog.getByRole('textbox', { name: 'Selected context' }).inputValue();
  if (value !== selected) throw new Error('Clipped selection does not match selected output');
  await dialog.getByRole('textbox', { name: 'Name', exact: true }).fill('Edge cases');
  await dialog.getByRole('button', { name: 'Clip context', exact: true }).click();
  await page.getByRole('heading', { name: 'Edge cases' }).waitFor();
  await page.getByText('From Main investigation', { exact: true }).waitFor();
  await page.screenshot({ path: '/tmp/jove-console-split.png' });
  for (const objective of ['Guard missing financial history', 'Review eligibility edge cases']) {
    if (objective === 'Guard missing financial history')
      await page
        .locator('.console.secondary .console-output.artifact')
        .getByRole('button', { name: 'Add to queue', exact: true })
        .click();
    else await queue.getByRole('button', { name: 'Add implementation' }).click();
    const handoff = page.getByRole('dialog');
    await handoff.getByRole('textbox', { name: 'Objective', exact: true }).fill(objective);
    await handoff.getByRole('button', { name: 'Approve & add to queue' }).click();
    await queue.getByRole('heading', { name: objective }).waitFor();
  }
  const clippedRun = instance.state.runs.find(
    (run) => run.objective === 'Guard missing financial history',
  )!;
  if (
    clippedRun.handoff.findings.length !== 1 ||
    clippedRun.handoff.findings[0] !== selected ||
    clippedRun.handoff.sourceMessageIds.length !== 1
  )
    throw new Error('Clipped artifact handoff lost exact context or provenance');
  await queue.getByRole('button', { name: 'Move Review eligibility edge cases up' }).click();
  await page.waitForFunction(
    () =>
      document.querySelector('.queue-card.queued h3')?.textContent ===
      'Review eligibility edge cases',
  );
  await page.screenshot({ path: '/tmp/jove-queue-desktop.png' });
  const queuedCard = queue.locator('.queue-card.queued').first();
  await queuedCard.getByRole('button', { name: 'Run now' }).click();
  await queue.getByRole('button', { name: 'Review diff' }).waitFor({ timeout: 15000 });
  await page.screenshot({ path: '/tmp/jove-queue-review.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/jove-queue-mobile.png' });
  await page.getByRole('button', { name: 'Toggle implementation queue' }).click();
  await page.screenshot({ path: '/tmp/jove-console-mobile.png' });
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
    throw new Error('Mobile layout overflows');
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(
    'Browser verified: selected text, polling preservation, inline clip, attributed split console, held queue, reorder, subagent completion, review, mobile width.',
  );
} finally {
  await browser.close();
  instance.close();
  await new Promise<void>((r) => server.close(() => r()));
}

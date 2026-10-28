import { fork } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import type { Config, Run, SubagentAttempt } from './types.js';
import { piChat } from './pi.js';

export function createSubagentAttempt(run: Run): SubagentAttempt {
  return {
    id: `agent_${randomUUID().slice(0, 12)}`,
    parentInvestigationId: run.investigationId,
    model: run.model,
    status: 'running',
    startedAt: new Date().toISOString(),
  };
}

/** The only implementation entry point. Every call owns a fresh child process. */
export async function callImplementationSubagent(
  config: Config,
  run: Run,
  attempt: SubagentAttempt,
  root: string,
  signal: AbortSignal,
  onActivity: (text: string) => void,
  onTests: (result: Run['tests'][number]) => void,
) {
  signal.throwIfAborted();
  onActivity(`Subagent ${attempt.id} started with a fresh implementation context.`);
  if (run.model === 'demo') return callDemoSubagent(config, root, signal, onActivity, onTests);
  return piChat(
    { ...config, allowTestExecution: run.handoff.allowTestExecution === true },
    run.model,
    root,
    JSON.stringify({
      role: 'implementation_subagent',
      subagentId: attempt.id,
      parentInvestigationId: run.investigationId,
      approvedHandoff: run.handoff,
      approvedCandidateRevision: run.candidateRevision,
      followup: run.instruction || '',
      previousAttempts: (run.attempts || [])
        .filter((a) => a.id !== attempt.id)
        .map((a) => ({ status: a.status, summary: a.summary })),
      preserveExistingChanges: true,
    }),
    [],
    true,
    onActivity,
    signal,
    onTests,
  );
}

function callDemoSubagent(
  config: Config,
  root: string,
  signal: AbortSignal,
  onActivity: (text: string) => void,
  onTests: (result: Run['tests'][number]) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = fork(fileURLToPath(new URL('./demo-subagent.ts', import.meta.url)), [], {
      execArgv: ['--import', 'tsx'],
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
      detached: process.platform !== 'win32',
    });
    let summary: string | undefined, error: Error | undefined;
    const kill = (name: NodeJS.Signals) => {
      try {
        if (process.platform !== 'win32' && child.pid) process.kill(-child.pid, name);
        else child.kill(name);
      } catch {}
    };
    let force: ReturnType<typeof setTimeout> | undefined;
    const abort = () => {
      error = new Error('Implementation subagent interrupted.');
      kill('SIGTERM');
      force = setTimeout(() => kill('SIGKILL'), 1000);
    };
    signal.addEventListener('abort', abort, { once: true });
    const timeout = setTimeout(() => {
      error = new Error('Implementation subagent timed out.');
      kill('SIGKILL');
    }, config.piTimeoutMs || 60000);
    child.stdout?.resume();
    child.stderr?.resume();
    child.on('message', (message: any) => {
      if (message.type === 'activity') onActivity(message.text);
      if (message.type === 'test') onTests(message.result);
      if (message.type === 'result') summary = message.summary;
      if (message.type === 'error') error = new Error(message.message);
    });
    child.on('error', (e) => {
      error = e;
    });
    child.once('close', (code) => {
      clearTimeout(timeout);
      if (force) clearTimeout(force);
      signal.removeEventListener('abort', abort);
      if (error) reject(error);
      else if (code === 0 && summary) resolve(summary);
      else reject(new Error('Implementation subagent exited before returning a result.'));
    });
    child.send({ root, stepDelay: config.stepDelay || 30 });
    if (signal.aborted) abort();
  });
}

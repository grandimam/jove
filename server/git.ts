import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
export function git(cwd: string, ...args: string[]) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    timeout: 20000,
    maxBuffer: 4 * 1024 * 1024,
  }).trimEnd();
}
export function isSecretPath(relative: string) {
  const parts = relative.replaceAll('\\', '/').toLowerCase().split('/');
  return parts.some(
    (part) =>
      part.startsWith('.env') ||
      [
        '.git',
        '.ssh',
        '.aws',
        '.azure',
        '.gnupg',
        '.npmrc',
        '.pypirc',
        '.netrc',
        'credentials',
        'credentials.json',
        'credentials.yml',
        'credentials.yaml',
        'secrets.json',
        'secrets.yml',
        'secrets.yaml',
        'service-account.json',
      ].includes(part) ||
      /^(id_rsa|id_dsa|id_ecdsa|id_ed25519)(\.|$)/.test(part) ||
      /\.(pem|key|p12|pfx|keystore)$/.test(part),
  );
}
export function safePath(root: string, relative: string, writing = false) {
  if (
    !relative ||
    path.isAbsolute(relative) ||
    relative.split(/[\\/]/).some((p) => p === '..' || p === '.git')
  )
    throw new Error('Only repository-relative paths outside Git metadata are permitted.');
  const target = path.resolve(root, relative);
  const realRoot = fs.realpathSync(root);
  if (target !== root && !target.startsWith(path.resolve(root) + path.sep))
    throw new Error('Path escapes the workspace.');
  let cursor = writing ? path.dirname(target) : target;
  while (!fs.existsSync(cursor)) {
    const parent = path.dirname(cursor);
    if (parent === cursor) throw new Error('Invalid path');
    cursor = parent;
  }
  const actual = fs.realpathSync(cursor);
  if (actual !== realRoot && !actual.startsWith(realRoot + path.sep))
    throw new Error('Symbolic link escapes the workspace.');
  try {
    if (fs.lstatSync(target).isSymbolicLink()) throw new Error('Symbolic links are not supported.');
  } catch (error: any) {
    if (error.code !== 'ENOENT') throw error;
  }
  return target;
}
export function files(root: string) {
  return git(root, 'ls-files', '--cached', '--others', '--exclude-standard')
    .split('\n')
    .filter(Boolean)
    .filter((f) => !f.split('/').includes('node_modules') && !isSecretPath(f))
    .slice(0, 1000);
}
export function version(root: string) {
  const hash = createHash('sha256').update(git(root, 'rev-parse', 'HEAD'));
  for (const f of files(root)) {
    try {
      const p = safePath(root, f);
      const stat = fs.statSync(p);
      if (stat.isFile() && stat.size < 1024 * 1024) hash.update(f).update(fs.readFileSync(p));
    } catch {}
  }
  return hash.digest('hex');
}
export function readFile(root: string, relative: string) {
  if (isSecretPath(relative)) throw new Error('Secret environment files cannot be read.');
  const p = safePath(root, relative);
  if (fs.statSync(p).size > 200000) throw new Error('File exceeds 200 KB reading limit.');
  return fs.readFileSync(p, 'utf8');
}
export function changed(root: string) {
  return git(root, 'status', '--porcelain')
    .split('\n')
    .filter(Boolean)
    .map((l) => l.slice(3).trim());
}
export function diff(root: string) {
  const visible = files(root);
  let result = visible.length
    ? git(root, 'diff', 'HEAD', '--no-ext-diff', '--no-color', '--no-renames', '--', ...visible)
    : '';
  for (const f of git(root, 'ls-files', '--others', '--exclude-standard')
    .split('\n')
    .filter(Boolean)) {
    try {
      result +=
        `\n+++ ${f} (new file)\n` +
        readFile(root, f)
          .split('\n')
          .map((l) => '+' + l)
          .join('\n');
    } catch {}
  }
  return result.slice(0, 200000);
}
export function createFixture(root: string) {
  fs.mkdirSync(path.join(root, 'src'), { recursive: true });
  fs.mkdirSync(path.join(root, 'tests'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify(
      { name: 'credit-engine', private: true, type: 'module', scripts: { test: 'node --test' } },
      null,
      2,
    ),
  );
  fs.writeFileSync(
    path.join(root, 'src', 'feature-store.js'),
    `// Enrich applicant data before evaluating lending rules.\nexport function enrichApplicant(applicant) {\n  return { ...applicant, creditScore: applicant.history.creditScore, income: applicant.history.income };\n}\n`,
  );
  fs.writeFileSync(
    path.join(root, 'src', 'rules.js'),
    `import { enrichApplicant } from './feature-store.js';\nexport function evaluate(applicant) {\n  const enriched = enrichApplicant(applicant);\n  return { eligible: enriched.creditScore >= 650 && enriched.income > 0 };\n}\n`,
  );
  fs.writeFileSync(
    path.join(root, 'tests', 'rules.test.js'),
    `import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { evaluate } from '../src/rules.js';\ntest('qualified applicant is eligible', () => assert.equal(evaluate({ history: { creditScore: 700, income: 50000 } }).eligible, true));\ntest('low credit applicant is not eligible', () => assert.equal(evaluate({ history: { creditScore: 400, income: 50000 } }).eligible, false));\n`,
  );
  git(root, 'init');
  git(root, 'add', '.');
  git(
    root,
    '-c',
    'user.name=Jove',
    '-c',
    'user.email=jove@localhost',
    'commit',
    '-m',
    'Initialize credit engine example',
  );
}

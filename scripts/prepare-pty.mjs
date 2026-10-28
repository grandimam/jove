import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
// node-pty 1.1.0's macOS prebuild can arrive without its helper's executable bit.
if (process.platform === 'darwin') {
  const require = createRequire(import.meta.url);
  const helper = path.join(
    path.dirname(require.resolve('node-pty/package.json')),
    'prebuilds',
    `darwin-${process.arch}`,
    'spawn-helper',
  );
  if (fs.existsSync(helper)) fs.chmodSync(helper, 0o755);
}

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {paper} from '../src/design-system/paper';

const root=fileURLToPath(new URL('../',import.meta.url));
test('Paper components use Tailwind recipes, not a parallel override stylesheet',()=>{
 const directory=path.join(root,'src/design-system');
 assert.deepEqual(fs.readdirSync(directory).filter(file=>file.endsWith('.css')),['paper.css']);
 const css=fs.readFileSync(path.join(directory,'paper.css'),'utf8');
 assert.match(css,/@import 'tailwindcss'/);
 assert.match(css,/@theme inline/);
 assert.match(css,/@layer base/);
 assert.doesNotMatch(css,/@apply|@layer components/);
 assert.doesNotMatch(css,/^\s*\.[a-zA-Z_-]/m,'No component class selectors in the token/base stylesheet');
 const entry=fs.readFileSync(path.join(root,'src/main.tsx'),'utf8');
 assert.equal((entry.match(/import '\.\/design-system\/[^']+\.css'/g)||[]).length,1);
 for(const name of ['app','sidebar','work-heading','investigation-tab','activity-summary','findings-card','candidate-panel','output-tab','output-goals','candidate-field','diff-file','code-row','source-explorer','modal','pane-divider']){
  assert.notEqual(paper(name),name,`${name} must expand to actual Tailwind utilities`);
 }
 assert.match(paper('button primary'),/bg-chalk/);
 assert.match(paper('candidate-panel'),/@container\/output/);
 assert.match(paper('pane-divider'),/focus-visible:after:bg-primary/);
 assert.match(paper('code-row'),/font-mono/);
 assert.equal(paper('active custom-dom-hook'),'active custom-dom-hook','Unstyled state and DOM hooks are preserved');
});

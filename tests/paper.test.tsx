import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {JSDOM} from 'jsdom';
import {parseDiff,splitRows} from '../src/DiffViewer';

const patch=`diff --git a/src/auth.ts b/src/auth.ts
index 1111111..2222222 100644
--- a/src/auth.ts
+++ b/src/auth.ts
@@ -10,3 +10,4 @@
 export function auth() {
-  return session;
+  const token = readToken();
+  return token || session;
 }
diff --git a/new.ts b/new.ts
new file mode 100644
--- /dev/null
+++ b/new.ts
@@ -0,0 +1 @@
+export const enabled = true;
`;
test('recorded diff preserves file state and exact line numbers in both layouts',()=>{
 const files=parseDiff(patch);assert.equal(files.length,2);assert.equal(files[0].path,'src/auth.ts');assert.equal(files[0].status,'Modified');assert.equal(files[1].status,'Added');
 const changed=files[0].rows.filter(r=>r.kind==='addition');assert.deepEqual(changed.map(r=>r.newLine),[11,12]);assert.equal(files[0].rows.at(-1)?.oldLine,12);assert.equal(files[0].rows.at(-1)?.newLine,13);
 const split=splitRows(files[0].rows);assert.equal(split[2].left?.kind,'deletion');assert.equal(split[2].right?.newLine,11);assert.equal(split[3].left,undefined);assert.equal(split[3].right?.newLine,12);
 assert.deepEqual(parseDiff(''),[]);
});

test('changes pane has only Diff and History and scopes patches to the selected tab',async()=>{
 const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost'});
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,MutationObserver:dom.window.MutationObserver,IS_REACT_ACT_ENVIRONMENT:true});
 Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
 const {render,screen,within,fireEvent,cleanup}=await import('@testing-library/react');
 const {default:CandidatePanel}=await import('../src/CandidatePanel');
 const inv={id:'i',workId:'w',title:'Security',model:'demo',isMain:false,createdAt:new Date().toISOString()};
 const output={id:'c',investigationId:'i',version:1,title:'Hybrid authentication',objective:'Preserve compatibility',approach:'Keep sessions and add tokens',affectedFiles:['src/auth.ts'],proposedChanges:['Validate tokens'],assumptions:[],evaluation:[],proposedDiff:patch,createdAt:new Date().toISOString(),sourceMessageIds:[]};
 const state={projects:[],works:[],investigations:[inv],messages:[],runs:[],providers:[],candidates:[output]};
 try{
  const view=render(<CandidatePanel state={state} inv={inv} request={async()=>null} onFile={()=>{}}/>);
  assert.deepEqual(within(screen.getByRole('navigation',{name:'Change views'})).getAllByRole('button').map(button=>button.textContent),['Diff','History','Terminal']);
  assert.ok(screen.getAllByText('Proposed changes · not applied').length);
  assert.equal(screen.queryByRole('button',{name:'Output'}),null);
  fireEvent.click(screen.getByRole('button',{name:'History'}));assert.ok(screen.getByText('No history yet'));
  view.rerender(<CandidatePanel key="other" state={state} inv={{...inv,id:'other',title:'Architecture'}} request={async()=>null} onFile={()=>{}}/>);
  assert.ok(screen.getByRole('heading',{name:'No changes yet'}));assert.equal(screen.queryByText('Hybrid authentication'),null);
 }finally{cleanup();dom.window.close()}
});

test('optional design sections survive validation and removing a proposed patch creates a revision',async()=>{
 const {candidateFields,sameCandidate}=await import('../server/candidates');
 const base={title:'Authentication',objective:'Preserve compatibility',approach:'Keep sessions',affectedFiles:['src/auth.ts'],proposedChanges:[],assumptions:[],evaluation:[]};
 const enriched=candidateFields({...base,goals:['Compatibility'],nonGoals:['Replace sessions'],architecture:['Middleware'],security:['Expiry'],tradeOffs:['Complexity'],proposedDiff:patch});
 assert.equal(enriched.proposedDiff,patch);
 assert.deepEqual(enriched.nonGoals,['Replace sessions']);
 assert.throws(()=>candidateFields({...base,nonGoals:'invalid'}));
 assert.throws(()=>candidateFields({...base,proposedDiff:'x'.repeat(200001)}));
 const revision={...enriched,id:'c',investigationId:'i',version:1,createdAt:'2026-10-29',sourceMessageIds:[]};
 assert.equal(sameCandidate(revision,candidateFields(base)),false);
});

import {JSDOM} from 'jsdom';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createFixture} from '../server/git.js';
import type {Server} from 'node:http';
import React from 'react';
import {createApp} from '../server/app.js';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost'});
Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,HTMLInputElement:dom.window.HTMLInputElement,HTMLTextAreaElement:dom.window.HTMLTextAreaElement,MutationObserver:dom.window.MutationObserver,IS_REACT_ACT_ENVIRONMENT:true});
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
const {render,screen,within,waitFor,cleanup,act}=await import('@testing-library/react');
const {default:userEvent}=await import('@testing-library/user-event');
const {default:App}=await import('../src/App.js');
const originalFetch=globalThis.fetch;
async function setup(stepDelay=25){const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'jove-ui-'));const backend=createApp({dataDir,stepDelay,piDiscovery:false,seed:true});const server=await new Promise<Server>(resolve=>{const s=backend.app.listen(0,'127.0.0.1',()=>resolve(s))});const address=server.address() as any;globalThis.fetch=((input:any,init:any)=>originalFetch(typeof input==='string'&&input.startsWith('/api')?`http://127.0.0.1:${address.port}${input}`:input,init)) as typeof fetch;render(<App/>);await screen.findByRole('heading',{name:'Main investigation'});return {backend,request:(route:string,body:unknown,method='POST')=>globalThis.fetch('/api'+route,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(async response=>{assert.ok(response.ok,await response.clone().text());return response.json()}),user:userEvent.setup({document:dom.window.document}),async close(){cleanup();globalThis.fetch=originalFetch;backend.close();await new Promise<void>(resolve=>server.close(()=>resolve()));fs.rmSync(dataDir,{recursive:true,force:true})}}}
test('UI clips context, preserves drafts during refresh, merges selected findings, and implements from child',async()=>{const ctx=await setup();try{
const composer=screen.getByRole('textbox',{name:'Message Main investigation'});await ctx.user.type(composer,'Keep this unfinished thought');await act(async()=>{await new Promise(r=>setTimeout(r,2200))});assert.equal((composer as HTMLTextAreaElement).value,'Keep this unfinished thought');
await ctx.user.click(screen.getAllByRole('button',{name:'Clip'})[1]);const dialog=screen.getByRole('dialog');await ctx.user.type(within(dialog).getByRole('textbox',{name:'Name'}),'Missing history');await ctx.user.click(within(dialog).getByRole('button',{name:'Clip context'}));await screen.findByRole('heading',{name:'Missing history'});assert.ok(screen.getByText('From Main investigation'));
const childComposer=screen.getByRole('textbox',{name:'Message Missing history'});await ctx.user.type(childComposer,'What is the risk?');const child=childComposer.closest('section')!;await ctx.user.click(within(child).getByRole('button',{name:'Send message'}));await screen.findByText('This is a deterministic local demonstration, not an AI answer. Choose a configured live provider for open-ended investigation.');
await ctx.user.click(within(child).getByRole('button',{name:'Merge'}));const merge=screen.getByRole('dialog');assert.ok(within(merge).getByText('Context only. No code is changed.'));await ctx.user.click(within(merge).getByRole('button',{name:'Merge findings'}));await screen.findByText('Findings merged. Both histories preserved.');
const side=screen.getByRole('heading',{name:'Missing history'}).closest('section')!;await ctx.user.click(within(side).getAllByRole('button',{name:'Add to queue'})[0]);const handoff=screen.getByRole('dialog');assert.ok(within(handoff).getByText(/Demo executes a fixed example patch/));await ctx.user.click(within(handoff).getByRole('button',{name:'Approve & add to queue'}));await waitFor(()=>assert.equal(ctx.backend.state.runs[0]?.status,'completed'),{timeout:10000});const update=await screen.findByRole('article',{name:`Task update: ${ctx.backend.state.runs[0].objective}`});assert.equal(screen.getAllByRole('article',{name:`Task update: ${ctx.backend.state.runs[0].objective}`}).length,1);assert.equal(update.textContent?.includes('agent_'),false);await ctx.user.click(await screen.findByRole('button',{name:'Review diff'}));await ctx.user.click(screen.getByRole('button',{name:'Tests'}));await screen.findByText('passed',{exact:true});assert.ok(screen.getByText(/missing financial history is safely ineligible/));assert.equal(ctx.backend.state.runs[0].investigationId,ctx.backend.state.investigations.find(i=>i.title==='Missing history')!.id);
}finally{await ctx.close()}});
test('UI creates project and work, cancels dialog without mutation, and opens provider settings',async()=>{const ctx=await setup();try{
await ctx.user.click(screen.getAllByRole('button',{name:'Import project'})[0]);let dialog=screen.getByRole('dialog');await within(dialog).findByRole('button',{name:'Browse path'});await ctx.user.click(within(dialog).getByRole('button',{name:'Cancel'}));assert.equal(ctx.backend.state.projects.length,1);await ctx.user.click(screen.getAllByRole('button',{name:'Import project'})[0]);dialog=screen.getByRole('dialog');await ctx.user.click(within(dialog).getByRole('button',{name:'Cancel'}));assert.equal(ctx.backend.state.projects.length,1);
await ctx.user.click(screen.getAllByRole('button',{name:'Import project'})[0]);dialog=screen.getByRole('dialog');const repo=fs.mkdtempSync(path.join(ctx.backend.state.projects[0].path,'ui-codebase-'));createFixture(repo);await waitFor(()=>assert.ok((within(dialog).getByRole('textbox',{name:'Codebase path'}) as HTMLInputElement).value));await ctx.user.clear(within(dialog).getByRole('textbox',{name:'Codebase path'}));await ctx.user.type(within(dialog).getByRole('textbox',{name:'Codebase path'}),repo);await ctx.user.click(within(dialog).getByRole('button',{name:'Browse path'}));await waitFor(()=>assert.equal((within(dialog).getByRole('button',{name:'Import codebase'}) as HTMLButtonElement).disabled,false));await ctx.user.click(within(dialog).getByRole('button',{name:'Import codebase'}));await waitFor(()=>assert.equal(ctx.backend.state.projects.length,2));await screen.findByRole('button',{name:'Start new work'});await ctx.user.click(screen.getByRole('button',{name:'Start new work'}));dialog=screen.getByRole('dialog');await ctx.user.type(within(dialog).getByRole('textbox',{name:'Work objective'}),'Test fresh work');await ctx.user.click(within(dialog).getByRole('button',{name:'Create work'}));await waitFor(()=>assert.equal(ctx.backend.state.works.length,2));await screen.findByRole('heading',{name:'Main investigation'});assert.equal(ctx.backend.state.works.at(-1)!.title,'Test fresh work');
await ctx.user.click(screen.getByRole('button',{name:'Settings'}));assert.ok(screen.getByRole('heading',{name:'Powered by Pi.'}));assert.ok(screen.getByText('Pi is unavailable',{exact:true}));await ctx.user.click(screen.getByRole('button',{name:'Done'}));assert.equal(screen.queryByRole('dialog'),null);
}finally{await ctx.close()}});

test('sidebar tasks start, pause, resume, and open persistent task details',async()=>{const ctx=await setup(2500);try{
const queue=await screen.findByRole('navigation',{name:'Tasks'});
await ctx.request(`/works/${ctx.backend.state.works[0].id}/queue`,{autoStart:false},'PATCH');
assert.equal(within(queue).queryByText('Up next'),null);
assert.equal(within(queue).queryByRole('switch'),null);
assert.equal(document.querySelector('.sidebar input'),null);
for(const objective of ['First queued fix','Second queued fix']){
 await ctx.user.click(screen.getAllByRole('button',{name:'Add to queue'})[0]);const dialog=screen.getByRole('dialog');const field=within(dialog).getByRole('textbox',{name:'Objective'});await ctx.user.clear(field);await ctx.user.type(field,objective);await ctx.user.click(within(dialog).getByRole('button',{name:'Approve & add to queue'}));await within(queue).findByRole('heading',{name:objective});
}
assert.equal(ctx.backend.state.runs.length,2);
await ctx.user.click(within(queue).getByRole('button',{name:'Start First queued fix'}));
await ctx.user.click(await within(queue).findByRole('button',{name:'Pause First queued fix'}));
await waitFor(()=>assert.equal(ctx.backend.state.runs[0].status,'paused'));
await waitFor(()=>assert.equal(ctx.backend.state.runs[0].attempts?.[0].status,'paused'),{timeout:5000});
assert.equal((within(queue).getByRole('button',{name:'Start Second queued fix'}) as HTMLButtonElement).disabled,true);
await ctx.user.click(await within(queue).findByRole('button',{name:'Resume First queued fix'}));
await waitFor(()=>assert.equal(ctx.backend.state.runs[0].status,'completed'),{timeout:15000});
const review=await within(queue).findByRole('button',{name:'Review diff'},{timeout:5000});
assert.equal(ctx.backend.state.runs[0].attempts?.length,2);
assert.equal(ctx.backend.state.runs[1].status,'queued');
await ctx.user.click(review);await screen.findByRole('button',{name:'Back to investigations'});
await ctx.user.click(screen.getByRole('button',{name:'Back to investigations'}));
assert.ok(document.querySelector('.sidebar')?.contains(queue));
await ctx.user.click(within(queue).getByRole('button',{name:/Second queued fix Queued/}));
assert.ok(within(queue).getByRole('button',{name:/Second queued fix Queued/}).getAttribute('aria-current'));
await ctx.user.click(within(screen.getByRole('navigation',{name:'Investigations'})).getByRole('button',{name:'Main investigation'}));
assert.equal(screen.queryByRole('button',{name:'Back to investigations'}),null);
assert.ok(screen.getByRole('navigation',{name:'Tasks'}));
}finally{await ctx.close()}});

test('workspace loading shows Jove until the initial state arrives',async()=>{
 let finish!:(response:Response)=>void;
 globalThis.fetch=(()=>new Promise<Response>(resolve=>{finish=resolve})) as typeof fetch;
 try{
  render(<App/>);
  assert.ok(screen.getByRole('status').textContent?.includes('Opening your workspace'));
  assert.equal(screen.queryByRole('heading',{name:'Projects'}),null);
  await act(async()=>{finish(new Response(JSON.stringify({projects:[],works:[],investigations:[],messages:[],runs:[],providers:[]})))});
  await screen.findByRole('heading',{name:'Projects'});
  assert.equal(screen.queryByRole('status'),null);
 }finally{cleanup();globalThis.fetch=originalFetch;}
});

test('Graphite navigation has one selected destination and dialogs retain keyboard focus',async()=>{
 const ctx=await setup();
 try{
  const navigation=screen.getByRole('navigation',{name:'Investigations'});
  assert.equal(within(navigation).getAllByRole('button').filter(button=>button.getAttribute('aria-current')==='page').length,1);
  assert.ok(document.querySelector('.investigation-tabs'));
  const tasks=screen.getByRole('navigation',{name:'Tasks'});
  assert.equal(within(tasks).queryByText('Tasks'),null);
  const toggle=within(tasks).getByRole('button',{name:/Toggle tasks for/});
  assert.equal(toggle.getAttribute('aria-expanded'),'true');
  await ctx.user.click(toggle);
  assert.equal(toggle.getAttribute('aria-expanded'),'false');
  assert.equal(document.getElementById(toggle.getAttribute('aria-controls')!)?.hidden,true);
  await ctx.user.click(toggle);
  assert.equal(document.getElementById(toggle.getAttribute('aria-controls')!)?.hidden,false);
  assert.equal(within(tasks).queryByText('Main investigation'),null);
  const settings=screen.getByRole('button',{name:'Settings'});
  await ctx.user.click(settings);
  const dialog=screen.getByRole('dialog',{name:'Settings'});
  const buttons=within(dialog).getAllByRole('button');
  buttons.at(-1)!.focus();
  await ctx.user.tab();
  assert.equal(document.activeElement,buttons[0]);
  await ctx.user.tab({shift:true});
  assert.equal(document.activeElement,buttons.at(-1));
  await ctx.user.keyboard('{Escape}');
  assert.equal(screen.queryByRole('dialog'),null);
  assert.equal(document.activeElement,settings);
 }finally{await ctx.close()}
});

test('each work expands its own tasks and opening a task selects its owning work',async()=>{
 const ctx=await setup();
 try{
  const first=ctx.backend.state.works[0];
  const second=await ctx.request('/works',{projectId:first.projectId,title:'Second work',objective:'Separate execution'});
  await ctx.request(`/works/${second.work.id}/queue`,{autoStart:false},'PATCH');
  await ctx.request('/runs',{investigationId:second.investigation.id,objective:'Second work execution',model:'demo',queue:true});
  const toggle=await screen.findByRole('button',{name:'Toggle tasks for Second work'},{timeout:5000});
  assert.equal(toggle.getAttribute('aria-expanded'),'false');
  const firstTasks=screen.getByRole('navigation',{name:'Tasks'});
  await ctx.user.click(toggle);
  const secondTasks=screen.getByRole('navigation',{name:'Tasks for Second work'});
  assert.equal(within(firstTasks).queryByRole('heading',{name:'Second work execution'}),null);
  await ctx.user.click(within(secondTasks).getByRole('button',{name:'Second work execution Queued'}));
  await screen.findByRole('heading',{name:'Second work execution',level:1});
  assert.equal(screen.getByRole('navigation',{name:'Tasks'}),secondTasks);
  assert.equal(within(secondTasks).getByRole('button',{name:'Second work execution Queued'}).getAttribute('aria-current'),'page');
  await ctx.user.click(screen.getByRole('button',{name:'Back to investigations'}));
  assert.equal(screen.getByRole('textbox',{name:'Message Main investigation'}).textContent,'');
 }finally{await ctx.close()}
});

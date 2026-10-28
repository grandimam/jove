import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { createApp } from '../server/app.js';
import { safePath, git } from '../server/git.js';
async function until(check:()=>boolean){for(let i=0;i<150&&!check();i++)await new Promise(r=>setTimeout(r,20));assert.ok(check(),'Timed out waiting for subagent');}
async function setup(){ const root=fs.mkdtempSync(path.join(os.tmpdir(),'jove-test-'));const instance=createApp({dataDir:root,stepDelay:30,piDiscovery:false,seed:true});const server=instance.app.listen(0,'127.0.0.1');await once(server,'listening');const address=server.address() as {port:number};const api=async(route:string,body?:unknown,method?:string)=>{const response=await fetch(`http://127.0.0.1:${address.port}/api${route}`,{method:method||(body?'POST':'GET'),headers:{'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,body:await response.json() as any};};return {root,instance,api,stop:async()=>{instance.close();await until(()=>!fs.existsSync(path.join(root,'server.lock')));await new Promise<void>(resolve=>server.close(()=>resolve()));fs.rmSync(root,{recursive:true,force:true});}};}
test('seed has persisted investigations, isolated Git worktree, and real source evidence',async()=>{const t=await setup();try{const s=(await t.api('/state')).body;assert.equal(s.projects.length,1);assert.equal(s.investigations.length,2);assert.equal(s.messages[1].confidence,'verified_against_current_code');const w=t.instance.state.works[0];assert.notEqual(w.path,t.instance.state.projects[0].path);assert.ok(git(w.path,'branch','--show-current').startsWith('jove/'));assert.equal(s.works[0].path,undefined);assert.equal(s.providers.find((p:any)=>p.id==='pi').available,false);}finally{await t.stop();}});
test('clip retains provenance, independent model, and merge does not concatenate history',async()=>{const t=await setup();try{const s=t.instance.state;const main=s.investigations[0];const message=s.messages[1];const clip=await t.api('/investigations',{workId:main.workId,title:'History safety',model:'demo',clip:{content:'Missing history throws.',sourceInvestigationId:main.id,sourceMessageId:message.id}});assert.equal(clip.status,201);assert.equal(clip.body.sourceMessageId,message.id);const merge=await t.api(`/investigations/${clip.body.id}/merge`,{targetId:main.id,findings:['Missing history needs an explicit fallback.']});assert.equal(merge.status,201);assert.equal(merge.body.sourceInvestigationId,clip.body.id);assert.match(merge.body.content,/No code or Git changes/);assert.equal(s.investigations.length,3);assert.equal(s.messages.filter(m=>m.investigationId===clip.body.id).length,1);}finally{await t.stop();}});
test('implementation writes only isolated worktree, executes tests, flags evidence stale, and enforces single writer',async()=>{const t=await setup();try{const s=t.instance.state;const inv=s.investigations[1];const payload={investigationId:inv.id,objective:'Handle incomplete history as ineligible',model:'demo',findings:['Missing history throws'],constraints:['Keep existing behavior'],acceptanceCriteria:['Tests pass'],openQuestions:[]};const r=await t.api('/runs',payload);assert.equal(r.status,201);assert.equal((await t.api('/runs',payload)).status,409);for(let i=0;i<50&&s.runs[0].status==='running';i++)await new Promise(r=>setTimeout(r,30));assert.equal(s.runs[0].status,'completed');assert.equal(s.runs[0].tests[0].status,'passed');assert.match((await t.api(`/runs/${r.body.id}/diff`)).body.diff,/history\?/);assert.match(fs.readFileSync(path.join(s.projects[0].path,'src/feature-store.js'),'utf8'),/history.creditScore/);assert.ok((await t.api('/state')).body.messages.some((m:any)=>m.stale));assert.equal(s.runs[0].handoff.sourceInvestigationId,inv.id);}finally{await t.stop();}});
test('pause, resume and safe archive preserve changes',async()=>{const t=await setup();try{const inv=t.instance.state.investigations[0];const r=(await t.api('/runs',{investigationId:inv.id,objective:'Fix missing history',model:'demo'})).body;assert.equal((await t.api(`/runs/${r.id}/control`,{action:'pause'})).body.status,'paused');assert.equal((await t.api(`/works/${inv.workId}/archive`,{})).status,409);assert.equal((await t.api(`/runs/${r.id}/control`,{action:'interrupt'})).body.status,'interrupted');await until(()=>Boolean(t.instance.state.runs[0].attempts?.at(-1)?.endedAt));assert.equal((await t.api(`/runs/${r.id}/control`,{action:'resume'})).body.status,'running');await t.api(`/runs/${r.id}/control`,{action:'interrupt'});await until(()=>Boolean(t.instance.state.runs[0].attempts?.at(-1)?.endedAt));assert.equal((await t.api(`/works/${inv.workId}/archive`,{})).status,200);assert.ok(fs.existsSync(t.instance.state.works[0].path));assert.equal((await t.api(`/investigations/${inv.id}/messages`,{content:'hello'})).status,409);}finally{await t.stop();}});
test('path traversal and symlink escapes are rejected',()=>{const root=fs.mkdtempSync(path.join(os.tmpdir(),'jove-safe-'));try{assert.throws(()=>safePath(root,'../escape',true));assert.throws(()=>safePath(root,'.git/config',true));fs.symlinkSync(os.tmpdir(),path.join(root,'link'));assert.throws(()=>safePath(root,'link/escape',true));}finally{fs.rmSync(root,{recursive:true,force:true});}});
test('unavailable provider is rejected before a run, and cross-work clips are rejected',async()=>{const t=await setup();try{const s=t.instance.state;assert.equal((await t.api('/runs',{investigationId:s.investigations[0].id,objective:'test',model:'pi'})).status,400);const created=(await t.api('/works',{projectId:s.projects[0].id,title:'Other work',objective:'Different objective'})).body;assert.equal((await t.api('/investigations',{workId:created.work.id,title:'Invalid clip',model:'demo',clip:{content:'x',sourceInvestigationId:s.investigations[0].id,sourceMessageId:s.messages[0].id}})).status,400);}finally{await t.stop();}});
test('clips can be added to an existing investigation without rewriting its history',async()=>{const t=await setup();try{const s=t.instance.state;const source=s.investigations[0],target=s.investigations[1];const before=s.messages.filter(m=>m.investigationId===target.id).length;const r=await t.api(`/investigations/${target.id}/clips`,{content:'Selected code span',sourceInvestigationId:source.id,sourceMessageId:s.messages[1].id});assert.equal(r.status,201);assert.equal(s.messages.filter(m=>m.investigationId===target.id).length,before+1);assert.equal(r.body.sourceMessageId,s.messages[1].id);}finally{await t.stop();}});
test('clip via messages API is an attributed artifact and merge records individual sources',async()=>{const t=await setup();try{const s=t.instance.state,main=s.investigations[0],child=s.investigations[1];const r=await t.api(`/investigations/${child.id}/messages`,{content:'Selected span',clip:{sourceInvestigationId:main.id,sourceMessageId:s.messages[1].id}});assert.equal(r.body.role,'artifact');assert.equal(r.body.sourceMessageId,s.messages[1].id);const sources=s.messages.filter(m=>m.investigationId===child.id);const merge=await t.api(`/investigations/${child.id}/merge`,{targetId:main.id,findings:['Claim A','Claim B'],sourceMessageIds:[sources[0].id,sources[1].id]});assert.equal(merge.status,201);assert.deepEqual(merge.body.sourceMessageIds,[sources[0].id,sources[1].id]);assert.equal(merge.body.findingSources.length,2);}finally{await t.stop();}});
test('Pi repository tools enforce read-only mode, freshness and recovery',async()=>{
 const {createRepositoryTools}=await import('../server/repository-tools.js');
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'jove-pi-tools-'));
 try{
  fs.writeFileSync(path.join(root,'source.js'),'original');
  const read=createRepositoryTools({},root,false);
  assert.equal(await read('read_file',{path:'source.js'}),'original');
  await assert.rejects(read('write_file',{path:'source.js',content:'overwrite'}),/Read-only/);
  await assert.rejects(read('read_file',{path:'.env'}),/Secret/);
  const write=createRepositoryTools({checkpointDir:path.join(root,'recovery')},root,true);
  await assert.rejects(write('write_file',{path:'source.js',content:'overwrite'}),/Read this file/);
  await write('read_file',{path:'source.js'});
  fs.writeFileSync(path.join(root,'source.js'),'concurrent edit');
  await assert.rejects(write('write_file',{path:'source.js',content:'overwrite'}),/Read this file/);
  await write('read_file',{path:'source.js'});
  await write('write_file',{path:'source.js',content:'approved change'});
  assert.equal(fs.readFileSync(path.join(root,'recovery','source.js'),'utf8'),'concurrent edit');
  assert.equal(fs.readFileSync(path.join(root,'source.js'),'utf8'),'approved change');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('restart marks unfinished runs interrupted without deleting their workspace',async()=>{const t=await setup();try{const s=t.instance.state;const run=(await t.api('/runs',{investigationId:s.investigations[0].id,objective:'Fix history',model:'demo'})).body;await t.api(`/runs/${run.id}/control`,{action:'pause'});t.instance.close();await until(()=>!fs.existsSync(path.join(t.root,'server.lock')));const second=createApp({dataDir:t.root,seed:false,piDiscovery:false});assert.equal(second.state.runs[0].status,'interrupted');assert.ok(fs.existsSync(second.state.works[0].path));second.close();}finally{await t.stop();}});
test('demo refuses symlinked write destinations without touching outside files',async()=>{const t=await setup();try{const w=t.instance.state.works[0];const outside=path.join(t.root,'outside.js');fs.writeFileSync(outside,'secret outside file');fs.unlinkSync(path.join(w.path,'src/feature-store.js'));fs.symlinkSync(outside,path.join(w.path,'src/feature-store.js'));await t.api('/runs',{investigationId:t.instance.state.investigations[0].id,objective:'Fix example',model:'demo'});for(let i=0;i<20&&t.instance.state.runs[0].status==='running';i++)await new Promise(r=>setTimeout(r,30));assert.equal(t.instance.state.runs[0].status,'failed');assert.equal(fs.readFileSync(outside,'utf8'),'secret outside file');}finally{await t.stop();}});
test('tracked and untracked secret files are excluded from context and diffs',async()=>{const t=await setup();const {diff,files,readFile}=await import('../server/git.js');try{const w=t.instance.state.works[0];fs.writeFileSync(path.join(w.path,'.env'),'TOP_SECRET=old');git(w.path,'add','.env');git(w.path,'-c','user.name=Test','-c','user.email=test@localhost','commit','-m','Secret fixture');fs.writeFileSync(path.join(w.path,'.env'),'TOP_SECRET=changed');fs.writeFileSync(path.join(w.path,'private.pem'),'PRIVATE KEY HERE');assert.equal(files(w.path).includes('.env'),false);assert.throws(()=>readFile(w.path,'private.pem'));assert.doesNotMatch(diff(w.path),/TOP_SECRET|PRIVATE KEY HERE/);}finally{await t.stop();}});
test('one server process owns a data directory until closed',async()=>{const t=await setup();try{assert.throws(()=>createApp({dataDir:t.root,seed:false,piDiscovery:false}),/already owned/);assert.ok(fs.existsSync(path.join(t.root,'server.lock')));t.instance.close();assert.equal(fs.existsSync(path.join(t.root,'server.lock')),false);const next=createApp({dataDir:t.root,seed:false,piDiscovery:false});next.close();}finally{await t.stop();}});
test('Pi verification requires handoff approval and reports actual command output',async()=>{
 const {createRepositoryTools}=await import('../server/repository-tools.js');
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'jove-pi-tests-'));
 const testCommand=['node','-e','process.stdout.write("verified")'];
 try{
  const denied=createRepositoryTools({testCommand},root,true);
  assert.equal((await denied('run_tests',{}) as any).status,'not_run');
  const approved=createRepositoryTools({testCommand,allowTestExecution:true},root,true);
  const result=await approved('run_tests',{}) as any;
  assert.equal(result.status,'passed');assert.equal(result.output,'verified');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('dangling symlinks are rejected before creating an external file',()=>{const root=fs.mkdtempSync(path.join(os.tmpdir(),'jove-dangling-'));try{const outside=path.join(root,'outside-missing.txt');const workspace=path.join(root,'workspace');fs.mkdirSync(workspace);fs.symlinkSync(outside,path.join(workspace,'new.txt'));assert.throws(()=>safePath(workspace,'new.txt',true),/Symbolic links/);assert.equal(fs.existsSync(outside),false);}finally{fs.rmSync(root,{recursive:true,force:true});}});

test('normal startup has no static projects and imports canonical local codebases',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'jove-import-'));
 const instance=createApp({dataDir:root,piDiscovery:false});const server=instance.app.listen(0,'127.0.0.1');await once(server,'listening');const base=`http://127.0.0.1:${(server.address() as any).port}/api`;
 try{
  assert.equal(instance.state.projects.length,0);
  const {createFixture}=await import('../server/git.js');const repo=path.join(root,'my-code');createFixture(repo);
  const listing=await (await fetch(base+'/directories?path='+encodeURIComponent(root))).json() as any;assert.ok(listing.directories.some((d:any)=>d.name==='my-code'&&d.isRepository));
  const request=()=>fetch(base+'/projects',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({path:path.join(repo,'src')})});
  const imported=await request();assert.equal(imported.status,201);const project=await imported.json() as any;assert.equal(project.name,'my-code');assert.equal(project.path,fs.realpathSync(repo));assert.equal(project.isDemo,false);
  assert.equal(project.work.title,'Primary work');assert.equal(project.work.isPrimary,true);
  assert.equal(project.work.projectId,project.id);assert.notEqual(project.work.path,project.path);
  assert.equal(project.investigation.workId,project.work.id);assert.equal(project.investigation.isMain,true);
  const saved=JSON.parse(fs.readFileSync(path.join(root,'state.json'),'utf8'));
  assert.equal(saved.works[0].id,project.work.id);assert.equal(saved.works[0].isPrimary,true);
  assert.equal(saved.investigations[0].id,project.investigation.id);
  assert.equal((await request()).status,400);
  assert.equal(instance.state.works.length,1);assert.equal(instance.state.investigations.length,1);
  const emptyRepo=path.join(root,'empty');fs.mkdirSync(emptyRepo);git(emptyRepo,'init');
  const failed=await fetch(base+'/projects',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({path:emptyRepo})});
  assert.equal(failed.status,400);assert.equal(instance.state.projects.length,1);assert.equal(instance.state.works.length,1);
 }finally{instance.close();await new Promise<void>(r=>server.close(()=>r()));fs.rmSync(root,{recursive:true,force:true});}
});


test('queue persists order and auto-start setting, then serially creates independent subagents',async()=>{
 const t=await setup();try{
  const s=t.instance.state,work=s.works[0],inv=s.investigations[0];
  assert.equal((await t.api(`/works/${work.id}/queue`,{autoStart:false},'PATCH')).status,200);
  const enqueue=(objective:string)=>t.api('/runs',{investigationId:inv.id,objective,model:'demo',queue:true});
  const a=(await enqueue('First task')).body,b=(await enqueue('Second task')).body;
  assert.equal(a.status,'queued');assert.equal(b.status,'queued');assert.equal(s.runs[0].attempts,undefined);
  assert.equal((await t.api(`/works/${work.id}/queue/reorder`,{runIds:[b.id]})).status,409);
  assert.equal((await t.api(`/works/${work.id}/queue/reorder`,{runIds:[b.id,a.id]})).status,200);
  const saved=JSON.parse(fs.readFileSync(path.join(t.root,'state.json'),'utf8'));
  assert.equal(saved.works[0].queueAutoStart,false);assert.equal(saved.runs.find((r:any)=>r.id===b.id).queueOrder,1);
  assert.equal((await t.api(`/works/${work.id}/queue`,{autoStart:true},'PATCH')).status,200);
  assert.equal(s.runs.find(r=>r.id===b.id)?.status,'running');assert.equal(s.runs.find(r=>r.id===a.id)?.status,'queued');
  assert.equal((await t.api(`/runs/${a.id}/control`,{action:'start'})).status,409);
  await until(()=>s.runs.every(r=>r.status==='completed'));
  const first=s.runs.find(r=>r.id===b.id)!,second=s.runs.find(r=>r.id===a.id)!;
  assert.notEqual(first.attempts![0].id,second.attempts![0].id);
  assert.ok(first.attempts![0].endedAt!<=second.attempts![0].startedAt);
  assert.ok(s.messages.some(m=>m.sourceRunId===second.id&&m.confidence==='subagent_result_requires_review'));
 }finally{await t.stop();}
});
test('paused subagent holds its worktree; resume creates fresh attempt and cancellation removes upcoming work',async()=>{
 const t=await setup();try{
  const s=t.instance.state,inv=s.investigations[0];
  const create=()=>t.api('/runs',{investigationId:inv.id,objective:'Fix history',model:'demo',queue:true});
  const a=(await create()).body;await t.api(`/runs/${a.id}/control`,{action:'pause'});const b=(await create()).body;
  await until(()=>Boolean(s.runs[0].attempts?.[0].endedAt));assert.equal(s.runs[1].status,'queued');
  assert.equal((await t.api(`/runs/${b.id}/control`,{action:'start'})).status,409);
  await t.api(`/runs/${b.id}/control`,{action:'cancel'});assert.equal(s.runs[1].status,'interrupted');assert.equal(s.runs[1].attempts,undefined);
  await t.api(`/runs/${a.id}/control`,{action:'resume'});await until(()=>s.runs[0].status==='completed');
  assert.equal(s.runs[0].attempts?.length,2);assert.notEqual(s.runs[0].attempts![0].id,s.runs[0].attempts![1].id);
 }finally{await t.stop();}
});

test('failed subagent pauses upcoming work, and explicit handoff sources are scoped',async()=>{
 const t=await setup();try{
  const s=t.instance.state,inv=s.investigations[0],work=s.works[0];
  await t.api(`/works/${work.id}/queue`,{autoStart:false},'PATCH');
  const payload={investigationId:inv.id,objective:'Fix history',model:'demo',queue:true,sourceMessageIds:[s.messages[1].id]};
  assert.equal((await t.api('/runs',{...payload,sourceMessageIds:[s.messages[2].id]})).status,400);
  const a=(await t.api('/runs',payload)).body;await t.api('/runs',payload);
  assert.deepEqual(s.runs[0].handoff.sourceMessageIds,[s.messages[1].id]);
  const outside=path.join(t.root,'outside.js');fs.writeFileSync(outside,'do not touch');fs.unlinkSync(path.join(work.path,'src/feature-store.js'));fs.symlinkSync(outside,path.join(work.path,'src/feature-store.js'));
  await t.api(`/works/${work.id}/queue`,{autoStart:true},'PATCH');await until(()=>s.runs[0].status==='failed');
  assert.equal(work.queueAutoStart,false);assert.equal(s.runs[1].status,'queued');assert.equal(s.runs[1].attempts,undefined);
  assert.equal((await t.api(`/runs/${a.id}/diff`)).body.snapshot,true);
 }finally{await t.stop();}
});
test('completed run review is stable when subsequent worktree edits arrive',async()=>{
 const t=await setup();try{
  const s=t.instance.state;const run=(await t.api('/runs',{investigationId:s.investigations[0].id,objective:'Fix history',model:'demo'})).body;
  await until(()=>s.runs[0].status==='completed');const before=(await t.api(`/runs/${run.id}/diff`)).body;
  fs.writeFileSync(path.join(s.works[0].path,'later.txt'),'Later task change');
  const after=(await t.api(`/runs/${run.id}/diff`)).body;assert.deepEqual(after,before);assert.match(after.scope,/Cumulative/);assert.equal(after.snapshot,true);
 }finally{await t.stop();}
});

test('inline terminal runs in the work directory, resizes, accepts input and closes',async()=>{
 const t=await setup();try{
  const work=t.instance.state.works[0];
  const opened=await t.api(`/works/${work.id}/terminal`,{});assert.equal(opened.status,200);
  const session=opened.body.id;assert.ok(session);
  assert.equal((await t.api(`/works/${work.id}/terminal/resize`,{session,cols:100,rows:30})).status,200);
  const marker=path.join(work.path,'terminal-check.txt');
  assert.equal((await t.api(`/works/${work.id}/terminal/input`,{session,data:"printf 'inline-terminal-ok' > terminal-check.txt\r"})).status,200);
  await until(()=>fs.existsSync(marker));assert.equal(fs.readFileSync(marker,'utf8'),'inline-terminal-ok');
  assert.equal((await t.api(`/works/${work.id}/terminal/input`,{session:'invalid',data:'pwd\r'})).status,400);
  assert.equal((await t.api(`/works/${work.id}/terminal`,{},'DELETE')).status,200);
  assert.equal((await t.api(`/works/${work.id}/terminal/input`,{session,data:'pwd\r'})).status,400);
 }finally{await t.stop();}
});

test('new tabs inherit only the model and closing tabs preserves history',async()=>{
 const t=await setup();try{
  const general=t.instance.state.investigations.find(i=>i.isMain)!;
  const sourceCount=t.instance.state.messages.filter(m=>m.investigationId===general.id).length;
  const created=await t.api('/investigations',{workId:general.workId,title:'New tab'});assert.equal(created.status,201);assert.equal(created.body.model,general.model);
  assert.equal(t.instance.state.messages.filter(m=>m.investigationId===created.body.id).length,0);
  assert.equal(t.instance.state.candidates.filter(c=>c.investigationId===created.body.id).length,0);
  const removed=await t.api(`/investigations/${general.id}`,{},'DELETE');assert.equal(removed.status,200);
  assert.equal(t.instance.state.messages.filter(m=>m.investigationId===general.id).length,sourceCount);
  assert.equal((await t.api('/state')).body.investigations.some((i:any)=>i.id===general.id),false);
  for(const inv of (await t.api('/state')).body.investigations)await t.api(`/investigations/${inv.id}`,{},'DELETE');
  const tabs=(await t.api('/state')).body.investigations;assert.equal(tabs.length,1);assert.equal(tabs[0].title,'General');assert.equal(tabs[0].isMain,true);
 }finally{await t.stop();}
});

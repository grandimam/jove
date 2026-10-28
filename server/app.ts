import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { git, version, changed, diff, createFixture, readFile } from './git.js';
import {callImplementationSubagent,createSubagentAttempt} from './subagent.js';
import { discoverPi, piChat } from './pi.js';
import type { Config, State, Work, Investigation, Message, Run, PiConnection, ChatProgress } from './types.js';
const id=(prefix:string)=>`${prefix}_${randomUUID().slice(0,12)}`;
const now=()=>new Date().toISOString();
const required=(value:unknown,name:string,max=12000)=>{if(typeof value!=='string'||!value.trim()||value.length>max) throw Object.assign(new Error(`${name} must contain 1–${max} characters.`),{status:400});return value.trim();};
const strings=(value:unknown)=>Array.isArray(value)?value.filter(x=>typeof x==='string').map(x=>x.slice(0,10000)).slice(0,50):[];
export function createApp(options:Config={}) {
 const config:Config={dataDir:process.env.JOVE_DATA_DIR||path.join(os.homedir(),'.jove'),piCommand:process.env.JOVE_PI_COMMAND||'pi',stepDelay:650,seed:process.env.JOVE_DEMO==='1',...options};
 if(!config.testCommand && process.env.JOVE_TEST_COMMAND) { const command=JSON.parse(process.env.JOVE_TEST_COMMAND); if(!Array.isArray(command)||!command.every(x=>typeof x==='string')) throw new Error('JOVE_TEST_COMMAND must be a JSON string array.'); config.testCommand=command; }
 const root=config.dataDir!; fs.mkdirSync(root,{recursive:true}); const stateFile=path.join(root,'state.json');
 const lockFile=path.join(root,'server.lock'); const lockToken=randomUUID();
 const claimLock=()=>{const fd=fs.openSync(lockFile,'wx',0o600);try{fs.writeFileSync(fd,JSON.stringify({pid:process.pid,token:lockToken}));}finally{fs.closeSync(fd);}};
 try{claimLock();}catch(error:any){
  if(error.code!=='EEXIST')throw error;
  const recovery=lockFile+'.recovery';try{fs.mkdirSync(recovery);}catch{throw new Error('Another process is checking the data directory lock. Retry after it finishes.');}
  try{
   let owner:{pid:number;token:string};try{owner=JSON.parse(fs.readFileSync(lockFile,'utf8'));if(!Number.isSafeInteger(owner.pid)||owner.pid<1)throw new Error('Invalid PID');}catch{throw new Error('Data directory contains an unreadable server lock. Inspect it manually before recovery.');}
   let active=true;try{process.kill(owner.pid,0);}catch(e:any){if(e.code==='ESRCH')active=false;}
   if(active)throw new Error('This data directory is already owned by a running Jove server. Stop that server first.');
   fs.unlinkSync(lockFile);claimLock();
  }finally{fs.rmdirSync(recovery);}
 }

 const releaseLock=()=>{try{if(JSON.parse(fs.readFileSync(lockFile,'utf8')).token===lockToken)fs.unlinkSync(lockFile);}catch{}};
 const onExit=()=>releaseLock();process.once('exit',onExit);

 const state:State=fs.existsSync(stateFile)?JSON.parse(fs.readFileSync(stateFile,'utf8')):{projects:[],works:[],investigations:[],messages:[],runs:[]};
 for(const work of state.works)work.queueAutoStart??=true;
 const save=()=>{const temp=stateFile+'.'+randomUUID()+'.tmp';fs.writeFileSync(temp,JSON.stringify(state,null,2),{mode:0o600});fs.renameSync(temp,stateFile);};
 for(const r of state.runs) if(['running','paused'].includes(r.status)){const work=state.works.find(w=>w.id===r.workId);if(work)work.queueAutoStart=false;r.status='interrupted';r.activity.push('Server restarted. Files preserved; review and resume explicitly.');for(const attempt of r.attempts||[])if(attempt.status==='running'){attempt.status='interrupted';attempt.endedAt=now();}}
 let closing=false;const controllers=new Map<string,AbortController>(); const busyChats=new Set<string>(); const chatControllers=new Map<string,AbortController>(); const chatProgress=new Map<string,ChatProgress>();
 const eventClients=new Map<string,Set<express.Response>>();
 const publish=(invId:string,finished=false)=>{const data='data: '+JSON.stringify({progress:chatProgress.get(invId)||null,finished})+'\n\n';for(const client of eventClients.get(invId)||[])if(!client.writableEnded)client.write(data);};
 const getWork=(workId:string)=>{const w=state.works.find(w=>w.id===workId);if(!w) throw Object.assign(new Error('Work not found'),{status:404});return w;};
 const getInv=(invId:string)=>{const inv=state.investigations.find(i=>i.id===invId);if(!inv) throw Object.assign(new Error('Investigation not found'),{status:404});return inv;};
 const writable=(work:Work)=>{if(work.status==='archived')throw Object.assign(new Error('Archived work is read-only.'),{status:409});};
 const addMessage=(inv:Investigation,role:Message['role'],content:string,extra:Partial<Message>={})=>{const w=getWork(inv.workId);const m:Message={id:id('msg'),investigationId:inv.id,role,content,createdAt:now(),revision:w.revision,fileVersion:version(w.path),...extra};state.messages.push(m);return m;};
 let pi:PiConnection={status:'checking',reason:'Connecting to the local Pi harness…',models:[]};
 let discovery:Promise<void>|undefined;
 const refreshPi=()=>{
  if(discovery)return discovery;
  discovery=(async()=>{
   pi=await discoverPi(config);
   if(closing)return;
   const preferred=pi.models.find(m=>m.id===pi.defaultModel)?.id||pi.models[0]?.id;
   if(preferred){for(const inv of state.investigations)if((['configured','pi'].includes(inv.model)||inv.model.startsWith('pi:openrouter:')))inv.model=preferred;save();}
   pumpQueue();
  })().finally(()=>{discovery=undefined;});
  return discovery;
 };
 const defaultModel=()=>pi.models.find(m=>m.id===pi.defaultModel)?.id||pi.models[0]?.id||'pi';
 const providers=()=>[...pi.models,...(!pi.models.length?[{id:'pi',name:'Pi coding harness',available:false,reason:pi.reason}]:[]),...(config.seed?[{id:'demo',name:'Demo · local fixture',available:true,reason:'Deterministic example, not a live AI model.'}]:[])];
 const validateModel=(model:string)=>{const p=providers().find(p=>p.id===model);if(!p?.available)throw Object.assign(new Error(p?.reason||'Unknown provider/model.'),{status:400});};
 const createWork=(projectId:string,title:string,objective:string)=>{
  const project=state.projects.find(p=>p.id===projectId);if(!project)throw new Error('Project not found');const workId=id('work');const branch=`jove/${workId}`;const dir=path.join(root,'workspaces',workId);fs.mkdirSync(path.dirname(dir),{recursive:true});
  if(fs.existsSync(dir))throw new Error('Workspace already exists; refusing to overwrite.');
  git(project.path,'worktree','add','-b',branch,dir,'HEAD');
  const work:Work={id:workId,projectId,title,objective,status:'active',revision:git(dir,'rev-parse','HEAD'),path:dir,branch,fileVersion:version(dir),queueAutoStart:true};state.works.push(work);
  const inv:Investigation={id:id('inv'),workId,title:'Main investigation',isMain:true,model:project.isDemo?'demo':defaultModel(),createdAt:now()};state.investigations.push(inv);save();return {work,investigation:inv};
 };
 if(config.seed===true && !state.projects.length){
  const fixture=path.join(root,'example','credit-engine');if(!fs.existsSync(path.join(fixture,'.git')))createFixture(fixture);
  const project={id:id('project'),name:'credit-engine',path:fixture,isDemo:true};state.projects.push(project);
  const {work,investigation:main}=createWork(project.id,'Add credit rating rule','Handle applicants with incomplete financial history safely, preserving existing rule evaluation behavior.');
  addMessage(main,'user','Let’s understand how applicant data reaches the rule engine before we change anything.');
  addMessage(main,'assistant',"I inspected the example repository. Applicant data is enriched in `src/feature-store.js`, then evaluated in `src/rules.js`. The current enrichment directly accesses `applicant.history`, so missing history throws.\n\n```js\nexport function enrichApplicant(applicant) {\n  return { ...applicant, creditScore: applicant.history.creditScore, income: applicant.history.income };\n}\n```\n\nThe two existing tests cover qualifying and low-credit applicants. There is no missing-history case yet. Clip this finding to explore the edge case independently.",{model:'demo',confidence:'verified_against_current_code'});
  const child:Investigation={id:id('inv'),workId:work.id,title:'Data flow',isMain:false,model:'demo',createdAt:now(),sourceInvestigationId:main.id,sourceMessageId:state.messages.at(-1)!.id};state.investigations.push(child);
  addMessage(child,'artifact','Clipped from Main: applicant enrichment reads history before rule evaluation.',{sourceInvestigationId:main.id,sourceMessageId:state.messages.at(-1)!.id,confidence:'source_attributed'});
  addMessage(child,'assistant','The data path is applicant → enrichApplicant → evaluate.\n\nEvidence: `src/rules.js` imports `enrichApplicant` from `src/feature-store.js`. The enriched creditScore and income determine eligibility.\n\nOpen question: Should missing history make an applicant ineligible, or send them to manual review? The demo implementation uses ineligible as its explicit example behavior.',{model:'demo',confidence:'verified_against_current_code'});save();
 }
 save();
 const refresh=(w:Work)=>{w.fileVersion=version(w.path);};
 const ownsWorktree=(workId:string,except?:string)=>state.runs.some(r=>r.id!==except&&r.workId===workId&&(['running','paused'].includes(r.status)||controllers.has(r.id)));
 const queued=(workId?:string)=>state.runs.filter(r=>r.status==='queued'&&(!workId||r.workId===workId)).sort((a,b)=>(a.queueOrder??0)-(b.queueOrder??0)||a.createdAt.localeCompare(b.createdAt));
 function beginRun(run:Run){
  validateModel(run.model);writable(getWork(run.workId));
  if(ownsWorktree(run.workId,run.id))throw Object.assign(new Error('Another implementation owns this worktree.'),{status:409});
  run.status='running';run.error=undefined;run.reviewDiff=undefined;run.activity.push('Dequeued. Calling a fresh implementation subagent.');save();void startSubagent(run);
 }
 function pumpQueue(){
  if(closing)return;
  for(const work of state.works){
   if(work.status==='archived'||work.queueAutoStart===false||ownsWorktree(work.id))continue;
   const next=queued(work.id)[0];if(!next)continue;
   // An unavailable model leaves its approved task queued until discovery succeeds.
   if(!providers().some(p=>p.id===next.model&&p.available))continue;
   beginRun(next);
  }
 }

 async function startSubagent(run:Run){
  const w=getWork(run.workId),controller=new AbortController();controllers.set(run.id,controller);
  const attempt=createSubagentAttempt(run);(run.attempts||=[]).push(attempt);
  addMessage(getInv(run.investigationId),'artifact',`Implementation subagent called: ${run.objective}`,{sourceRunId:run.id,confidence:'subagent_call'});save();
  try{
   const result=await callImplementationSubagent({...config,checkpointDir:path.join(root,'checkpoints',run.id)},run,attempt,w.path,controller.signal,text=>{run.activity.push(text);save();},test=>{run.tests.push(test);save();});
   if(run.status==='running'){run.status='completed';run.summary=result;attempt.summary=result;run.activity.push('Subagent returned its result. Review changes and verification.');}
  }catch(e:any){if(run.status==='running'){run.status='failed';run.error=e.message;run.activity.push(`Subagent error: ${e.message}`);attempt.summary=e.message;}}
  finally{
   attempt.status=run.status==='queued'?'interrupted':run.status;attempt.endedAt=now();run.stage++;
   try{run.changedFiles=changed(w.path);run.reviewDiff=diff(w.path);refresh(w);}catch(e:any){run.activity.push(`Unable to refresh worktree: ${e.message}`);}
   addMessage(getInv(run.investigationId),'artifact',`Subagent ${attempt.id} ${run.status}.\n\n${attempt.summary||'Existing changes were preserved.'}\n\nChanged files: ${run.changedFiles.join(', ')||'none'}.\nVerification: ${run.tests.map(t=>t.name+': '+t.status).join('; ')||'not run'}.`,{sourceRunId:run.id,confidence:'subagent_result_requires_review'});
   if(['failed','interrupted'].includes(run.status))w.queueAutoStart=false;controllers.delete(run.id);save();publish(run.investigationId,true);pumpQueue();
   if(closing&&!controllers.size&&!chatControllers.size){releaseLock();process.removeListener('exit',onExit);}
  }
 }
 if(config.piDiscovery!==false)void refreshPi();
 else {pi={status:'unavailable',reason:'Pi discovery is disabled.',models:[]};pumpQueue();}
 const app=express();app.disable('x-powered-by');app.use(express.json({limit:'512kb'}));
 app.use('/api',(req,res,next)=>{if(!['localhost','127.0.0.1','[::1]'].includes(req.hostname))return res.status(403).json({error:'Only loopback hosts are permitted.'});const origin=req.get('origin');if(origin){try{const u=new URL(origin);if(!['localhost','127.0.0.1','[::1]'].includes(u.hostname))return res.status(403).json({error:'Only local browser origins are allowed.'});}catch{return res.status(403).json({error:'Invalid origin'});}}if(!['GET','HEAD'].includes(req.method)&&!req.is('application/json'))return res.status(415).json({error:'JSON requests required.'});next();});
 app.get('/api/state',(_req,res)=>{
  const projects=state.projects.filter(p=>config.seed||!p.isDemo);
  const projectIds=new Set(projects.map(p=>p.id));
  const works=state.works.filter(w=>projectIds.has(w.projectId));
  const workIds=new Set(works.map(w=>w.id));
  const investigations=state.investigations.filter(i=>workIds.has(i.workId));
  const invIds=new Set(investigations.map(i=>i.id));
  const versions=new Map(works.filter(w=>fs.existsSync(w.path)).map(w=>[w.id,version(w.path)]));
  res.json({projects,works:works.map(({path:_,branch:__,...w})=>w),investigations,runs:state.runs.filter(r=>workIds.has(r.workId)).map(({reviewDiff:_,...run})=>run),messages:state.messages.filter(m=>invIds.has(m.investigationId)).map(m=>{const inv=investigations.find(i=>i.id===m.investigationId);return {...m,stale:Boolean(inv&&((m.fileVersion&&versions.get(inv.workId)!==m.fileVersion)||m.findingSources?.some(f=>f.fileVersion&&versions.get(inv.workId)!==f.fileVersion)))};}),providers:providers(),pi,chatProgress:[...chatProgress.values()]});
 });
 app.get('/api/directories',(req,res)=>{
  const requested=typeof req.query.path==='string'?req.query.path:path.dirname(process.cwd());
  const expanded=requested==='~'?os.homedir():requested.startsWith('~/')?path.join(os.homedir(),requested.slice(2)):requested;
  const dir=fs.realpathSync(expanded);
  const directories=fs.readdirSync(dir,{withFileTypes:true}).filter(entry=>entry.isDirectory()&&!entry.name.startsWith('.')&&!['node_modules','dist','build'].includes(entry.name)).sort((a,b)=>a.name.localeCompare(b.name)).slice(0,250).map(entry=>({name:entry.name,path:path.join(dir,entry.name),isRepository:fs.existsSync(path.join(dir,entry.name,'.git'))}));
  res.json({path:dir,parent:path.dirname(dir),isRepository:fs.existsSync(path.join(dir,'.git')),directories});
 });
 app.get('/api/investigations/:id/events',(req,res)=>{
  getInv(req.params.id);res.set({'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive','X-Accel-Buffering':'no'});res.flushHeaders();
  const clients=eventClients.get(req.params.id)||new Set<express.Response>();eventClients.set(req.params.id,clients);clients.add(res);publish(req.params.id);
  const heartbeat=setInterval(()=>res.write(': heartbeat\n\n'),15000);
  res.on('close',()=>{clearInterval(heartbeat);clients.delete(res);if(!clients.size)eventClients.delete(req.params.id);});
 });
 app.post('/api/pi/refresh',async(_req,res,next)=>{try{await refreshPi();res.json(pi);}catch(e){next(e);}});
 app.post('/api/projects',(req,res)=>{const input=required(req.body.path,'Codebase path');let dir=fs.realpathSync(input.startsWith('~/')?path.join(os.homedir(),input.slice(2)):input);dir=git(dir,'rev-parse','--show-toplevel');if(state.projects.some(p=>p.path===dir))throw new Error('This codebase is already open.');const project={id:id('project'),name:path.basename(dir),path:dir,isDemo:false};state.projects.push(project);save();res.status(201).json(project);});
 app.post('/api/works',(req,res)=>res.status(201).json(createWork(required(req.body.projectId,'Project'),required(req.body.title,'Title',150),required(req.body.objective,'Objective'))));
 app.post('/api/investigations',(req,res)=>{const work=getWork(required(req.body.workId,'Work'));writable(work);const model=req.body.model||(state.projects.find(p=>p.id===work.projectId)?.isDemo?'demo':defaultModel());validateModel(model);const inv:Investigation={id:id('inv'),workId:work.id,title:required(req.body.title,'Title',100),model,isMain:false,createdAt:now()};if(req.body.clip){const source=getInv(req.body.clip.sourceInvestigationId);if(source.workId!==work.id)throw new Error('Clip source must belong to the same work.');const sourceMessage=state.messages.find(m=>m.id===req.body.clip.sourceMessageId&&m.investigationId===source.id);if(!sourceMessage)throw new Error('Clip source message not found.');inv.sourceInvestigationId=source.id;inv.sourceMessageId=sourceMessage.id;state.investigations.push(inv);addMessage(inv,'artifact',required(req.body.clip.content,'Clipped content'),{sourceInvestigationId:source.id,sourceMessageId:sourceMessage.id,revision:sourceMessage.revision,fileVersion:sourceMessage.fileVersion,confidence:'source_attributed'});}else state.investigations.push(inv);save();res.status(201).json(inv);});
 app.post('/api/investigations/:id/clips',(req,res)=>{const target=getInv(req.params.id),source=getInv(required(req.body.sourceInvestigationId,'Source investigation'));writable(getWork(target.workId));if(target.workId!==source.workId||target.id===source.id)throw new Error('Choose a different investigation within the same work.');const sourceMessage=state.messages.find(m=>m.id===req.body.sourceMessageId&&m.investigationId===source.id);if(!sourceMessage)throw new Error('Clip source message not found.');const m=addMessage(target,'artifact',required(req.body.content,'Clipped content'),{sourceInvestigationId:source.id,sourceMessageId:sourceMessage.id,revision:sourceMessage.revision,fileVersion:sourceMessage.fileVersion,confidence:'source_attributed'});save();res.status(201).json(m);});
 app.patch('/api/investigations/:id',(req,res)=>{const inv=getInv(req.params.id);writable(getWork(inv.workId));if(req.body.title)inv.title=required(req.body.title,'Title',100);if(req.body.model){if(busyChats.has(inv.id))throw new Error('Wait for the current response before switching models.');validateModel(req.body.model);inv.model=req.body.model;}save();res.json(inv);});
 app.post('/api/investigations/:id/messages',async(req,res,next)=>{let inv:Investigation|undefined;let ownsChat=false;try{inv=getInv(req.params.id);const w=getWork(inv.workId);writable(w);if(req.body.clip){const source=getInv(required(req.body.clip.sourceInvestigationId,'Source investigation'));if(source.workId!==w.id||source.id===inv.id)throw new Error('Clip source must be a different investigation in the same work.');const message=state.messages.find(m=>m.id===req.body.clip.sourceMessageId&&m.investigationId===source.id);if(!message)throw new Error('Clip source message not found.');const artifact=addMessage(inv,'artifact',required(req.body.content||req.body.clip.content,'Clipped content'),{sourceInvestigationId:source.id,sourceMessageId:message.id,revision:message.revision,fileVersion:message.fileVersion,confidence:'source_attributed'});save();res.status(201).json(artifact);return;}if(busyChats.has(inv.id))return res.status(409).json({error:'This investigation already has a response in progress.'});validateModel(inv.model);const content=required(req.body.content,'Message');const analysisVersion=version(w.path);const analysisRevision=git(w.path,'rev-parse','HEAD');const history=state.messages.filter(m=>m.investigationId===inv!.id).map(m=>({role:m.role,content:m.content}));addMessage(inv,'user',content);busyChats.add(inv.id);ownsChat=true;save();let answer:string;
 if(inv.model==='demo'){const project=state.projects.find(p=>p.id===w.projectId)!;answer=project.isDemo?`Demo analysis of this example repository:\n\n${readFile(w.path,'src/feature-store.js').includes('history?.')?'Applicant history is now accessed defensively with optional chaining.':'The enrichment function accesses applicant.history directly, so missing history can throw.'}\n\nEvidence: src/feature-store.js and src/rules.js. Existing tests live in tests/rules.test.js.\n\nYour question: ${content}\n\nThis is a deterministic local demonstration, not an AI answer. Choose a configured live provider for open-ended investigation.`:'Demo mode only analyzes the bundled credit-engine example. Connect Pi in Settings to investigate this codebase.';}else{
 const controller=new AbortController();chatControllers.set(inv.id,controller);
 const progress:ChatProgress={investigationId:inv.id,text:'',activity:[]};chatProgress.set(inv.id,progress);publish(inv.id);
 answer=await piChat(config,inv.model,w.path,`Work objective: ${w.objective}\nUser: ${content}`,history,false,text=>{progress.activity.push(text);if(progress.activity.length>30)progress.activity.shift();publish(inv!.id);},controller.signal,undefined,text=>{progress.text=text;publish(inv!.id);});
 }
 const message=addMessage(inv,'assistant',answer,{model:inv.model,activity:chatProgress.get(inv.id)?.activity,fileVersion:analysisVersion,revision:analysisRevision,confidence:inv.model==='demo'?'demo_evidence':'provider_claim_requires_review'});save();res.status(201).json(message);
 }catch(e){if(inv&&ownsChat&&chatControllers.get(inv.id)?.signal.aborted){const partial=chatProgress.get(inv.id);if(partial?.text)addMessage(inv,'assistant',partial.text,{model:inv.model,confidence:'interrupted_partial',activity:partial.activity});save();res.json({stopped:true});}else next(e);}finally{if(inv&&ownsChat){busyChats.delete(inv.id);chatControllers.delete(inv.id);chatProgress.delete(inv.id);publish(inv.id,true);}if(closing&&!controllers.size&&!chatControllers.size){releaseLock();process.removeListener('exit',onExit);}}});
 app.post('/api/investigations/:id/stop',(req,res)=>{getInv(req.params.id);chatControllers.get(req.params.id)?.abort();res.json({stopping:true});});
 app.post('/api/investigations/:id/merge',(req,res)=>{const source=getInv(req.params.id),target=getInv(required(req.body.targetId,'Target'));const w=getWork(source.workId);writable(w);if(source.workId!==target.workId||source.id===target.id)throw new Error('Choose a different investigation within this work.');const findings=strings(req.body.findings);if(!findings.length)throw new Error('Select at least one finding.');const latest=state.messages.filter(m=>m.investigationId===source.id).at(-1);const sourceIds=strings(req.body.sourceMessageIds);if(sourceIds.length&&sourceIds.length!==findings.length)throw new Error('Each selected finding needs its own source message.');const findingSources=findings.map((claim,i)=>{const sourceMessage=sourceIds[i]?state.messages.find(m=>m.id===sourceIds[i]&&m.investigationId===source.id):latest;if(!sourceMessage)throw new Error('Finding source message not found.');return {claim,sourceMessageId:sourceMessage.id,revision:sourceMessage.revision,fileVersion:sourceMessage.fileVersion};});const m=addMessage(target,'artifact',`Findings merged from ${source.title}\n\n${findings.map(f=>'• '+f).join('\n\n')}\n\nThese are selected claims from the source investigation, not automatically verified facts. No code or Git changes were merged.`,{sourceInvestigationId:source.id,sourceMessageId:latest?.id,revision:latest?.revision,fileVersion:latest?.fileVersion,confidence:'source_attributed_unverified',sourceMessageIds:findingSources.map(f=>f.sourceMessageId!),findingSources});save();res.status(201).json(m);});
 app.post('/api/runs',(req,res)=>{const inv=getInv(required(req.body.investigationId,'Investigation')),w=getWork(inv.workId);writable(w);const model=req.body.model||inv.model;validateModel(model);if(req.body.queue!==true&&ownsWorktree(w.id))return res.status(409).json({error:'A code-writing implementation is already active for this work.'});const project=state.projects.find(p=>p.id===w.projectId)!;if(model==='demo'&&!project.isDemo)throw new Error('Demo implementation only runs in the bundled example. Connect Pi in Settings for this codebase.');const objective=required(req.body.objective,'Objective');const sourceMessageIds=req.body.sourceMessageIds===undefined?state.messages.filter(m=>m.investigationId===inv.id).map(m=>m.id):strings(req.body.sourceMessageIds);if(req.body.sourceMessageIds!==undefined&&(!Array.isArray(req.body.sourceMessageIds)||sourceMessageIds.length!==req.body.sourceMessageIds.length||sourceMessageIds.some(id=>!state.messages.some(m=>m.id===id&&m.investigationId===inv.id))))throw new Error('Handoff sources must belong to this investigation.');const run:Run={id:id('run'),workId:w.id,investigationId:inv.id,status:'queued',queueOrder:Math.max(0,...state.runs.map(r=>r.queueOrder||0))+1,model,objective,activity:[model==='demo'?'Approved example handoff. Calling implementation subagent.':'Approved handoff. Calling a fresh Pi implementation subagent.'],changedFiles:[],tests:[],createdAt:now(),stage:0,handoff:{sourceInvestigationId:inv.id,workId:w.id,objective,findings:strings(req.body.findings),constraints:strings(req.body.constraints),acceptanceCriteria:strings(req.body.acceptanceCriteria),openQuestions:strings(req.body.openQuestions),repositoryRevision:git(w.path,'rev-parse','HEAD'),fileVersion:version(w.path),sourceMessageIds,allowTestExecution:req.body.allowTestExecution===true}};state.runs.push(run);save();if(req.body.queue===true)pumpQueue();else beginRun(run);res.status(201).json(run);});
 app.post('/api/runs/:id/control',(req,res)=>{const run=state.runs.find(r=>r.id===req.params.id);if(!run)throw new Error('Run not found');const action=req.body.action;if(action==='pause'||action==='interrupt'){if(run.status!=='running'&&run.status!=='paused')throw new Error('Only active runs can be paused or interrupted.');run.status=action==='pause'?'paused':'interrupted';if(action==='interrupt')getWork(run.workId).queueAutoStart=false;controllers.get(run.id)?.abort();run.activity.push(action==='pause'?'Paused by user. Existing edits preserved.':'Interrupted by user. Existing edits preserved.');}else if(action==='resume'){if(!['paused','interrupted','failed'].includes(run.status))throw new Error('This run cannot be resumed.');writable(getWork(run.workId));if(controllers.has(run.id))throw new Error('Previous operation is still stopping. Retry shortly.');if(state.runs.some(r=>r.id!==run.id&&r.workId===run.workId&&(['running','paused'].includes(r.status)||controllers.has(r.id))))return res.status(409).json({error:'Another implementation owns this work.'});run.instruction=req.body.instruction?required(req.body.instruction,'Follow-up instruction'):run.instruction;run.activity.push('Resumed with preserved files and explicit handoff.');beginRun(run);}else if(action==='start'){if(run.status!=='queued')throw new Error('Only queued tasks can be started.');beginRun(run);}else if(action==='cancel'){if(run.status!=='queued')throw new Error('Only queued tasks can be removed.');run.status='interrupted';run.activity.push('Removed from queue by user. No subagent was started.');}else throw new Error('Unknown control action');save();pumpQueue();res.json(run);});
 app.patch('/api/works/:id/queue',(req,res)=>{const work=getWork(req.params.id);writable(work);if(typeof req.body.autoStart!=='boolean')throw new Error('autoStart must be a boolean.');work.queueAutoStart=req.body.autoStart;save();pumpQueue();res.json(work);});
 app.post('/api/works/:id/queue/reorder',(req,res)=>{const work=getWork(req.params.id);writable(work);const ids=req.body.runIds,current=queued(work.id);if(!Array.isArray(ids)||ids.length!==current.length||new Set(ids).size!==ids.length||ids.some(id=>!current.some(r=>r.id===id)))return res.status(409).json({error:'Queue changed. Refresh and reorder all upcoming tasks.'});ids.forEach((id:string,index:number)=>{state.runs.find(r=>r.id===id)!.queueOrder=index+1;});save();res.json(queued(work.id));});
 app.get('/api/runs/:id/diff',(req,res)=>{const run=state.runs.find(r=>r.id===req.params.id);if(!run)throw new Error('Run not found');res.json({diff:run.reviewDiff??diff(getWork(run.workId).path),changedFiles:run.reviewDiff!==undefined?run.changedFiles:changed(getWork(run.workId).path),scope:'Cumulative worktree changes against its base revision',snapshot:run.reviewDiff!==undefined});});
 app.get('/api/works/:id/details',(req,res)=>{const w=getWork(req.params.id);res.json({path:w.path,branch:w.branch,revision:git(w.path,'rev-parse','HEAD'),dirty:changed(w.path),fileVersion:version(w.path),recoveryCheckpoints:state.runs.filter(r=>r.workId===w.id&&fs.existsSync(path.join(root,'checkpoints',r.id))).map(r=>({runId:r.id,path:path.join(root,'checkpoints',r.id)}))});});
 app.post('/api/works/:id/archive',(req,res)=>{const w=getWork(req.params.id);if(ownsWorktree(w.id)||queued(w.id).length)return res.status(409).json({error:'Interrupt active implementations and remove queued tasks before archiving.'});w.status='archived';save();res.json({work:w,message:'Archived safely. Workspace and all changes retained; no cleanup performed.'});});
 app.use((error:any,_req:express.Request,res:express.Response,_next:express.NextFunction)=>res.status(error.status||400).json({error:error.message||'Request failed'}));
 return {app,state,config,close:()=>{closing=true;for(const clients of eventClients.values())for(const client of clients)client.end();eventClients.clear();for(const c of controllers.values())c.abort();for(const c of chatControllers.values())c.abort();if(!controllers.size&&!chatControllers.size){releaseLock();process.removeListener('exit',onExit);}}};
}

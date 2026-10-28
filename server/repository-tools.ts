import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { files, readFile, safePath, isSecretPath } from './git.js';
import type { Config, Run } from './types.js';
const execute = promisify(execFile);
export const toolDefinitions = (writing: boolean) => [
 {type:'function',function:{name:'list_files',description:'List repository files.',parameters:{type:'object',properties:{},additionalProperties:false}}},
 {type:'function',function:{name:'read_file',description:'Read a repository-relative UTF-8 file. Environment secrets excluded.',parameters:{type:'object',properties:{path:{type:'string'}},required:['path'],additionalProperties:false}}},
 {type:'function',function:{name:'search',description:'Search literal text in repository source files.',parameters:{type:'object',properties:{query:{type:'string'}},required:['query'],additionalProperties:false}}},
 ...(writing ? [{type:'function',function:{name:'write_file',description:'Write a complete UTF-8 file within the isolated repository. Preserve unrelated changes.',parameters:{type:'object',properties:{path:{type:'string'},content:{type:'string'}},required:['path','content'],additionalProperties:false}}},{type:'function',function:{name:'run_tests',description:'Run the server-configured verification command. No arbitrary shell commands.',parameters:{type:'object',properties:{},additionalProperties:false}}}] : [])
];
export async function runTests(cwd:string, command:string[]|undefined, signal?:AbortSignal) {
 if(!command?.length) return {name:'Verification',status:'not_run',output:'No trusted verification command configured. Set JOVE_TEST_COMMAND to a JSON argv array and restart.'};
 try { const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!/(API_KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL|NODE_TEST_CONTEXT|NODE_OPTIONS)/i.test(key))); const r=await execute(command[0],command.slice(1),{cwd,timeout:60000,maxBuffer:1024*1024,signal,env}); return {name:command.join(' '),status:'passed',output:r.stdout+r.stderr}; }
 catch(e:any) {return {name:command.join(' '),status:'failed',output:String(e.stdout||'')+String(e.stderr||'')+String(e.message)};}
}
// A fresh executor per Pi run retains read-before-write fingerprints.
export function createRepositoryTools(config:Config, root:string, writing:boolean, log:(text:string)=>void=()=>{}, onTests?:(r:Run['tests'][number])=>void) {
 if(config.checkpointDir)fs.mkdirSync(config.checkpointDir,{recursive:true,mode:0o700});
 const observedFiles=new Map<string,string>();
 const digest=(content:string)=>createHash('sha256').update(content).digest('hex');
 return async (name:string,args:Record<string,any>,signal?:AbortSignal) => {
  if(signal?.aborted)throw new Error('Run interrupted');
  let result:unknown;
    switch(name) {
     case 'list_files': result=files(root); break;
     case 'read_file': {const file=String(args.path);result=readFile(root,file);observedFiles.set(file,digest(String(result)));break;}
     case 'search': { const q=String(args.query||''); if(!q || q.length>200) throw new Error('Search must be 1–200 characters.'); result=files(root).flatMap(f=>{try{return readFile(root,f).split('\n').flatMap((l,i)=>l.includes(q)?[`${f}:${i+1}: ${l.slice(0,300)}`]:[]);}catch{return[];}}).slice(0,100); break; }
     case 'write_file': {if(!writing) throw new Error('Read-only investigation'); const content=String(args.content); if(content.length>200000) throw new Error('File exceeds write limit'); if(isSecretPath(String(args.path))) throw new Error('Cannot write secrets'); const p=safePath(root,String(args.path),true); if(fs.existsSync(p)&&observedFiles.get(String(args.path))!==digest(fs.readFileSync(p,'utf8')))throw new Error('Read this file before editing; its current contents must match the last read to preserve concurrent changes.'); if(config.checkpointDir&&fs.existsSync(p)){const backup=safePath(config.checkpointDir,String(args.path),true);fs.mkdirSync(path.dirname(backup),{recursive:true});if(!fs.existsSync(backup)){fs.writeFileSync(backup,fs.readFileSync(p),{flag:'wx',mode:0o600});log(`Recovery checkpoint saved: ${args.path}`);}} fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p,content); observedFiles.set(String(args.path),digest(content)); result='File written.'; break;}
     case 'run_tests': { if(!writing) throw new Error('Read-only investigation'); const r=config.allowTestExecution ? await runTests(root,config.testCommand,signal) : {name:'Verification',status:'not_run',output:'Test execution was not approved for this run. Repository tests execute local code with your account privileges; enable the explicit handoff permission to run them.'}; onTests?.(r); result=r; break; }
     default: throw new Error('Unsupported tool');
    }
  return result;
 };
}

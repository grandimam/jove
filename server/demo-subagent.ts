// Deterministic implementation worker used only by the opt-in example and tests.
import fs from 'node:fs';
import {readFile,safePath} from './git.js';
import {runTests} from './repository-tools.js';
const send=(message:unknown)=>process.send?.(message);
process.once('message',async({root,stepDelay}:{root:string;stepDelay:number})=>{
 const delay=()=>new Promise(r=>setTimeout(r,stepDelay));
 try{
  for(const file of ['src/feature-store.js','src/rules.js','tests/rules.test.js'])readFile(root,file);
  send({type:'activity',text:'Read the example source and regression tests.'});await delay();
  const file=safePath(root,'src/feature-store.js',true),current=fs.readFileSync(file,'utf8');
  const expected='return { ...applicant, creditScore: applicant.history.creditScore, income: applicant.history.income };';
  if(!current.includes(expected)&&!current.includes('history?.creditScore'))throw new Error('Example source changed. No content was overwritten.');
  if(current.includes(expected))fs.writeFileSync(file,current.replace(expected,'return { ...applicant, creditScore: applicant.history?.creditScore ?? 0, income: applicant.history?.income ?? 0 };'));
  const tests=safePath(root,'tests/missing-history.test.js',true);
  if(!fs.existsSync(tests))fs.writeFileSync(tests,`import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { evaluate } from '../src/rules.js';\ntest('missing financial history is safely ineligible', () => assert.equal(evaluate({}).eligible, false));\ntest('partial financial history is safely ineligible', () => assert.equal(evaluate({ history: {} }).eligible, false));\n`);
  send({type:'activity',text:'Applied the example patch and added regression tests.'});await delay();
  const result=await runTests(root,['node','--test']);send({type:'test',result});
  if(result.status!=='passed')throw new Error('Verification failed. Inspect test output.');
  send({type:'result',summary:'Demo subagent completed the fixed example: missing and partial history are ineligible. Regression tests passed. Changes remain in the isolated worktree for review.'});
 }catch(error){send({type:'error',message:(error as Error).message});process.exitCode=1;}
 finally{process.disconnect();}
});

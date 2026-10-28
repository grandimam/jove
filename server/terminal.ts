import type {Express,Response} from 'express';
import * as pty from 'node-pty';
import {randomUUID} from 'node:crypto';
import os from 'node:os';
import type {Work} from './types';

export function attachTerminals(app:Express,getWork:(id:string)=>Work){
 const sessions=new Map<string,{id:string;process:pty.IPty;output:string;clients:Set<Response>;exited:boolean;idle?:ReturnType<typeof setTimeout>}>();
 const close=(workId:string)=>{const session=sessions.get(workId);if(!session)return;clearTimeout(session.idle);sessions.delete(workId);for(const client of session.clients)client.end();try{session.process.kill()}catch{}};
 const sessionFor=(workId:string,id:unknown)=>{getWork(workId);const session=sessions.get(workId);if(!session||session.id!==id)throw new Error('Terminal session ended. Reopen Terminal.');return session;};
 app.post('/api/works/:id/terminal',(req,res)=>{
  const work=getWork(req.params.id);if(work.status==='archived')return res.status(409).json({error:'This work is archived.'});
  let session=sessions.get(work.id);
  if(session?.exited){close(work.id);session=undefined;}
  if(!session){
   const shell=os.userInfo().shell||'/bin/zsh';
   const process=pty.spawn(shell,['-l'],{name:'xterm-256color',cols:80,rows:24,cwd:work.path,env:{...globalThis.process.env,TERM:'xterm-256color'}});
   session={id:randomUUID(),process,output:'',clients:new Set(),exited:false};sessions.set(work.id,session);
   const current=session;
   process.onData(data=>{current.output=(current.output+data).slice(-200000);for(const client of current.clients)client.write(`data: ${JSON.stringify({data})}\n\n`);});
   process.onExit(({exitCode})=>{current.exited=true;for(const client of current.clients){client.write(`data: ${JSON.stringify({exitCode})}\n\n`);client.end();}current.clients.clear();});
   current.idle=setTimeout(()=>close(work.id),15*60*1000);current.idle.unref();
  }
  res.json({id:session.id});
 });
 app.get('/api/works/:id/terminal/events',(req,res)=>{
  const session=sessionFor(req.params.id,req.query.session);clearTimeout(session.idle);
  res.setHeader('Content-Type','text/event-stream');res.setHeader('Cache-Control','no-cache');res.setHeader('Connection','keep-alive');res.flushHeaders();
  res.write(`data: ${JSON.stringify({data:session.output,reset:true})}\n\n`);session.clients.add(res);
  const heartbeat=setInterval(()=>res.write(': heartbeat\n\n'),15000);
  req.on('close',()=>{clearInterval(heartbeat);session.clients.delete(res);if(!session.clients.size){session.idle=setTimeout(()=>close(req.params.id),15*60*1000);session.idle.unref();}});
 });
 app.post('/api/works/:id/terminal/input',(req,res)=>{const session=sessionFor(req.params.id,req.body.session);if(session.exited)return res.status(409).json({error:'Shell exited. Reopen Terminal.'});if(typeof req.body.data!=='string'||req.body.data.length>32768)return res.status(400).json({error:'Invalid terminal input.'});session.process.write(req.body.data);res.json({ok:true});});
 app.post('/api/works/:id/terminal/resize',(req,res)=>{const session=sessionFor(req.params.id,req.body.session);const {cols,rows}=req.body;if(!Number.isInteger(cols)||!Number.isInteger(rows)||cols<2||cols>500||rows<1||rows>300)return res.status(400).json({error:'Invalid terminal size.'});if(!session.exited)session.process.resize(cols,rows);res.json({ok:true});});
 app.delete('/api/works/:id/terminal',(req,res)=>{getWork(req.params.id);close(req.params.id);res.json({ok:true});});
 return {close:()=>{for(const id of sessions.keys())close(id)}};
}

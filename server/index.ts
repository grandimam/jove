import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
const instance=createApp();
const {app}=instance;
const dist=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
if(fs.existsSync(dist)){app.use(express.static(dist));app.get('/{*path}',(_req,res)=>res.sendFile(path.join(dist,'index.html')));}
const port=Number(process.env.PORT||4318);
const server=app.listen(port,'127.0.0.1',()=>console.log(`Jove local workspace: http://127.0.0.1:${port}`));

for(const signal of ['SIGINT','SIGTERM'] as const)process.once(signal,()=>{instance.close();server.close(()=>process.exit(0));});

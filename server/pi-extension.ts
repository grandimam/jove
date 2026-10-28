// Loaded by the installed Pi harness through -e. No dependency on a second Pi install.
import { createRepositoryTools, toolDefinitions } from './repository-tools.js';

export default function joveTools(pi: any) {
 const settings=JSON.parse(process.env.JOVE_PI_TOOLS||'{}');
 if(typeof settings.root!=='string')throw new Error('Jove workspace is missing');
 const writing=settings.writing===true;
 const definitions=toolDefinitions(writing).map(t=>t.function);
 const execute=createRepositoryTools(settings,settings.root,writing);
 for(const definition of definitions) {
  pi.registerTool({
   ...definition,label:definition.name,
   async execute(_id:string,args:Record<string,unknown>,signal:AbortSignal) {
    const result=await execute(definition.name,args,signal);
    return {content:[{type:'text',text:JSON.stringify(result)}],details:definition.name==='run_tests'?{verification:result}:{}};
   }
  });
 }
 pi.on('session_start',(_event:unknown,ctx:any)=>{
  pi.setActiveTools(definitions.map(t=>t.name));
  // Readiness confirms the extension loaded and the tool set was applied.
  if(process.env.JOVE_PI_RPC==='1')ctx.ui.notify('JOVE_READY:'+JSON.stringify(pi.getActiveTools()),'info');
 });
}

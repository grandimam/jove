// Protocol fixture: no network, credentials or real Pi model calls.
import fs from 'node:fs';
const scenario=process.argv[2];
const send=value=>process.stdout.write(JSON.stringify(value)+'\n');
const reply=(c,data)=>send({type:'response',id:c.id,command:c.type,success:true,data});
const settings=JSON.parse(process.env.JOVE_PI_TOOLS||'{}');
if(settings.root){
 const tools=['list_files','read_file','search',...(settings.writing?['write_file','run_tests']:[])];
 if(scenario!=='missing-tools')send({type:'extension_ui_request',method:'notify',message:'JOVE_READY:'+JSON.stringify(tools)});
}
let buffer='';
process.stdin.setEncoding('utf8');process.stdin.on('data',chunk=>{
 buffer+=chunk;let end;
 while((end=buffer.indexOf('\n'))>=0){const c=JSON.parse(buffer.slice(0,end));buffer=buffer.slice(end+1);
  if(c.type==='get_state')reply(c,{model:{provider:'test',id:'model/one'}});
  else if(c.type==='get_available_models')reply(c,{models:[{provider:'test',id:'model/one',name:'Test model'}]});
  else if(c.type==='set_model'){
   if(c.provider!=='test'||c.modelId!=='model/one')send({type:'response',id:c.id,success:false,error:'Wrong model selection'});else reply(c,{});
  }else if(c.type==='abort'){reply(c,{});send({type:'agent_settled'});}
  else if(c.type==='prompt'){
   reply(c,{});
   if(scenario==='hang')continue;
   if(scenario==='exit'){process.exit(9);}
   if(scenario==='malformed'){process.stdout.write('not-json\n');continue;}
   send({type:'agent_start'});send({type:'turn_start'});send({type:'message_start',message:{role:'assistant'}});
   if(scenario==='error'){send({type:'message_end',message:{role:'assistant',stopReason:'error',errorMessage:'Authentication expired',content:[]}});send({type:'agent_settled'});continue;}
   send({type:'message_update',assistantMessageEvent:{type:'text_delta',delta:'Read source.js\u2028safely'}});
   send({type:'tool_execution_start',toolName:'read_file',args:{path:'source.js'}});
   if(settings.writing){send({type:'tool_execution_end',toolName:'run_tests',result:{details:{verification:{name:'fixture test',status:'passed',output:'Executed test'}}}});}
   send({type:'message_end',message:{role:'assistant',stopReason:'stop',content:[{type:'text',text:'Read source.js\u2028safely'}]}});
   send({type:'agent_end',messages:[],willRetry:true});
   // Ending a low-level run must not finish the request while Pi is retrying.
   setTimeout(()=>{
    send({type:'message_start',message:{role:'assistant'}});
    send({type:'message_end',message:{role:'assistant',stopReason:'stop',content:[{type:'text',text:'Final verified response'}]}});
    send({type:'agent_settled'});
   },50);
  }else reply(c,{});
 }
});
process.stdin.on('end',()=>process.exit(0));

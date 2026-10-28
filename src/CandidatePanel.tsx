import React,{useEffect,useRef,useState} from 'react';
import {FileDiff,History,Terminal,GitBranch,ChevronRight,Loader2} from 'lucide-react';
import type {Investigation,State} from './types';
import DiffViewer from './DiffViewer';
const TerminalPane=React.lazy(()=>import('./TerminalPane'));
import {paper} from './design-system/paper';

/** Changes and recorded attempts for the current investigation. */
export default function CandidatePanel({state,inv,request,onFile,onRun}:{state:State;inv:Investigation;request:(route:string,body?:unknown)=>Promise<any>;onFile:(path:string)=>void;onRun?:(id:string)=>void}){
 const [tab,setTab]=useState<'Diff'|'History'|'Terminal'>('Diff');
 const [terminalOpened,setTerminalOpened]=useState(false);
 const [runId,setRunId]=useState('');
 const [record,setRecord]=useState<{id:string;diff:string}|null>(null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');
 const requestRef=useRef(request);requestRef.current=request;
 const runs=state.runs.filter(run=>run.investigationId===inv.id);
 const selected=runs.find(run=>run.id===runId)||runs.at(-1);
 const proposal=state.candidates?.filter(candidate=>candidate.investigationId===inv.id).at(-1);
 useEffect(()=>{
  if(tab!=='Diff'||!selected)return;
  let cancelled=false;setLoading(true);setError('');
  requestRef.current(`/runs/${selected.id}/diff`).then(result=>{
   if(cancelled)return;
   if(result&&typeof result.diff==='string')setRecord({id:selected.id,diff:result.diff});
   else{setRecord(null);setError('Unable to load changes.');}
  }).catch(()=>{if(!cancelled){setRecord(null);setError('Unable to load changes.');}}).finally(()=>{if(!cancelled)setLoading(false)});
  return()=>{cancelled=true};
 },[tab,selected?.id,selected?.status,selected?.activity.length]);
 const diff=selected?(record?.id===selected.id?record.diff:''):proposal?.proposedDiff||'';
 return <aside className={paper('candidate-panel')} aria-label="Changes">
  <header className={paper('output-toolbar')}><nav aria-label="Change views">{(['Diff','History','Terminal'] as const).map(name=><button key={name} className={paper('output-tab '+(tab===name?'active':''))} aria-current={tab===name?'page':undefined} onClick={()=>{setTab(name);if(name==='Terminal')setTerminalOpened(true)}}>{name==='Diff'?<FileDiff size={16}/>:name==='History'?<History size={16}/>:<Terminal size={16}/>}{name}</button>)}</nav></header>
  {terminalOpened&&<React.Suspense fallback={<p className="p-4 text-muted">Opening terminal…</p>}><TerminalPane workId={inv.workId} visible={tab==='Terminal'}/></React.Suspense>}
  {tab==='Terminal'?null:tab==='History'?<div className={paper('candidate-body')}>
   {runs.length?<section aria-label="Implementation history">{runs.slice().reverse().map(run=><div key={run.id} className="flex items-center gap-2"><button className={paper('output-attempt')+' min-w-0 flex-1'} onClick={()=>{setRunId(run.id);setTab('Diff')}}><GitBranch size={16}/><span>{run.objective}<small>{run.status}{run.createdAt&&<> · {new Date(run.createdAt).toLocaleString()}</>}</small></span><ChevronRight size={14}/></button>{onRun&&<button className={paper('text-link')+' text-xs'} aria-label={`Details for ${run.objective}`} onClick={()=>onRun(run.id)}>Details</button>}</div>)}</section>:<div className={paper('candidate-empty')}><History size={24}/><h3>No history yet</h3><p>Implementation attempts will appear here.</p></div>}
  </div>:loading?<div className={paper('candidate-empty')} role="status"><Loader2 size={20} className={paper('spin')}/>Loading changes…</div>:error?<p className="p-5 text-error" role="alert">{error}</p>:diff?<DiffViewer diff={diff} proposed={!selected} onSelect={({path})=>onFile(path)}/>:<div className={paper('candidate-empty')}><FileDiff size={24}/><h3>No changes yet</h3><p>{selected?'This attempt has no file changes.':'Changes will appear here when there is a patch to review.'}</p></div>}
 </aside>;
}

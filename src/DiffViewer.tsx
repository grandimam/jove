import React,{useState} from 'react';
import {paper} from './design-system/paper';
import {FileCode2 as FileCode,Columns2,Rows2} from 'lucide-react';
export type DiffRow={text:string;kind:'context'|'addition'|'deletion'|'hunk';oldLine?:number;newLine?:number};
export type DiffFile={path:string;rows:DiffRow[];status:'Modified'|'Added'|'Deleted'};
/** Parse recorded unified Git output. Metadata is not treated as executable code. */
export function parseDiff(patch:string):DiffFile[]{
 const files:DiffFile[]=[];let current:DiffFile|undefined,oldLine=0,newLine=0,inHunk=false;
 for(const text of patch.split('\n')){
  if(text.startsWith('diff --git ')){current={path:text.match(/ b\/(.*)$/)?.[1]||'Changed file',rows:[],status:'Modified'};files.push(current);inHunk=false;continue}
  if(!current)continue;
  if(text.startsWith('new file mode ')){current.status='Added';continue}
  if(text.startsWith('deleted file mode ')){current.status='Deleted';continue}
  if(!inHunk&&text.startsWith('+++ b/')){current.path=text.slice(6);continue}
  const hunk=text.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
  if(hunk){oldLine=Number(hunk[1]);newLine=Number(hunk[2]);inHunk=true;current.rows.push({text,kind:'hunk'});continue}
  if(!inHunk)continue;
  if(text.startsWith('+'))current.rows.push({text:text.slice(1),kind:'addition',newLine:newLine++});
  else if(text.startsWith('-'))current.rows.push({text:text.slice(1),kind:'deletion',oldLine:oldLine++});
  else if(text.startsWith(' '))current.rows.push({text:text.slice(1),kind:'context',oldLine:oldLine++,newLine:newLine++});
 }
 return files;
}
export function splitRows(rows:DiffRow[]):{left?:DiffRow;right?:DiffRow}[]{
 const paired:{left?:DiffRow;right?:DiffRow}[]=[];
 for(let i=0;i<rows.length;){const row=rows[i];if(row.kind==='context'||row.kind==='hunk'){paired.push({left:row,right:row});i++;continue}const removed:DiffRow[]=[],added:DiffRow[]=[];while(i<rows.length&&['deletion','addition'].includes(rows[i].kind)){(rows[i].kind==='deletion'?removed:added).push(rows[i++])}for(let j=0;j<Math.max(removed.length,added.length);j++)paired.push({left:removed[j],right:added[j]});}
 return paired;
}
export function Syntax({text}:{text:string}){return <>{text.split(/('[^']*'|"[^"]*"|\b(?:import|from|export|async|function|const|let|return|if|await|throw|new|type|interface)\b|\/\/.*$)/g).map((token,i)=><span key={i} className={paper(/^["']/.test(token)?'code-string':token.startsWith('//')?'code-comment':/^(import|from|export|async|function|const|let|return|if|await|throw|new|type|interface)$/.test(token)?'code-keyword':'')}>{token}</span>)}</>}
export default function DiffViewer({diff,onSelect,proposed=false}:{proposed?:boolean;diff:string;onSelect:(ref:{path:string;line:number})=>void}){
 const [mode,setMode]=useState<'split'|'unified'>('split');const files=parseDiff(diff);
 const row=(file:DiffFile,item:DiffRow|undefined,side:'left'|'right'|'unified')=>{if(!item)return <div className={paper('code-row empty-code-row')}/>;if(item.kind==='hunk')return <div className={paper('code-hunk')}>{item.text}</div>;const contents=<><span className={paper('code-line-number')}>{side==='left'?item.oldLine:side==='right'?item.newLine:item.oldLine??''}</span>{side==='unified'&&<span className={paper('code-line-number')}>{item.newLine??''}</span>}<span className={paper('code-marker')}>{item.kind==='addition'?'+':item.kind==='deletion'?'−':' '}</span><code><Syntax text={item.text}/></code></>;return item.kind==='addition'?<button className={paper('code-row addition')} title={`${proposed?"Inspect":"Explain"} ${file.path}:${item.newLine}`} onClick={()=>onSelect({path:file.path,line:item.newLine!})}>{contents}</button>:<div className={paper(`code-row ${item.kind}`)}>{contents}</div>};
 return <div className={paper('diff-review')+(proposed?' proposed-diff':'')}>{!proposed&&<div className={paper('diff-mode-bar')}><span>{proposed?'Proposed changes · not applied':'Recorded Git changes'}</span><div role="group" aria-label="Diff layout"><button aria-pressed={mode==='split'} onClick={()=>setMode('split')}><Columns2 size={14}/>Split</button><button aria-pressed={mode==='unified'} onClick={()=>setMode('unified')}><Rows2 size={14}/>Unified</button></div></div>}{files.length?files.map((file,index)=><section className={paper('diff-file')} key={index}><header><FileCode size={18}/><code>{file.path}</code><span className={paper('paper-badge')}>{proposed?'Proposed':file.status}</span>{proposed&&<span className="sr-only">Proposed changes · not applied</span>}{proposed&&<div className={paper('diff-mode-bar')} title="Proposed changes · not applied"><div role="group" aria-label="Diff layout"><button aria-pressed={mode==='split'} onClick={()=>setMode('split')}><Columns2 size={14}/>Split</button><button aria-pressed={mode==='unified'} onClick={()=>setMode('unified')}><Rows2 size={14}/>Unified</button></div></div>}</header><div className={paper('diff-code-scroll')}>{!file.rows.length?<p className={paper('diff-empty')}>Binary or metadata-only change. No text hunks recorded.</p>:mode==='unified'?file.rows.map((item,i)=><React.Fragment key={i}>{row(file,item,'unified')}</React.Fragment>):<div className={paper('split-code')}>{splitRows(file.rows).map((pair,i)=><div className={paper('split-code-row')} key={i}>{row(file,pair.left,'left')}{row(file,pair.right,'right')}</div>)}</div>}</div></section>):<p className={paper('diff-empty')}>{diff?'No text diff available.':'No file changes yet.'}</p>}</div>;
}

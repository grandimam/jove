import React,{useEffect,useRef,useState} from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {paper} from './design-system/paper';
import {FileCode2,Lightbulb,Copy,Check,Paperclip} from 'lucide-react';
import {Syntax} from './DiffViewer';

/** CommonMark/GFM without executing model HTML; source references remain inspectable. */
export default function MessageBody({content,onReference,onClip}:{content:string;onReference?:(path:string)=>void;onClip?:(code:string)=>void}){
 const reference=(text:string)=>text.split(/((?:[\w@.-]+\/)+[\w.-]+(?:\.[\w]+)(?::\d+(?:-\d+)?)?)/g).map((part,index)=>index%2&&onReference?<button key={index} className={paper('source-reference')} title={`Open ${part}`} onClick={()=>onReference(part)}>{part}</button>:part);
 const nodeText=(children:React.ReactNode):React.ReactNode=>React.Children.map(children,child=>React.isValidElement<{children?:React.ReactNode}>(child)?nodeText(child.props.children):child);
 const textChildren=(children:React.ReactNode)=>React.Children.map(children,child=>typeof child==='string'?reference(child):child);
 return <div className={paper('message-content')}><Markdown remarkPlugins={[remarkGfm]} skipHtml components={{
  p:({children})=><p>{textChildren(children)}</p>,
  li:({children,className})=><li className={className}>{textChildren(children)}</li>,
  strong:({children})=><strong>{textChildren(children)}</strong>,
  em:({children})=><em>{textChildren(children)}</em>,
  h2:({children})=><h2>{String(children).toLowerCase()==='key findings'&&<Lightbulb size={17} className="mr-2 inline-block text-[#a07831]"/>}{children}</h2>,
  a:({href,children})=>href&&/^(https?:|mailto:|#)/i.test(href)?<a href={href} target={href.startsWith('#')?undefined:'_blank'} rel="noopener noreferrer">{children}</a>:href&&onReference?<button className={paper('source-reference')} onClick={()=>onReference(href)}>{nodeText(children)}</button>:<span>{children}</span>,
  img:({alt})=><span className="text-muted">{alt||'Image'}</span>,
  code:({children})=><code>{reference(String(children))}</code>,
  pre:({node})=>{
   const code=node?.children.find(child=>child.type==='element'&&child.tagName==='code');
   if(!code||code.type!=='element')return null;
   const value=code.children.filter(child=>child.type==='text').map(child=>child.type==='text'?child.value:'').join('').replace(/\n$/,'');
   const language=String(code.properties?.className||'').match(/language-([^ ,]+)/)?.[1]||'';
   return <CodeBlock value={value} language={language} onClip={onClip}/>;
  },
  table:({children})=><div className="my-4 overflow-x-auto rounded-lg border border-line"><table>{children}</table></div>,
 }}>{content.replace(/```jove-candidate\s*\n[\s\S]*?```/g,'Proposed changes are ready in Diff.')}</Markdown></div>;
}

function CodeBlock({value,language,onClip}:{value:string;language:string;onClip?:(code:string)=>void}){
 const [copied,setCopied]=useState(false),[error,setError]=useState('');
 const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 const copy=async()=>{try{await navigator.clipboard.writeText(value);setCopied(true);setError('');clearTimeout(timer.current);timer.current=setTimeout(()=>setCopied(false),2000)}catch{setError('Could not copy. Select the code to copy it manually.')}};
 const clip=()=>{const fence='`'.repeat(Math.max(3,...(value.match(/`+/g)||[]).map(run=>run.length+1)));onClip?.(`${fence}${language}\n${value}\n${fence}`)};
 return <div className={paper('code-block')}><div><FileCode2 size={15}/><span>{language||'Code'}</span><span className="ml-auto flex items-center gap-1"><button type="button" title="Copy code" aria-label="Copy code" onClick={()=>void copy()} className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs hover:bg-neutral">{copied?<Check size={13}/>:<Copy size={13}/>} {copied?'Copied':'Copy'}</button>{onClip&&<button type="button" title="Clip code" aria-label="Clip code" onClick={clip} className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs hover:bg-neutral"><Paperclip size={13}/>Clip</button>}</span></div>{error&&<p role="status" className="px-3 py-2 text-xs text-error">{error}</p>}<pre><code>{/^(?:[jt]sx?|javascript|typescript)$/.test(language)?value.split('\n').map((line,index)=><React.Fragment key={index}>{index>0?'\n':''}<Syntax text={line}/></React.Fragment>):value}</code></pre></div>;
}

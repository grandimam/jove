import React,{useEffect,useRef,useState} from 'react';
import {paper} from './design-system/paper';

/** Pointer and keyboard accessible pane sizing, persisted per workspace region. */
export default function PaneDivider({region}:{region:'navigation'|'output'}){
 const ref=useRef<HTMLDivElement>(null);
 const [value,setValue]=useState(()=>{try{return Number(window.localStorage.getItem(`jove-${region}-width`))||(region==='navigation'?232:47)}catch{return region==='navigation'?232:47}});
 const clamp=(n:number)=>Math.min(region==='navigation'?320:62,Math.max(region==='navigation'?200:38,n));
 useEffect(()=>{const parent=ref.current?.parentElement;parent?.style.setProperty(region==='navigation'?'--navigation-width':'--conversation-width',`${clamp(value)}${region==='navigation'?'px':'%'}`);try{window.localStorage.setItem(`jove-${region}-width`,String(clamp(value)))}catch{}},[value,region]);
 return <div ref={ref} className={paper(`pane-divider ${region}-divider`)} role="separator" tabIndex={0} aria-label={`Resize ${region} pane`} aria-orientation="vertical" aria-valuemin={region==='navigation'?200:38} aria-valuemax={region==='navigation'?320:62} aria-valuenow={clamp(value)} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();setValue(e.key==='Home'?clamp(0):e.key==='End'?clamp(1000):clamp(value+(e.key==='ArrowLeft'?-1:1)*(region==='navigation'?8:2)))}}} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(!e.currentTarget.hasPointerCapture(e.pointerId))return;const rect=e.currentTarget.parentElement!.getBoundingClientRect();setValue(clamp(region==='navigation'?e.clientX-rect.left:100*(e.clientX-rect.left)/rect.width))}} onPointerUp={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)}}/>;
}

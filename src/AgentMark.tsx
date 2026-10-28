import {graphite} from './design-system/graphite';
import React from 'react';

/** Jove: a small terminal companion. The same silhouette works from 20–48px. */
export default function AgentMark({working=false,className=''}:{working?:boolean;className?:string}){
 return <svg className={graphite(`agent-mark ${working?'is-working ':''}${className}`)} viewBox="0 0 32 32" fill="none" aria-hidden="true">
  <path className={graphite("agent-shell")} d="M8 5h16v3h4v16h-4v3h-5v-3h-6v3H8v-3H4V8h4V5Z"/>
  <path className={graphite("agent-eye left")} d="M10 12h4v5h-4z"/>
  <path className={graphite("agent-eye right")} d="M18 12h4v5h-4z"/>
  <path className={graphite("agent-mouth")} d="M13 20h6" strokeWidth="2" strokeLinecap="square"/>
 </svg>;
}

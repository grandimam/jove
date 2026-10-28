import React from 'react';
import {paper} from './design-system/paper';
import {Activity,ChevronDown,ChevronRight,Loader2} from 'lucide-react';

/** Activity entries are recorded tool messages, not inferred successful checks. */
export default function ActivitySummary({activity,running=false}:{activity:string[];running?:boolean}){
 if(!activity.length)return null;
 return <details className={paper(`activity-summary${running?' is-running':''}`)} open={true}>
  <summary><ChevronDown size={16} className={paper('activity-disclosure')}/>{running?<Loader2 size={16} className={paper('spin')}/>:<Activity size={16}/>}<span>{running?'Investigating codebase…':'Sources & activity'}</span><span className={paper('activity-count')}>{activity.length}</span></summary>
  <div className={paper('activity-entries')}>{activity.map((entry,index)=><div className={paper('activity-entry')} key={index}><ChevronRight size={14}/><span>{entry}</span></div>)}</div>
 </details>;
}

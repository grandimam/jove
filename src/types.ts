export type Project={id:string;name:string;path:string;isDemo:boolean};
export type Work={id:string;projectId:string;title:string;objective:string;status:string;queueAutoStart?:boolean;revision:string};
export type Investigation={id:string;workId:string;title:string;model:string;isMain:boolean;sourceInvestigationId?:string;sourceMessageId?:string;createdAt:string};
export type Message={id:string;investigationId:string;role:'user'|'assistant'|'artifact';content:string;createdAt:string;model?:string;sourceInvestigationId?:string;sourceMessageId?:string;revision?:string;stale?:boolean;confidence?:string;activity?:string[];sourceRunId?:string};
export type Run={id:string;workId:string;investigationId:string;status:string;queueOrder?:number;model:string;objective:string;activity:string[];changedFiles:string[];tests:{name:string;status:string;output:string}[];summary?:string;createdAt:string;handoff?:unknown;attempts?:{id:string;status:string;startedAt:string;endedAt?:string;summary?:string}[]};
export type Provider={id:string;name:string;available:boolean;reason?:string};
export type State={projects:Project[];works:Work[];investigations:Investigation[];messages:Message[];runs:Run[];providers:Provider[];pi?:{status:'checking'|'connected'|'unavailable';reason:string;models:Provider[]};chatProgress?:{investigationId:string;text:string;activity:string[]}[]};

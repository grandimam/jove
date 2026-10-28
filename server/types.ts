export interface Project {
  isClosed?: boolean;
  id: string;
  name: string;
  path: string;
  isDemo: boolean;
}
export interface Work {
  isPrimary?: boolean;
  id: string;
  projectId: string;
  title: string;
  objective: string;
  status: 'active' | 'archived';
  revision: string;
  path: string;
  branch: string;
  fileVersion: string;
  queueAutoStart?: boolean;
}
export interface Investigation {
  isClosed?: boolean;
  id: string;
  workId: string;
  title: string;
  model: string;
  isMain: boolean;
  createdAt: string;
  sourceInvestigationId?: string;
  sourceMessageId?: string;
}
export interface Message {
  clientMessageId?: string;
  id: string;
  investigationId: string;
  role: 'user' | 'assistant' | 'artifact';
  content: string;
  createdAt: string;
  model?: string;
  sourceInvestigationId?: string;
  sourceMessageId?: string;
  sourceMessageIds?: string[];
  activity?: string[];
  sourceRunId?: string;
  findingSources?: {
    claim: string;
    sourceMessageId?: string;
    revision?: string;
    fileVersion?: string;
  }[];
  revision?: string;
  fileVersion?: string;
  confidence?: string;
  stale?: boolean;
}
export interface Handoff {
  sourceInvestigationId: string;
  workId: string;
  objective: string;
  findings: string[];
  constraints: string[];
  acceptanceCriteria: string[];
  openQuestions: string[];
  repositoryRevision: string;
  fileVersion: string;
  sourceMessageIds: string[];
  allowTestExecution: boolean;
}
export interface SubagentAttempt {
  id: string;
  parentInvestigationId: string;
  model: string;
  status: 'running' | 'paused' | 'interrupted' | 'completed' | 'failed';
  startedAt: string;
  endedAt?: string;
  summary?: string;
}
export interface Run {
  manualStart?: boolean;
  candidateRevision?: CandidateRevision;
  id: string;
  workId: string;
  investigationId: string;
  status: 'queued' | 'running' | 'paused' | 'interrupted' | 'completed' | 'failed';
  queueOrder?: number;
  reviewDiff?: string;
  model: string;
  objective: string;
  activity: string[];
  changedFiles: string[];
  tests: { name: string; status: string; output: string }[];
  summary?: string;
  createdAt: string;
  handoff: Handoff;
  stage: number;
  instruction?: string;
  error?: string;
  attempts?: SubagentAttempt[];
}
export interface CandidateRevision {
  id: string;
  investigationId: string;
  version: number;
  title: string;
  objective: string;
  approach: string;
  affectedFiles: string[];
  proposedChanges: string[];
  assumptions: string[];
  evaluation: string[];
  goals?: string[];
  nonGoals?: string[];
  architecture?: string[];
  security?: string[];
  tradeOffs?: string[];
  proposedDiff?: string;
  createdAt: string;
  sourceMessageIds: string[];
  restoredFrom?: string;
}
export interface State {
  projects: Project[];
  works: Work[];
  investigations: Investigation[];
  messages: Message[];
  runs: Run[];
  candidates: CandidateRevision[];
}
export interface Config {
  dataDir?: string;
  seed?: boolean;
  stepDelay?: number;
  piCommand?: string;
  piProviderExtension?: string;
  piArgs?: string[];
  piDiscovery?: boolean;
  piTimeoutMs?: number;
  testCommand?: string[];
  allowTestExecution?: boolean;
  checkpointDir?: string;
}
export interface PiModel {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  available: boolean;
  reason?: string;
}
export interface PiConnection {
  status: 'checking' | 'connected' | 'unavailable';
  reason: string;
  models: PiModel[];
  defaultModel?: string;
}
export interface ChatProgress {
  investigationId: string;
  text: string;
  activity: string[];
}

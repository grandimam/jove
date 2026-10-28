import { paper as graphite } from './design-system/paper';
import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import {
  ArrowUp,
  ArrowRight,
  Plus,
  Folder,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  GitBranch,
  Paperclip as Scissors,
  PanelRight,
  MoreHorizontal,
  X,
  Check,
  Play,
  Pause,
  Square,
  Terminal,
  FileCode2 as FileCode,
  FileDiff,
  CheckCircle2,
  Settings,
  ExternalLink,
  Layers3 as Layers,
  Command,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Copy,
  Archive,
  Link,
  RefreshCw,
  ListOrdered,
  ChevronUp,
  Pencil,
  Menu,
  Lock,
  BriefcaseBusiness,
  Clock,
} from 'lucide-react';
import AgentMark from './AgentMark';
import ModelPicker from './ModelPicker';
import PaneDivider from './PaneDivider';
import {
  Blocks,
  UserRound,
  PanelLeftClose,
  ShieldCheck,
  Network,
  Gauge,
  Hexagon,
} from 'lucide-react';
import CandidatePanel from './CandidatePanel';
import SourceViewer from './SourceViewer';
import ConversationGuide from './ConversationGuide';
import JoveWordmark from './JoveWordmark';
import UserMark from './UserMark';
import SelectionToolbar from './SelectionToolbar';
import RecordedDiff from './RecordedDiff';
import MessageBody from './MessageBody';
import type { State, Investigation, Message, Run } from './types';
const empty: State = {
  projects: [],
  works: [],
  investigations: [],
  messages: [],
  runs: [],
  providers: [],
};
async function api(path: string, body?: unknown, method?: string) {
  const response = await fetch('/api' + path, {
    method: method || (body ? 'POST' : 'GET'),
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || result.message || 'Request failed');
  return result;
}
const AppContext = createContext<any>(null);
export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [navigationCollapsed, setNavigationCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem('jove-navigation-collapsed') === 'true';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem('jove-navigation-collapsed', String(navigationCollapsed));
    } catch {}
  }, [navigationCollapsed]);
  const [candidateOpen, setCandidateOpen] = useState(false);
  const [sourcePath, setSourcePath] = useState('');
  const clipLock = useRef(false);
  const queueLock = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>(empty),
    [projectId, setProjectId] = useState(''),
    [workId, setWorkId] = useState(''),
    [activeId, setActiveId] = useState(''),
    [sideId, setSideId] = useState(''),
    [runId, setRunId] = useState(''),
    [modal, setModal] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [toast, setToast] = useState(''),
    [clip, setClip] = useState<Message | null>(null),
    [selectedText, setSelectedText] = useState(''),
    [sourceId, setSourceId] = useState(''),
    [runTab, setRunTab] = useState('diff'),
    [diff, setDiff] = useState(''),
    [followup, setFollowup] = useState(''),
    [handoffMessage, setHandoffMessage] = useState<Message | null>(null);
  useEffect(() => {
    setNavigationOpen(false);
  }, [activeId, runId, workId, projectId]);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const controls = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]',
        ) || [],
      );
    (
      dialog?.querySelector<HTMLElement>('[autofocus]') ||
      controls().find((el) => el.tagName !== 'BUTTON') ||
      controls()[0]
    )?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const items = controls();
      const first = items[0],
        last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    dialog?.addEventListener('keydown', trap);
    return () => {
      dialog?.removeEventListener('keydown', trap);
      if (previous?.isConnected) previous.focus();
      else document.querySelector<HTMLElement>('.account-trigger')?.focus();
    };
  }, [modal]);
  const initialized = useRef(false);
  const refresh = useCallback(async () => {
    try {
      const data = await api('/state');
      setState(data);
      if (!initialized.current) {
        initialized.current = true;
        let saved: any = {};
        try {
          saved = JSON.parse(window.localStorage.getItem('jove-workspace') || '{}');
        } catch {}
        const firstWork =
          data.works.find((x: any) => x.id === saved.workId && x.status !== 'archived') ||
          data.works.find((x: any) => x.status !== 'archived');
        setProjectId(
          firstWork?.projectId ||
            data.projects.find((p: any) => p.id === saved.projectId)?.id ||
            data.projects[0]?.id ||
            '',
        );
        setWorkId(firstWork?.id || '');
        setActiveId(
          data.investigations.find(
            (x: any) => x.id === saved.activeId && x.workId === firstWork?.id,
          )?.id ||
            data.investigations.find((x: any) => x.workId === firstWork?.id)?.id ||
            '',
        );
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoaded(true);
    }
  }, []);
  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 2000);
    return () => clearInterval(timer);
  }, [refresh]);
  useEffect(() => {
    if (loaded)
      try {
        window.localStorage.setItem(
          'jove-workspace',
          JSON.stringify({ projectId, workId, activeId }),
        );
      } catch {}
  }, [loaded, projectId, workId, activeId]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModal('');
        setNavigationOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  const project = state.projects.find((p) => p.id === projectId),
    work = state.works.find((w) => w.id === workId),
    investigations = state.investigations.filter((i) => i.workId === workId),
    main = investigations.find((i) => i.isMain),
    active = investigations.find((i) => i.id === activeId) || main,
    side = investigations.find((i) => i.id === sideId),
    run = state.runs.find((r) => r.id === runId),
    currentRuns = state.runs.filter((r) => r.workId === workId),
    liveRun = currentRuns.find((r) => ['running', 'paused'].includes(r.status));
  const selectWork = (id: string) => {
    setWorkId(id);
    setActiveId(state.investigations.find((i) => i.workId === id && i.isMain)?.id || '');
    setSideId('');
    setRunId('');
  };
  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const openClip = (message: Message, selection?: string) => {
    if (clipLock.current) return;
    clipLock.current = true;
    void act(async () => {
      const source = state.investigations.find((i) => i.id === message.investigationId)!;
      const text = selection ?? message.content;
      let number = 1;
      while (investigations.some((i) => i.title === `Clip ${number}`)) number++;
      const inv = await api('/investigations', {
        workId: source.workId,
        title: `Clip ${number}`,
        model: source.model,
        clip: { content: text, sourceInvestigationId: source.id, sourceMessageId: message.id },
      });
      await refresh();
      setActiveId(inv.id);
      setSideId('');
      setRunId('');
      setToast('Clip opened in a new tab');
    }).finally(() => {
      clipLock.current = false;
    });
  };
  const openHandoff = (id: string, message?: Message) => {
    if (queueLock.current) return;
    queueLock.current = true;
    void act(async () => {
      const source = state.investigations.find((i) => i.id === id)!;
      const context = state.messages.filter((m) => m.investigationId === id && !m.sourceRunId);
      const findings = message ? [message] : context.filter((m) => m.role !== 'user').slice(-4);
      const objective =
        message?.content ||
        context.filter((m) => m.role === 'user').at(-1)?.content ||
        work?.objective ||
        source.title;
      await api('/runs', {
        investigationId: id,
        objective,
        findings: findings.map((m) => m.content),
        sourceMessageIds: context.map((m) => m.id),
        model: source.model,
        constraints: ['Preserve existing behavior outside the task scope.'],
        acceptanceCriteria: ['Changes match the task objective.'],
        queue: true,
        manualStart: true,
      });
      setToast('Task queued · Start when ready');
    }).finally(() => {
      queueLock.current = false;
    });
  };
  useEffect(() => {
    if (runId)
      api(`/runs/${runId}/diff`)
        .then((d) => setDiff(typeof d === 'string' ? d : d.diff || ''))
        .catch((e) => setError(e.message));
  }, [runId, run?.status, run?.activity.length]);
  return (
    <AppContext.Provider
      value={{
        state,
        work,
        investigations,
        main,
        active,
        liveRun,
        refresh,
        act,
        openClip,
        openHandoff,
        setSideId,
        setModal,
        setSourceId,
        setActiveId,
        setToast,
        setError,
        modal,
        sourceId,
        clip,
        selectedText,
        setSelectedText,
        workId,
        projectId,
        setProjectId,
        setWorkId,
        setRunId,
        setRunTab,
        busy,
        handoffMessage,
        setSourcePath,
      }}
    >
      <div
        className={
          graphite('app') + (navigationCollapsed && !navigationOpen ? ' navigation-collapsed' : '')
        }
      >
        {navigationOpen && (
          <button
            className="fixed inset-0 z-30 bg-black/60 md:hidden"
            aria-label="Close navigation"
            onClick={() => setNavigationOpen(false)}
          />
        )}
        <aside className={graphite('sidebar') + (navigationOpen ? '' : ' max-md:hidden')}>
          <a
            className={graphite('brand')}
            aria-label="Jove home"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setProjectId('');
              selectWork('');
            }}
          >
            <AgentMark animated className={graphite('brand-mark')} />
            <JoveWordmark />
          </a>
          <button
            className={graphite('navigation-collapse')}
            aria-label="Collapse navigation"
            onClick={() => setNavigationCollapsed(true)}
          >
            <PanelLeftClose size={16} />
          </button>
          <div className={graphite('sidebar-scroll')}>
            <div className={graphite('section-label')}>
              PROJECTS
              <button aria-label="Import project" onClick={() => setModal('project')}>
                <Plus size={17} />
              </button>
            </div>
            {state.projects.map((p) => (
              <div key={p.id} className="group/project relative">
                <button
                  aria-label={p.name}
                  title={p.path}
                  className={
                    graphite('nav-row ' + (p.id === projectId ? 'selected' : '')) + ' pr-9'
                  }
                  onClick={() => {
                    setProjectId(p.id);
                    selectWork(
                      state.works.find((w) => w.projectId === p.id && w.status !== 'archived')
                        ?.id || '',
                    );
                  }}
                >
                  <span className={graphite('project-symbol')}>
                    <Blocks size={18} />
                  </span>
                  <span className={graphite('project-name')}>
                    {p.name}
                    <small>{p.path}</small>
                  </span>
                </button>
                <button
                  className="absolute right-1 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded text-muted opacity-0 hover:bg-neutral hover:text-error group-hover/project:opacity-100 focus:opacity-100 max-md:opacity-100"
                  aria-label={`Remove ${p.name}`}
                  title="Remove project; keep files and saved work"
                  disabled={busy}
                  onClick={() =>
                    act(async () => {
                      await api(`/projects/${p.id}`, {}, 'DELETE');
                      if (p.id === projectId) {
                        const next = state.projects.find((item) => item.id !== p.id);
                        setProjectId(next?.id || '');
                        selectWork(
                          state.works.find(
                            (w) => w.projectId === next?.id && w.status !== 'archived',
                          )?.id || '',
                        );
                      }
                      setToast(`${p.name} removed · Files and saved work preserved`);
                    })
                  }
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              className={graphite('nav-add')}
              aria-label="Import project"
              onClick={() => setModal('project')}
            >
              <Plus size={14} />
              Import project
            </button>
            {project && (
              <>
                <div className={graphite('divider')} />
                <div className={graphite('section-label')}>
                  TASKS
                  {active && (
                    <button aria-label="New task" onClick={() => openHandoff(active.id)}>
                      <Plus size={17} />
                    </button>
                  )}
                </div>
                <TaskNavigation
                  projectId={project.id}
                  selectedRunId={runId}
                  onSelectWork={selectWork}
                />
                <div className={graphite('divider')} />
                <div className={graphite('section-label')}>AGENTS</div>
                <div aria-label="Agents">
                  {(
                    state.agents || [
                      {
                        id: 'security',
                        name: 'Security',
                        description: 'Reviews authentication and permissions.',
                        status: 'idle',
                        investigationIds: [],
                      },
                      {
                        id: 'testing',
                        name: 'Testing',
                        description: 'Investigates failures and coverage.',
                        status: 'idle',
                        investigationIds: [],
                      },
                      {
                        id: 'architecture',
                        name: 'Architecture',
                        description: 'Traces structure and dependencies.',
                        status: 'idle',
                        investigationIds: [],
                      },
                    ]
                  ).map((agent) => (
                    <div
                      key={agent.id}
                      title={agent.description}
                      className="flex min-h-9 items-center gap-3 px-2.5 text-[13px] text-muted"
                    >
                      <span
                        className={
                          'size-1.5 rounded-full ' +
                          (agent.status === 'running'
                            ? 'animate-pulse bg-[#817398]'
                            : 'bg-[#bcb8b1]')
                        }
                      />
                      <span>{agent.name}</span>
                      {agent.status === 'running' && (
                        <span className="ml-auto text-[10px]">Working</span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </aside>
        <PaneDivider region="navigation" />
        <main className={graphite('main')}>
          {navigationCollapsed && (
            <button
              className={graphite('icon-button') + ' m-2 max-md:hidden'}
              aria-label="Expand navigation"
              onClick={() => setNavigationCollapsed(false)}
            >
              <Menu size={18} />
            </button>
          )}
          <button
            className="m-2 flex size-9 shrink-0 items-center justify-center rounded hover:bg-selection md:hidden"
            aria-label="Toggle navigation"
            aria-expanded={navigationOpen}
            onClick={() => setNavigationOpen(!navigationOpen)}
          >
            <Menu size={18} />
          </button>
          {active && !run && (
            <button
              className={graphite('mobile-output-toggle')}
              onClick={() => setCandidateOpen(!candidateOpen)}
              aria-expanded={candidateOpen}
            >
              <PanelRight size={15} />
              {candidateOpen ? 'Show conversation' : 'Show changes'}
            </button>
          )}
          {error && (
            <div className={graphite('error-banner')} role="alert">
              <AlertCircle size={16} />
              {error}
              <button onClick={() => setError('')} aria-label="Dismiss error">
                <X size={16} />
              </button>
            </div>
          )}

          {!loaded ? (
            <WorkspaceLoading />
          ) : run ? (
            <section className={graphite('execution')}>
              <header className={graphite('execution-head')}>
                <button
                  className={graphite('icon-button')}
                  aria-label="Back to investigations"
                  onClick={() => setRunId('')}
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <span className={graphite('eyebrow')}>TASK DETAILS</span>
                  <h1>{run.objective}</h1>
                </div>
                <span className={graphite('status-pill ' + run.status)}>{run.status}</span>
                <div className={graphite('execution-controls')}>
                  {['paused', 'interrupted', 'failed'].includes(run.status) && (
                    <input
                      className={graphite('followup-input')}
                      aria-label="Follow-up instruction"
                      value={followup}
                      onChange={(e) => setFollowup(e.target.value)}
                      placeholder="Add a follow-up instruction…"
                    />
                  )}
                  {run.status === 'running' && (
                    <button
                      className={graphite('button')}
                      onClick={() =>
                        act(async () => {
                          await api(`/runs/${run.id}/control`, { action: 'pause' });
                        })
                      }
                    >
                      <Pause size={14} />
                      Pause
                    </button>
                  )}
                  {['paused', 'interrupted', 'failed'].includes(run.status) && (
                    <button
                      className={graphite('button primary')}
                      onClick={() =>
                        act(async () => {
                          await api(`/runs/${run.id}/control`, {
                            action: 'resume',
                            instruction: followup || undefined,
                          });
                          setFollowup('');
                        })
                      }
                    >
                      <Play size={14} />
                      Resume
                    </button>
                  )}
                  {['running', 'paused', 'queued'].includes(run.status) && (
                    <button
                      className={graphite('button')}
                      onClick={() =>
                        act(async () => {
                          await api(`/runs/${run.id}/control`, {
                            action: run.status === 'queued' ? 'cancel' : 'interrupt',
                          });
                        })
                      }
                    >
                      <Square size={13} />
                      {run.status === 'queued' ? 'Remove from queue' : 'Interrupt'}
                    </button>
                  )}
                </div>
              </header>
              <div className={graphite('execution-layout')}>
                <aside className={graphite('run-details')}>
                  <div className={graphite('section-label')}>HANDOFF</div>
                  <p>
                    From{' '}
                    <button
                      className={graphite('text-link')}
                      onClick={() => {
                        setActiveId(run.investigationId);
                        setRunId('');
                      }}
                    >
                      {investigations.find((i) => i.id === run.investigationId)?.title}
                    </button>
                  </p>
                  <span className={graphite('model-chip')}>
                    {state.providers.find((p) => p.id === run.model)?.name || run.model}
                  </span>
                  {run.attempts?.map((attempt, index) => (
                    <div className={graphite('subagent-attempt')} key={attempt.id}>
                      <GitBranch size={13} />
                      <span>
                        Attempt {index + 1} · {attempt.status}
                      </span>
                    </div>
                  ))}
                  <div className={graphite('divider')} />
                  <div className={graphite('section-label')}>ACTIVITY</div>
                  {run.activity.map((a, i) => (
                    <div className={graphite('activity-row')} key={i}>
                      <span className={graphite('activity-dot')} />
                      <span>{a}</span>
                    </div>
                  ))}
                  <div className={graphite('divider')} />
                  <div className={graphite('section-label')}>
                    CHANGED FILES{' '}
                    <span className={graphite('count')}>{run.changedFiles.length}</span>
                  </div>
                  {run.changedFiles.map((f) => (
                    <div className={graphite('file-row')} key={f}>
                      <FileCode size={14} />
                      {f}
                    </div>
                  ))}
                </aside>
                <div className={graphite('run-output')}>
                  <nav className={graphite('tabs')}>
                    {[
                      { id: 'diff', icon: <FileDiff size={16} />, name: 'Changes' },
                      { id: 'terminal', icon: <Terminal size={15} />, name: 'Terminal' },
                      { id: 'tests', icon: <CheckCircle2 size={15} />, name: 'Tests' },
                      { id: 'summary', icon: <MessageSquare size={15} />, name: 'Summary' },
                    ].map((t) => (
                      <button
                        className={graphite(runTab === t.id ? 'active' : '')}
                        key={t.id}
                        onClick={() => setRunTab(t.id)}
                      >
                        {t.icon}
                        {t.name}
                      </button>
                    ))}
                  </nav>
                  {runTab === 'diff' ? (
                    <>
                      <div className={graphite('diff-scope-note')}>
                        <GitBranch size={12} />
                        {run.status === 'completed'
                          ? 'Worktree changes at completion · includes earlier tasks'
                          : ['paused', 'failed', 'interrupted'].includes(run.status)
                            ? 'Worktree changes at subagent stop · includes earlier tasks'
                            : 'Current worktree changes · includes earlier tasks'}
                      </div>
                      <RecordedDiff
                        key={run.id}
                        diff={diff}
                        run={run}
                        request={async (path, body) => {
                          try {
                            const result = await api(path, body);
                            if (body !== undefined) await refresh();
                            return result;
                          } catch (e) {
                            setError((e as Error).message);
                            return null;
                          }
                        }}
                        onInvestigate={(id) => {
                          setActiveId(id);
                          setRunId('');
                        }}
                        onSource={(id, messageId) => {
                          setActiveId(id);
                          setRunId('');
                          if (messageId)
                            setTimeout(
                              () =>
                                document
                                  .getElementById('message-' + messageId)
                                  ?.scrollIntoView?.({ block: 'center' }),
                              100,
                            );
                        }}
                      />
                    </>
                  ) : runTab === 'terminal' ? (
                    <pre className={graphite('terminal-view')}>
                      {run.activity.join('\n\n')}
                      {run.tests.map((t) => `\n\n$ ${t.name}\n${t.output}`).join('')}
                    </pre>
                  ) : runTab === 'tests' ? (
                    <div className={graphite('test-list')}>
                      {run.tests.length ? (
                        run.tests.map((t, i) => (
                          <div className={graphite('test-card')} key={i}>
                            <h3>
                              {t.status === 'passed' ? (
                                <CheckCircle2 size={17} className="text-success" />
                              ) : (
                                <AlertCircle size={17} className="text-error" />
                              )}
                              {t.name}
                              <span className={graphite('status-pill ' + t.status)}>
                                {t.status}
                              </span>
                            </h3>
                            <pre>{t.output}</pre>
                          </div>
                        ))
                      ) : (
                        <p>No tests have run. This is not a passing verification result.</p>
                      )}
                    </div>
                  ) : (
                    <div className={graphite('summary-view')}>
                      <h2>
                        {run.status === 'completed'
                          ? 'Implementation complete'
                          : 'Implementation summary'}
                      </h2>
                      <MessageContent
                        content={
                          run.summary ||
                          (run.status === 'running'
                            ? 'Jove is working on this change.'
                            : run.status === 'completed'
                              ? 'The change is ready for review.'
                              : 'This task is not running. Existing changes are preserved.')
                        }
                      />
                      <p className={graphite('muted')}>
                        Source investigation preserved. Changes remain isolated for review.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          ) : active ? (
            <>
              <div
                className={
                  graphite('console-workspace') + (candidateOpen ? ' candidate-visible' : '')
                }
              >
                <div className={graphite('conversation-grid')}>
                  <nav className={graphite('investigation-tabs')} aria-label="Investigations">
                    <div
                      role="tablist"
                      aria-label="Investigations"
                      className={graphite('investigation-tab-list')}
                    >
                      {investigations.map((inv) => (
                        <div key={inv.id} className="group/tab relative shrink-0">
                          <button
                            role="tab"
                            tabIndex={inv.id === active.id ? 0 : -1}
                            onKeyDown={(e) => {
                              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key))
                                return;
                              e.preventDefault();
                              const index = investigations.findIndex((item) => item.id === inv.id);
                              const next =
                                investigations[
                                  e.key === 'Home'
                                    ? 0
                                    : e.key === 'End'
                                      ? investigations.length - 1
                                      : (index +
                                          (e.key === 'ArrowRight' ? 1 : -1) +
                                          investigations.length) %
                                        investigations.length
                                ];
                              setActiveId(next.id);
                              document.getElementById(`tab-${next.id}`)?.focus();
                            }}
                            id={`tab-${inv.id}`}
                            aria-controls={`panel-${inv.id}`}
                            aria-selected={inv.id === active.id}
                            aria-current={inv.id === active.id ? 'page' : undefined}
                            className={
                              graphite(
                                'investigation-tab ' + (inv.id === active.id ? 'active' : ''),
                              ) + ' pr-8'
                            }
                            onClick={() => {
                              setActiveId(inv.id);
                              setRunId('');
                            }}
                          >
                            <span
                              aria-hidden="true"
                              className={
                                'size-1.5 shrink-0 rounded-full ' +
                                (inv.id === active.id ? 'bg-[#777080]' : 'bg-[#bbb8b3]')
                              }
                            />
                            <span>{inv.title}</span>
                          </button>
                          <button
                            className="absolute right-1 top-1.5 grid size-6 place-items-center rounded text-muted opacity-0 hover:bg-neutral group-hover/tab:opacity-100 focus:opacity-100 max-md:opacity-100"
                            aria-label={`Close ${inv.title}`}
                            onClick={() =>
                              act(async () => {
                                const result = await api(`/investigations/${inv.id}`, {}, 'DELETE');
                                if (activeId === inv.id) setActiveId(result.activeId);
                              })
                            }
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      <button
                        className={graphite('investigation-tab')}
                        aria-label="New tab"
                        onClick={() =>
                          act(async () => {
                            const inv = await api('/investigations', {
                              workId,
                              title: `Tab ${investigations.length + 1}`,
                            });
                            setActiveId(inv.id);
                            setSideId('');
                          })
                        }
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </nav>
                  <Conversation key={active.id} inv={active} />
                </div>
                <PaneDivider region="output" />
                <CandidatePanel
                  onRun={(id) => {
                    setRunTab('diff');
                    setRunId(id);
                  }}
                  key={active.id}
                  state={state}
                  inv={active}
                  request={async (path, body) => {
                    try {
                      const result = await api(path, body);
                      if (body !== undefined) await refresh();
                      return result;
                    } catch (e) {
                      setError((e as Error).message);
                      return null;
                    }
                  }}
                  onFile={(path) => {
                    setSourcePath(path);
                    setModal('source');
                  }}
                />
              </div>
            </>
          ) : (
            <div className={graphite('project-home')}>
              <div className={graphite('home-heading')}>
                <div>
                  <span className={graphite('eyebrow')}>
                    {project ? 'CODEBASE' : 'YOUR WORKSPACE'}
                  </span>
                  <h1>{project ? project.name : 'Projects'}</h1>
                  <p>{project ? project.path : 'Understand the code. Decide what to change.'}</p>
                </div>
                <button
                  className={graphite('button primary')}
                  onClick={() => setModal(project ? 'work' : 'project')}
                >
                  <Plus size={16} />
                  {project ? 'Start new work' : 'Import project'}
                </button>
              </div>
              {project ? (
                <div className={graphite('project-empty')}>
                  <MessageSquare size={30} />
                  <h2>What would you like to work on?</h2>
                  <p>
                    Trace a behavior, investigate a bug, or plan a change.
                    <br />
                    Each work item keeps its findings and implementation together.
                  </p>
                </div>
              ) : state.projects.length ? (
                <div className={graphite('project-cards')}>
                  {state.projects.map((p) => (
                    <button
                      key={p.id}
                      className={graphite('project-card')}
                      onClick={() => {
                        setProjectId(p.id);
                        selectWork(
                          state.works.find((w) => w.projectId === p.id && w.status !== 'archived')
                            ?.id || '',
                        );
                      }}
                    >
                      <span className={graphite('project-card-icon')}>
                        <Folder size={22} />
                      </span>
                      <h2>{p.name}</h2>
                      <p>{p.path}</p>
                      <footer>
                        <span>
                          {
                            state.works.filter(
                              (w) => w.projectId === p.id && w.status !== 'archived',
                            ).length
                          }{' '}
                          active work
                        </span>
                        <ArrowRight size={16} />
                      </footer>
                    </button>
                  ))}
                </div>
              ) : (
                <button className={graphite('import-empty')} onClick={() => setModal('project')}>
                  <span className={graphite('import-illustration')}>
                    <Folder size={36} />
                    <span>
                      <Plus size={15} />
                    </span>
                  </span>
                  <h2>Start with a codebase.</h2>
                  <p>Import a local Git repository to get started.</p>
                  <span className={graphite('text-link')}>
                    Choose a folder <ArrowRight size={14} />
                  </span>
                </button>
              )}
            </div>
          )}
        </main>
        {toast && (
          <div className={graphite('toast')}>
            <Check size={16} />
            {toast}
          </div>
        )}
        {modal && (
          <div
            className={graphite('modal-backdrop')}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setModal('');
            }}
          >
            <div
              className={graphite('modal ' + (['merge', 'handoff'].includes(modal) ? 'wide' : ''))}
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label={
                {
                  project: 'Import a project',
                  settings: 'Settings',
                  details: 'Work environment',
                  rename: 'Rename investigation',
                  work: 'New work',
                  investigation: 'New investigation',
                  clip: 'Clip context',
                  merge: 'Merge findings',
                  handoff: 'Review implementation',
                }[modal] || 'Dialog'
              }
            >
              <button
                className={graphite('modal-close icon-button')}
                aria-label="Close dialog"
                onClick={() => setModal('')}
              >
                <X size={19} />
              </button>
              {modal === 'source' ? (
                <SourceViewer path={sourcePath} workId={workId} />
              ) : (
                <ModalContent kind={modal} />
              )}{' '}
            </div>
          </div>
        )}
      </div>
    </AppContext.Provider>
  );
}

type AppContextValue = {
  state: State;
  work: State['works'][number] | undefined;
  investigations: Investigation[];
  main: Investigation | undefined;
  active: Investigation | undefined;
  liveRun: Run | undefined;
  refresh: () => Promise<void>;
  act: (fn: () => Promise<void>) => Promise<void>;
  openClip: (m: Message, selection?: string) => void;
  openHandoff: (id: string, message?: Message) => void;
  handoffMessage: Message | null;
  setSideId: (s: string) => void;
  setModal: (s: string) => void;
  setSourceId: (s: string) => void;
  setActiveId: (s: string) => void;
  setToast: (s: string) => void;
  setError: (s: string) => void;
  sourceId: string;
  clip: Message | null;
  selectedText: string;
  setSelectedText: (s: string) => void;
  workId: string;
  projectId: string;
  setProjectId: (s: string) => void;
  setWorkId: (s: string) => void;
  setRunId: (s: string) => void;
  setRunTab: (s: string) => void;
  busy: boolean;
  setSourcePath: (path: string) => void;
};

function WorkspaceLoading() {
  return (
    <div className={graphite('workspace-loading')} role="status" aria-live="polite">
      <div className={graphite('loading-companion')}>
        <AgentMark working />
      </div>
      <p>
        Opening your workspace
        <span className={graphite('loading-dots')} aria-hidden="true">
          …
        </span>
      </p>
    </div>
  );
}

function ModelSelect({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const { state } = useContext(AppContext) as { state: State };
  return (
    <ModelPicker
      providers={state.providers}
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
function ModalContent({ kind }: { kind: string }) {
  const {
    state,
    work,
    investigations,
    main,
    active,
    liveRun,
    act,
    setSideId,
    setModal,
    setActiveId,
    setToast,
    setError,
    sourceId,
    clip,
    selectedText,
    setSelectedText,
    workId,
    projectId,
    setProjectId,
    setWorkId,
    setRunId,
    setRunTab,
    busy,
    handoffMessage,
  } = useContext(AppContext) as AppContextValue;
  const source = investigations.find((i) => i.id === sourceId) || active;
  const candidateMessages =
    kind === 'handoff' && handoffMessage
      ? [handoffMessage]
      : state.messages.filter((m) => m.investigationId === source?.id && m.role !== 'user');
  const [candidate] = useState(() =>
    (state.candidates || []).filter((c) => c.investigationId === source?.id).at(-1),
  );
  const initialFindings = candidateMessages.slice(-4).map((m) => m.content);
  const [title, setTitle] = useState(kind === 'rename' ? source?.title || '' : ''),
    [path, setPath] = useState(''),
    [objective, setObjective] = useState(
      candidate?.objective ||
        (source?.isMain ? work?.objective || '' : source?.title || work?.objective || ''),
    ),
    [model, setModel] = useState(
      source?.model || state.providers.find((p) => p.available)?.id || 'demo',
    ),
    [target, setTarget] = useState(
      kind === 'clip' ? 'new' : investigations.find((i) => i.id !== source?.id)?.id || '',
    ),
    [findings, setFindings] = useState(initialFindings),
    [constraints, setConstraints] = useState(
      'Preserve existing behavior outside the approved scope.',
    ),
    [criteria, setCriteria] = useState(
      candidate?.evaluation.join('\n') ||
        'Relevant tests pass.\nChanges match the approved objective.',
    ),
    [questions, setQuestions] = useState(candidate?.assumptions.join('\n') || ''),
    [allowTestExecution, setAllowTestExecution] = useState(false),
    [details, setDetails] = useState<any>(null);
  useEffect(() => {
    if (kind === 'details' && work)
      api(`/works/${work.id}/details`)
        .then(setDetails)
        .catch((e) => setError(e.message));
  }, [kind]);
  const close = () => setModal('');
  const submit = (fn: () => Promise<void>) =>
    act(async () => {
      await fn();
      close();
    });
  if (kind === 'project') return <ProjectImport />;
  if (kind === 'rename')
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(async () => {
            await api(`/investigations/${source?.id}`, { title }, 'PATCH');
          });
        }}
      >
        <span className={graphite('eyebrow')}>KEEP YOUR THOUGHTS ORGANIZED</span>
        <h2>Rename investigation</h2>
        <label>
          Name
          <input
            autoFocus
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={source?.title}
          />
        </label>
        <div className={graphite('modal-footer')}>
          <button type="button" className={graphite('button')} onClick={close}>
            Cancel
          </button>
          <button className={graphite('button primary')} disabled={busy}>
            Save name
          </button>
        </div>
      </form>
    );

  if (kind === 'details')
    return (
      <>
        <span className={graphite('eyebrow')}>ADVANCED</span>
        <h2>Work environment</h2>
        <p>
          Jove keeps this work isolated. Archiving preserves files and never removes uncommitted
          changes.
        </p>
        <pre className={graphite('details-pre')}>
          {details ? JSON.stringify(details, null, 2) : 'Loading…'}
        </pre>
        <button
          className={graphite('button danger')}
          disabled={busy || !!liveRun}
          onClick={() =>
            submit(async () => {
              await api(`/works/${workId}/archive`, {});
              setWorkId('');
              setActiveId('');
              setSideId('');
              setToast('Work archived. Files preserved.');
            })
          }
        >
          <Archive size={15} />
          Archive work
        </button>
      </>
    );
  if (kind === 'work' || kind === 'investigation' || kind === 'clip')
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(async () => {
            if (kind === 'work') {
              const result = await api('/works', { projectId, title, objective: title });
              setWorkId(result.work.id);
              setActiveId(result.investigation.id);
              setSideId('');
            } else if (kind === 'clip' && target !== 'new') {
              await api(`/investigations/${target}/messages`, {
                content: `Clipped from ${investigations.find((i) => i.id === clip?.investigationId)?.title}:\n\n${selectedText}`,
                clip: {
                  content: selectedText,
                  sourceInvestigationId: clip?.investigationId,
                  sourceMessageId: clip?.id,
                },
              });
              setActiveId(target);
            } else {
              const inv = await api('/investigations', {
                workId,
                title,
                model,
                clip:
                  kind === 'clip'
                    ? {
                        content: selectedText,
                        sourceInvestigationId: clip?.investigationId,
                        sourceMessageId: clip?.id,
                      }
                    : undefined,
              });
              setActiveId(inv.id);
              setSideId('');
            }
            setToast(kind === 'clip' ? 'Context clipped with its source' : 'Ready to explore');
          });
        }}
      >
        <span className={graphite('eyebrow')}>
          {kind === 'clip' ? 'FOLLOW A NEW THREAD' : 'MAKE ROOM FOR YOUR NEXT IDEA'}
        </span>
        <h2>
          {kind === 'work'
            ? 'What are you working on?'
            : kind === 'clip'
              ? 'Clip to a tab'
              : 'A new investigation'}
        </h2>
        <p>
          {kind === 'work'
            ? 'Describe the outcome. We’ll prepare an isolated space behind the scenes.'
            : kind === 'clip'
              ? 'Just the useful context, with a link back to where it came from.'
              : 'Explore another angle without losing the main thread.'}
        </p>
        {kind === 'clip' && (
          <>
            <label>
              Destination
              <select value={target} onChange={(e) => setTarget(e.target.value)}>
                <option value="new">New tab</option>
                {investigations
                  .filter((i) => i.id !== (clip?.investigationId || active?.id))
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.title}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Selected context
              <textarea
                className={graphite('clip-preview')}
                value={selectedText}
                onChange={(e) => setSelectedText(e.target.value)}
              />
            </label>
          </>
        )}
        {(kind !== 'clip' || target === 'new') && (
          <label>
            {kind === 'work' ? 'Work objective' : 'Name'}
            <input
              autoFocus
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={kind === 'work' ? 'Add credit rating rule' : 'Trace the data flow'}
            />
          </label>
        )}
        {['investigation', 'clip'].includes(kind) && (
          <label>
            Investigation model
            <ModelSelect value={model} onChange={setModel} />
          </label>
        )}
        <div className={graphite('modal-footer')}>
          <button type="button" className={graphite('button')} onClick={close}>
            Cancel
          </button>
          <button
            className={graphite('button primary')}
            disabled={busy || (kind === 'work' && !projectId)}
          >
            {busy ? (
              <Loader2 size={15} className={graphite('spin')} />
            ) : kind === 'clip' ? (
              <Scissors size={15} />
            ) : (
              <Plus size={15} />
            )}{' '}
            {kind === 'clip'
              ? 'Clip context'
              : kind === 'work'
                ? 'Create work'
                : 'Create investigation'}
          </button>
        </div>
      </form>
    );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(async () => {
          if (kind === 'merge') {
            await api(`/investigations/${source?.id}/merge`, {
              targetId: target,
              findings,
              sourceMessageIds: findings.map(
                (f) => candidateMessages.find((m) => m.content === f)?.id,
              ),
            });
            setActiveId(target);
            setSideId(source?.id || '');
            setToast('Findings merged. Both histories preserved.');
          } else {
            const r = await api('/runs', {
              candidateId: candidate?.id,
              investigationId: source?.id,
              objective,
              findings,
              sourceMessageIds: findings.map(
                (f) => candidateMessages.find((m) => m.content === f)?.id,
              ),
              constraints: constraints.split('\n').filter(Boolean),
              acceptanceCriteria: criteria.split('\n').filter(Boolean),
              openQuestions: questions.split('\n').filter(Boolean),
              model,
              allowTestExecution,
              queue: true,
            });
            setToast(r.status === 'queued' ? 'Task added' : 'Task started · see Tasks');
          }
        });
      }}
    >
      <span className={graphite('eyebrow')}>
        {kind === 'merge'
          ? 'TRANSFER UNDERSTANDING, NOT CHAT HISTORY'
          : 'A FRESH SUBAGENT. A CLEAR SCOPE.'}
      </span>
      <h2>{kind === 'merge' ? 'Merge what matters.' : 'Review implementation'}</h2>
      {kind === 'handoff' && candidate && (
        <div className={graphite('candidate-handoff')}>
          <GitBranch size={14} />
          {candidate.title} · revision {candidate.version}
          <p>{candidate.approach}</p>
        </div>
      )}
      <p>
        {kind === 'merge'
          ? `Choose the findings to bring from ${source?.title}. Sources and uncertainty stay attached.`
          : `A fresh Pi subagent will receive this handoff from ${source?.title} when its turn arrives. Review the result here when it finishes.`}
      </p>
      {kind === 'merge' ? (
        <label>
          Merge into
          <select value={target} onChange={(e) => setTarget(e.target.value)}>
            {investigations
              .filter((i) => i.id !== source?.id)
              .map((i) => (
                <option key={i.id} value={i.id}>
                  {i.title}
                </option>
              ))}
          </select>
        </label>
      ) : (
        <>
          <label>
            Objective
            <textarea required value={objective} onChange={(e) => setObjective(e.target.value)} />
          </label>
          <label>
            Implementation model
            <ModelSelect value={model} onChange={setModel} />
          </label>
        </>
      )}
      <div className={graphite('field-label')}>
        Selected findings <span className={graphite('count')}>{findings.length}</span>
      </div>
      <div className={graphite('findings')}>
        {initialFindings.length ? (
          initialFindings.map((f, i) => (
            <label className={graphite('finding')} key={i}>
              <input
                type="checkbox"
                checked={findings.includes(f)}
                onChange={(e) =>
                  setFindings(e.target.checked ? [...findings, f] : findings.filter((x) => x !== f))
                }
              />
              <div>
                <span>{f}</span>
                <small>
                  <Link size={11} /> {source?.title} · evidence retains original confidence
                </small>
              </div>
            </label>
          ))
        ) : (
          <p className={graphite('muted')}>
            No assistant findings yet.{' '}
            {kind === 'handoff'
              ? 'The objective and explicit criteria will form the handoff.'
              : 'Explore this investigation before merging findings.'}
          </p>
        )}
      </div>
      {kind === 'handoff' && model === 'demo' && (
        <div className={graphite('inline-warning')}>
          <AlertCircle size={15} />
          Demo executes a fixed example patch: missing history defaults to ineligible. It does not
          implement arbitrary objectives. Choose a live provider for your own task.
        </div>
      )}
      {kind === 'handoff' && (
        <div className={graphite('handoff-fields')}>
          <label>
            Constraints
            <textarea value={constraints} onChange={(e) => setConstraints(e.target.value)} />
          </label>
          <label>
            Acceptance criteria
            <textarea required value={criteria} onChange={(e) => setCriteria(e.target.value)} />
          </label>
          <label>
            Unresolved assumptions
            <textarea
              value={questions}
              onChange={(e) => setQuestions(e.target.value)}
              placeholder="Anything the implementation should flag, not guess"
            />
          </label>
        </div>
      )}
      {kind === 'handoff' && model !== 'demo' && (
        <label className={graphite('trust-approval')}>
          <input
            type="checkbox"
            checked={allowTestExecution}
            onChange={(e) => setAllowTestExecution(e.target.checked)}
          />
          <span>
            Allow the configured test command to run. Repository code, including generated tests,
            runs with this server’s OS permissions, not in a security sandbox. Only approve for
            trusted projects.
          </span>
        </label>
      )}
      <div className={graphite('preview-note')}>
        <CheckCircle2 size={16} />
        {kind === 'merge'
          ? 'Context only. No code is changed.'
          : 'One task runs at a time in this worktree. Follow progress in Tasks.'}
      </div>
      <div className={graphite('modal-footer')}>
        <button className={graphite('button')} type="button" onClick={close}>
          Cancel
        </button>
        <button
          className={graphite('button ' + (kind === 'merge' ? 'green' : 'primary'))}
          disabled={busy || (kind === 'merge' && (!findings.length || !target))}
        >
          {busy ? (
            <Loader2 size={15} className={graphite('spin')} />
          ) : kind === 'merge' ? (
            <GitBranch size={15} />
          ) : (
            <Play size={15} />
          )}{' '}
          {kind === 'merge' ? 'Merge findings' : 'Approve & add to queue'}
        </button>
      </div>
    </form>
  );
}
function ReferenceText({ text }: { text: string }) {
  const context = useContext(AppContext) as AppContextValue | null;
  return (
    <>
      {text.split(/((?:[\w@.-]+\/)+[\w.-]+(?:\.[\w]+)(?::\d+(?:-\d+)?)?)/g).map((part, index) =>
        index % 2 && context ? (
          <button
            key={index}
            className={graphite('source-reference')}
            title={`Open ${part}`}
            onClick={() => {
              context.setSourcePath(part);
              context.setModal('source');
            }}
          >
            {part}
          </button>
        ) : (
          part
        ),
      )}
    </>
  );
}
function MessageContent({ content, onClip }: { content: string; onClip?: (code: string) => void }) {
  const context = useContext(AppContext) as AppContextValue;
  return (
    <MessageBody
      content={content}
      onClip={onClip}
      onReference={(path) => {
        context.setSourcePath(path);
        context.setModal('source');
      }}
    />
  );
}

function ProjectImport() {
  const {
    act,
    setProjectId,
    setWorkId,
    setActiveId,
    setSideId,
    setRunId,
    setModal,
    setToast,
    busy,
  } = useContext(AppContext) as AppContextValue;
  const [folder, setFolder] = useState(''),
    [listing, setListing] = useState<{
      path: string;
      parent: string;
      isRepository: boolean;
      directories: { name: string; path: string; isRepository: boolean }[];
    } | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const sequence = useRef(0);
  const browse = async (path?: string) => {
    const request = ++sequence.current;
    setLoading(true);
    setError('');
    try {
      const result = await api('/directories' + (path ? '?path=' + encodeURIComponent(path) : ''));
      if (request === sequence.current) {
        setListing(result);
        setFolder(result.path);
      }
    } catch (e) {
      if (request === sequence.current) setError((e as Error).message);
    } finally {
      if (request === sequence.current) setLoading(false);
    }
  };
  useEffect(() => {
    void browse();
    return () => {
      sequence.current++;
    };
  }, []);
  return (
    <>
      <span className={graphite('eyebrow')}>YOUR CODE, YOUR WORKSPACE</span>
      <h2>Import a project</h2>
      <p>Choose an existing Git repository on this computer.</p>
      <form
        className={graphite('folder-location')}
        onSubmit={(e) => {
          e.preventDefault();
          void browse(folder);
        }}
      >
        <input
          aria-label="Codebase path"
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
          placeholder="Paste a folder path…"
        />
        <button
          className={graphite('button')}
          disabled={loading || !folder}
          aria-label="Browse path"
        >
          <ArrowRight size={16} />
        </button>
      </form>
      {error && (
        <p className={graphite('import-error')} role="alert">
          {error}
        </p>
      )}
      <div className={graphite('folder-browser')} aria-busy={loading}>
        <button
          className={graphite('folder-row parent-folder')}
          disabled={loading || listing?.parent === listing?.path}
          onClick={() => void browse(listing?.parent)}
        >
          <ArrowLeft size={16} />
          <span>Parent folder</span>
        </button>
        {loading ? (
          <div className={graphite('folder-loading')}>
            <Loader2 size={18} className={graphite('spin')} />
            Loading folders…
          </div>
        ) : listing?.directories.length ? (
          listing.directories.map((dir) => (
            <button
              className={graphite('folder-row')}
              key={dir.path}
              onClick={() => void browse(dir.path)}
            >
              <Folder size={17} />
              <span>{dir.name}</span>
              {dir.isRepository && <small>Git</small>}
              <ChevronRight size={14} />
            </button>
          ))
        ) : (
          <p className={graphite('folder-loading')}>No subfolders</p>
        )}
      </div>
      <div className={graphite('import-selection')}>
        <GitBranch size={15} />
        <span>
          {listing?.isRepository
            ? `${listing.path.split('/').pop()} · Git repository`
            : 'Select a folder containing a Git repository'}
        </span>
      </div>
      <div className={graphite('modal-footer')}>
        <button className={graphite('button')} onClick={() => setModal('')}>
          Cancel
        </button>
        <button
          className={graphite('button primary')}
          disabled={busy || loading || !listing?.isRepository || listing.path !== folder}
          onClick={() =>
            act(async () => {
              const p = await api('/projects', { path: folder });
              setProjectId(p.id);
              setWorkId(p.work.id);
              setActiveId(p.investigation.id);
              setSideId('');
              setRunId('');
              setModal('');
              setToast(`${p.name} imported · Primary work ready`);
            })
          }
        >
          {busy ? <Loader2 size={15} className={graphite('spin')} /> : <Plus size={15} />}Import
          codebase
        </button>
      </div>
    </>
  );
}

function InvestigationActions({
  inv,
  secondary = false,
}: {
  inv: Investigation;
  secondary?: boolean;
}) {
  const { investigations, openHandoff, setSideId, setModal, setSourceId, setSourcePath } =
    useContext(AppContext) as AppContextValue;
  return (
    <div className={graphite('console-controls')}>
      <button className={graphite('button subtle')} onClick={() => setModal('work')}>
        <Plus size={14} />
        New work
      </button>
      <button
        className={graphite('button subtle')}
        onClick={() => {
          setSourcePath('');
          setModal('source');
        }}
      >
        <FileCode size={14} />
        Browse source
      </button>
      {investigations.length > 1 && (
        <button
          className={graphite('button subtle')}
          aria-label="Merge"
          title="Merge findings"
          onClick={() => {
            setSourceId(inv.id);
            setModal('merge');
          }}
        >
          <GitBranch size={13} />
          Merge
        </button>
      )}
      <button
        className={graphite('button implement')}
        aria-label="Add to queue"
        title="Add to queue"
        onClick={() => openHandoff(inv.id)}
      >
        <Plus size={12} />
        Add to queue
      </button>
      <button
        className={graphite('icon-button')}
        aria-label={`Rename ${inv.title}`}
        title="Rename investigation"
        onClick={() => {
          setSourceId(inv.id);
          setModal('rename');
        }}
      >
        <Pencil size={15} />
      </button>
    </div>
  );
}

function Conversation({ inv }: { inv: Investigation }) {
  const {
    state,
    work,
    investigations,
    liveRun,
    refresh,
    act,
    openHandoff,
    setSideId,
    setModal,
    setSourceId,
    setError,
  } = useContext(AppContext) as AppContextValue;
  const [draft, setDraft] = useState(''),
    [sending, setSending] = useState(false),
    [stream, setStream] = useState<NonNullable<State['chatProgress']>[number] | null>(null);
  const scroll = useRef<HTMLDivElement>(null),
    follow = useRef(true),
    input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    input.current?.focus();
  }, [inv.id]);
  const messages = state.messages.filter((m) => m.investigationId === inv.id);
  const progress = stream || state.chatProgress?.find((p) => p.investigationId === inv.id);
  const working = sending || !!progress;
  const available = state.providers.some((p) => p.id === inv.model && p.available);
  useEffect(() => {
    if (typeof EventSource === 'undefined') return;
    const events = new EventSource(`/api/investigations/${inv.id}/events`);
    events.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStream(data.progress || null);
      if (data.finished) void refresh();
    };
    return () => events.close();
  }, [inv.id, refresh]);
  useEffect(() => {
    if (follow.current && scroll.current)
      scroll.current.scrollTop = messages.length || working ? scroll.current.scrollHeight : 0;
  }, [messages.length, progress?.text, progress?.activity.length]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || working || !available) return;
    const content = draft;
    setDraft('');
    setSending(true);
    follow.current = true;
    try {
      await api(`/investigations/${inv.id}/messages`, { content });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
      setDraft(content);
    } finally {
      setSending(false);
      setStream(null);
      input.current?.focus();
    }
  };
  return (
    <section
      className={graphite('console' + (!messages.length && !working ? ' empty-conversation' : ''))}
      role="tabpanel"
      id={`panel-${inv.id}`}
      aria-labelledby={`tab-${inv.id}`}
    >
      <details className={graphite('investigation-options')}>
        <summary aria-label="Investigation actions">
          <MoreHorizontal size={18} />
        </summary>
        <InvestigationActions inv={inv} />
      </details>
      <div
        className={graphite('console-scroll')}
        ref={scroll}
        onScroll={() => {
          const el = scroll.current;
          if (el) follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
        }}
      >
        {messages
          .filter(
            (message, index) =>
              !message.sourceRunId ||
              !messages.slice(index + 1).some((next) => next.sourceRunId === message.sourceRunId),
          )
          .map((message) => (
            <ConsoleOutput key={message.id} message={message} />
          ))}
        {working && (
          <article
            className={graphite('console-output assistant')}
            aria-label="Assistant responding"
            aria-live="polite"
          >
            <div className={graphite('console-output-heading')}>
              <span className={graphite('console-output-glyph')}>
                <AgentMark working />
              </span>
              <strong>Jove</strong>
              <span>{progress?.text ? 'Responding…' : 'Thinking…'}</span>
            </div>
            {progress?.text && (
              <div className={graphite('console-output-content')}>
                <MessageContent content={progress.text} />
              </div>
            )}
          </article>
        )}
      </div>
      {liveRun?.status === 'running' && (
        <div className={graphite('console-notice')}>
          <span className={graphite('status-dot')} />
          Jove is working on a change. Findings may need rechecking.
        </div>
      )}
      {!messages.length && !working && <ConversationGuide />}
      <form className={graphite('console-input')} onSubmit={submit}>
        <div className={graphite('console-prompt-row')}>
          <span className={graphite('console-prompt-mark')}>›</span>
          <textarea
            ref={input}
            aria-label={`Message ${inv.title}`}
            value={draft}
            placeholder={
              available ? 'Ask Jove about this investigation…' : 'Connect a model in Pi to begin…'
            }
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
              if (e.key === 'ArrowUp' && !draft) {
                const previous = messages.filter((m) => m.role === 'user').at(-1);
                if (previous) {
                  e.preventDefault();
                  setDraft(previous.content);
                }
              }
            }}
          />
        </div>
        <div className={graphite('console-input-footer')}>
          <ModelSelect
            disabled={working}
            value={inv.model}
            onChange={(model) =>
              act(async () => {
                await api(`/investigations/${inv.id}`, { model }, 'PATCH');
              })
            }
          />
          <span className={graphite('composer-context')}>
            <Layers size={12} />
            {messages.filter((m) => m.role === 'artifact' && !m.sourceRunId).length} clips
          </span>
          {working ? (
            <button
              className={graphite('console-send stop')}
              type="button"
              aria-label="Stop response"
              onClick={() =>
                act(async () => {
                  await api(`/investigations/${inv.id}/stop`, {});
                })
              }
            >
              <Square size={13} />
            </button>
          ) : (
            <button
              className={graphite('console-send')}
              disabled={!draft.trim() || !available}
              aria-label="Send message"
            >
              <ArrowUp size={15} />
            </button>
          )}
        </div>
      </form>
      <footer className={graphite('console-status')}>
        <Lock size={12} />
        {working ? 'Investigating…' : available ? 'Read-only investigation' : 'Pi unavailable'}
        <span className={graphite('console-keyboard-hint')}>
          Enter to send <span>· Shift + Enter for a new line</span>
        </span>
      </footer>
    </section>
  );
}

function ConsoleOutput({ message }: { message: Message }) {
  const {
    state,
    work,
    investigations,
    openClip,
    openHandoff,
    setActiveId,
    setSideId,
    setToast,
    setError,
    setRunId,
    setRunTab,
    act,
  } = useContext(AppContext) as AppContextValue;
  const content = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false),
    [taskDraft, setTaskDraft] = useState('');
  const stale =
    message.stale ||
    Boolean(message.revision && work?.revision && message.revision !== work.revision);
  const copy = async (text = message.content) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast('Copied output');
    } catch {
      setError('Clipboard access is unavailable. Select and copy the text manually.');
    }
  };
  if (message.sourceRunId) {
    const task = state.runs.find((run) => run.id === message.sourceRunId);
    if (!task) return null;
    const status = {
      queued: 'Queued',
      running: 'Working',
      paused: 'Paused',
      interrupted: 'Stopped',
      failed: 'Needs attention',
      completed: 'Ready to review',
    }[task.status];
    const detail =
      task.status === 'completed'
        ? `${task.changedFiles.length} ${task.changedFiles.length === 1 ? 'file' : 'files'} changed`
        : task.status === 'running'
          ? 'Working on your approved change'
          : task.status === 'queued'
            ? 'Waiting to start'
            : 'Your existing changes are saved';
    return (
      <article
        className={graphite('chat-task-update')}
        aria-label={`Task update: ${task.objective}`}
      >
        <span className={graphite('task-update-icon ' + task.status)}>
          <TaskExecutionIcon status={task.status} />
        </span>
        <div className="min-w-0 flex-1">
          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void act(async () => {
                  await api(`/runs/${task.id}`, { objective: taskDraft }, 'PATCH');
                  setEditing(false);
                });
              }}
            >
              <textarea
                aria-label="Task objective"
                className="w-full rounded border border-line bg-white p-2 text-sm"
                value={taskDraft}
                onChange={(e) => setTaskDraft(e.target.value)}
              />
              <button disabled={!taskDraft.trim()}>Save</button>
              <button type="button" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </form>
          ) : (
            <strong className="line-clamp-2" title={task.objective}>
              {task.objective}
            </strong>
          )}
          <p>
            <span>{status}</span>
            <span aria-hidden="true">·</span>
            {detail}
          </p>
        </div>
        {task.status === 'queued' && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => {
                setTaskDraft(task.objective);
                setEditing(true);
              }}
            >
              Edit
            </button>
            <button
              onClick={() =>
                act(async () => {
                  await api(`/runs/${task.id}/control`, { action: 'start' });
                })
              }
            >
              Start
            </button>
            <button
              onClick={() =>
                act(async () => {
                  await api(`/runs/${task.id}`, {}, 'DELETE');
                })
              }
            >
              Remove
            </button>
          </div>
        )}
        <button
          onClick={() => {
            setRunTab(task.status === 'completed' ? 'diff' : 'summary');
            setRunId(task.id);
          }}
        >
          {task.status === 'completed' ? 'Review' : 'Details'}
          <ArrowRight size={13} />
        </button>
      </article>
    );
  }
  return (
    <article
      className={graphite('console-output ' + message.role)}
      aria-label={message.role === 'assistant' ? 'Assistant response' : undefined}
      id={'message-' + message.id}
    >
      <div className={graphite('console-output-heading')}>
        <span className={graphite('console-output-glyph')}>
          {message.role === 'user' ? (
            <UserMark />
          ) : message.role === 'artifact' ? (
            <Scissors size={13} />
          ) : (
            <AgentMark />
          )}
        </span>
        <strong>
          {message.role === 'user' ? 'You' : message.role === 'assistant' ? 'Jove' : 'Context'}
        </strong>
        <time>
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </time>
        {message.role === 'assistant' && (
          <span className={graphite('console-model')}>
            {state.providers.find((p) => p.id === message.model)?.name.split(' · ')[0]}
          </span>
        )}
      </div>
      {message.sourceInvestigationId && (
        <button
          className={graphite('console-source')}
          onClick={() => {
            setActiveId(message.sourceInvestigationId!);
            setSideId('');
          }}
        >
          <Link size={11} />
          From{' '}
          {investigations.find((i) => i.id === message.sourceInvestigationId)?.title ||
            'source investigation'}
        </button>
      )}
      <div className={graphite('console-output-content')} ref={content}>
        <MessageContent content={message.content} onClip={(code) => openClip(message, code)} />
      </div>

      {stale && (
        <span className={graphite('stale-tag')}>Evidence may be stale · codebase changed</span>
      )}
      <SelectionToolbar
        content={content}
        onClip={(text) => openClip(message, text)}
        onCopy={(text) => void copy(text)}
        onQueue={
          message.role === 'assistant' || (message.role === 'artifact' && message.sourceMessageId)
            ? (text) => openHandoff(message.investigationId, { ...message, content: text })
            : undefined
        }
      />
      <div
        className={graphite('console-inline-actions')}
        role="toolbar"
        aria-label="Message actions"
      >
        <button
          aria-label="Clip"
          title="Clip message"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => openClip(message, message.content)}
        >
          <Scissors size={15} />
        </button>
        <button
          aria-label="Copy"
          title="Copy message"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => void copy()}
        >
          <Copy size={15} />
        </button>
        {(message.role === 'assistant' ||
          (message.role === 'artifact' && message.sourceMessageId && !message.sourceRunId)) && (
          <button
            aria-label="Add to queue"
            title="Add message to a task"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => openHandoff(message.investigationId, message)}
          >
            <Plus size={15} />
          </button>
        )}
      </div>
    </article>
  );
}

function TaskNavigation({
  projectId,
  selectedRunId,
  onSelectWork,
}: {
  projectId: string;
  selectedRunId: string;
  onSelectWork: (id: string) => void;
}) {
  const { state, act, setRunId, setRunTab, busy } = useContext(AppContext) as AppContextValue;
  const workIds = new Set(
    state.works
      .filter((work) => work.projectId === projectId && work.status !== 'archived')
      .map((work) => work.id),
  );
  const runs = state.runs
    .filter((run) => workIds.has(run.workId))
    .sort((a, b) => (a.queueOrder ?? 0) - (b.queueOrder ?? 0));
  const control = (run: Run, action: string) =>
    act(async () => {
      await api(`/runs/${run.id}/control`, { action });
    });
  const view = (run: Run) => {
    onSelectWork(run.workId);
    setRunTab(run.status === 'completed' ? 'diff' : 'terminal');
    setRunId(run.id);
  };
  return (
    <nav aria-label="Tasks">
      <div className="min-w-0 space-y-1">
        {runs.length ? (
          runs.map((run) => {
            const owner = runs.find(
              (item) => item.workId === run.workId && ['running', 'paused'].includes(item.status),
            );
            const action =
              run.status === 'running' ? 'pause' : run.status === 'queued' ? 'start' : 'resume';
            const label = action === 'pause' ? 'Pause' : action === 'start' ? 'Start' : 'Resume';
            const blocked = action !== 'pause' && !!owner && owner.id !== run.id;
            return (
              <article
                className={
                  graphite('queue-item ' + (selectedRunId === run.id ? 'selected' : '')) +
                  ' relative before:absolute before:left-[14px] before:top-8 before:-bottom-2 before:w-px before:bg-line last:before:hidden'
                }
                key={run.id}
              >
                <button
                  className={graphite('queue-item-info')}
                  aria-current={selectedRunId === run.id ? 'page' : undefined}
                  onClick={() => view(run)}
                  title={run.objective}
                >
                  <TaskExecutionIcon status={run.status} />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-xs font-normal">{run.objective}</h3>
                    <span className={graphite('queue-item-status ' + run.status)}>
                      {run.status === 'completed'
                        ? 'Ready to review'
                        : run.status === 'running'
                          ? 'Implementing'
                          : run.status === 'interrupted'
                            ? 'Stopped'
                            : run.status === 'failed'
                              ? 'Needs attention'
                              : run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                    </span>
                  </div>
                </button>
              </article>
            );
          })
        ) : (
          <p className="px-2 py-2 text-xs text-muted">No tasks yet</p>
        )}
      </div>
    </nav>
  );
}

function TaskExecutionIcon({ status }: { status: string }) {
  const Icon =
    status === 'running'
      ? Loader2
      : status === 'queued'
        ? Clock
        : status === 'paused'
          ? Pause
          : status === 'interrupted'
            ? Square
            : status === 'failed'
              ? AlertCircle
              : status === 'completed'
                ? CheckCircle2
                : Terminal;
  return (
    <Icon
      aria-hidden="true"
      size={14}
      className={
        status === 'running'
          ? 'mt-0.5 shrink-0 text-chalk motion-safe:animate-spin'
          : status === 'failed'
            ? 'mt-0.5 shrink-0 text-error'
            : status === 'completed'
              ? 'mt-0.5 shrink-0 text-attention'
              : 'mt-0.5 shrink-0 text-muted'
      }
    />
  );
}

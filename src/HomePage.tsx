import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowUp,
  Check,
  FileCode2,
  FolderOpen,
  Paperclip,
  RotateCcw,
  CornerDownRight,
} from 'lucide-react';
import AgentMark from './AgentMark';
import JoveWordmark from './JoveWordmark';
import type { State } from './types';
import { paper } from './design-system/paper';

type Props = {
  state: State;
  onImport: () => void;
  onOpen: (projectId: string, workId: string, investigationId?: string) => void;
};

export default function HomePage({ state, onImport, onOpen }: Props) {
  const [example, setExample] = useState<'idle' | 'ask' | 'clip' | 'task'>('idle');
  const projects = state.projects
    .map((project) => {
      const works = state.works.filter(
        (work) => work.projectId === project.id && work.status !== 'archived',
      );
      const tabs = state.investigations.filter((tab) =>
        works.some((work) => work.id === tab.workId),
      );
      const messages = state.messages.filter((message) =>
        tabs.some((tab) => tab.id === message.investigationId),
      );
      const latest = messages.reduce<(typeof messages)[number] | undefined>(
        (last, message) => (!last || message.createdAt > last.createdAt ? message : last),
        undefined,
      );
      const tab =
        tabs.find((item) => item.id === latest?.investigationId) ||
        tabs.find((item) => item.isMain) ||
        tabs[0];
      const work = works.find((item) => item.id === tab?.workId) || works[0];
      const running = state.runs.filter(
        (run) => works.some((item) => item.id === run.workId) && run.status === 'running',
      ).length;
      return { project, tab, work, latest, running };
    })
    .sort((a, b) => (b.latest?.createdAt || '').localeCompare(a.latest?.createdAt || ''));
  const dateLabel = (value?: string) => {
    if (!value) return 'Ready to explore';
    const date = new Date(value),
      today = new Date(),
      yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };
  const serif = '[font-family:Georgia,serif]';
  return (
    <div className="relative flex min-h-full flex-col bg-[#faf8f3] px-6 pb-6 pt-12 text-[#302c40] [font-family:Geist,sans-serif] sm:px-12 sm:pt-14 lg:px-20">
      <div className="absolute right-6 top-6 flex items-center gap-2 text-xs tracking-normal text-[#817b89] sm:right-8">
        <span className="size-1.5 rounded-full bg-[#64aa78]" />
        Local workspace
      </div>
      <div className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col">
        <header className="flex flex-col items-center text-center">
          <AgentMark animated className="!size-[132px] sm:!size-[152px]" />
          <JoveWordmark hero />
          <h1
            className={
              serif +
              ' mt-6 max-w-[720px] text-[30px] font-normal leading-[1.16] tracking-[-0.035em] sm:text-[44px]'
            }
          >
            What are we figuring out today?
          </h1>
          <p className="mt-4 text-[15px] leading-6 tracking-normal text-[#827b8b] sm:text-[17px]">
            Open a codebase. Follow your curiosity.
          </p>
          <button
            onClick={onImport}
            className={
              paper('button primary') +
              ' mt-6 !min-h-[52px] min-w-[220px] gap-3 !px-8 !text-[15px] shadow-sm'
            }
          >
            <FolderOpen size={20} />
            Open a project
          </button>
          <p className="mt-2.5 text-xs text-[#89828e]">Choose a local Git repository</p>
        </header>
        {projects.length > 0 && (
          <section aria-label="Recent projects" className="mt-9">
            <div className="mb-2 flex items-center gap-5">
              <h2 className={'shrink-0 text-[13px] font-medium tracking-normal text-[#665e70]'}>
                Pick up where you left off
              </h2>
              <span className="h-px flex-1 bg-[#e4dfe7]" />
            </div>
            {projects.map(({ project, tab, work, latest, running }) => (
              <button
                key={project.id}
                aria-label={'Open ' + project.name}
                onClick={() => onOpen(project.id, work?.id || '', tab?.id)}
                className="group flex w-full items-center gap-4 border-b border-[#e8e3e8] px-2 py-3.5 text-left transition-colors hover:bg-[#f0ecf4] sm:px-4"
              >
                <FolderOpen size={21} className="text-[#706879]" />
                <div className="min-w-0 flex-1">
                  <h3 className={'text-[15px] font-semibold tracking-[-0.02em]'}>{project.name}</h3>
                  <p className="mt-1 truncate text-[13px] text-[#89818e]">
                    {latest?.role === 'user'
                      ? latest.content
                      : tab && !tab.isMain
                        ? 'Continue ' + tab.title
                        : work?.objective && work.objective !== 'General'
                          ? work.objective
                          : 'Explore your codebase'}
                  </p>
                </div>
                {running > 0 && (
                  <span className="hidden items-center gap-1.5 text-xs text-[#80699b] sm:flex">
                    <span className="size-1.5 animate-pulse rounded-full bg-current" />
                    {running} running
                  </span>
                )}
                <span className="hidden text-xs text-[#89818e] sm:block">
                  {dateLabel(latest?.createdAt)}
                </span>
                <ArrowRight size={19} className="transition-transform group-hover:translate-x-1" />
              </button>
            ))}
          </section>
        )}
        <section aria-label="How Jove works" className="mt-9 pb-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <span className="text-[11px] font-medium tracking-[0.08em] text-[#9b91a4]">
              A LITTLE CURIOSITY GOES A LONG WAY
            </span>
            <button
              onClick={() => setExample('idle')}
              className="inline-flex items-center gap-1.5 text-[11px] text-[#8f819f] hover:text-[#634c83]"
              aria-label="Replay walkthrough"
            >
              <RotateCcw size={12} />
              {example === 'idle' ? 'Try the examples' : 'Replay'}
            </button>
          </div>
          <div className="grid gap-8 md:grid-cols-3 md:gap-7">
            <div>
              <Step
                number="01"
                title="Ask anything."
                description="Find your way around the code."
              />
              <div className="mt-4 flex min-h-[192px] flex-col overflow-hidden rounded-xl border border-[#e4dfe9] bg-[#fffdfb] shadow-[0_3px_12px_#38274304]">
                <div className="flex items-center gap-2 border-b border-[#eee9ef] px-3.5 py-2 text-[10px] text-[#96899e]">
                  <span className="size-1 rounded-full bg-[#b19acb]" />
                  General<span className="ml-auto">EXAMPLE</span>
                </div>
                <button
                  onClick={() => setExample('ask')}
                  aria-label="Preview asking a question"
                  className="m-3 flex items-center gap-2 rounded-lg border border-[#efddd7] bg-[#fcf2ee] px-3 py-2.5 text-left text-[12px] leading-5 text-[#675b63]"
                >
                  <span className="flex-1">Where do we validate tokens?</span>
                  <ArrowUp size={14} />
                </button>
                <div className="flex gap-2.5 px-3.5 pb-3">
                  <AgentMark className="!size-6" />
                  <div className="min-w-0 text-[12px] leading-5 text-[#756b80]">
                    <p>At the request boundary, before the handler runs.</p>
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded bg-[#f2edf7] px-1.5 font-mono text-[10px] text-[#9473b1]">
                      <FileCode2 size={11} />
                      src/auth.ts:24
                    </span>
                    {example === 'ask' && (
                      <p role="status" className="mt-2 text-[#81639e]">
                        Next: ask how failures are handled.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <Step
                number="02"
                title="Follow a thread."
                description="One useful bit. A fresh conversation."
              />
              <div className="relative mt-4 min-h-[192px] rounded-xl border border-[#e4dfe9] bg-[#fffdfb] shadow-[0_3px_12px_#38274304]">
                <div className="flex items-center gap-2 border-b border-[#eee9ef] px-3.5 py-2 text-[10px] text-[#96899e]">
                  <FileCode2 size={12} />
                  src/auth.ts<span className="ml-auto">SELECT → CLIP</span>
                </div>
                <div className="px-3.5 py-3 font-mono text-[10px] leading-6">
                  <div>
                    <span className="mr-3 text-[#b4acbb]">24</span>
                    <mark className="rounded-sm bg-[#e9def8] px-1 py-1 text-[#775693]">
                      const token = verify(request);
                    </mark>
                  </div>
                  <div>
                    <span className="mr-3 text-[#b4acbb]">25</span>
                    <span className="text-[#b2a9b9]">return next(token);</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3.5">
                  <CornerDownRight size={15} className="!text-[#b9a6ca]" />
                  <div className="flex flex-1 items-center gap-2 rounded-lg border border-[#dfd4e9] bg-[#f7f2fc] px-2.5 py-2">
                    <span className="size-1.5 rounded-full bg-[#a184c0]" />
                    <span className="text-[11px] text-[#78628c]">Token validation</span>
                    <button
                      aria-label="Preview clipping into a new tab"
                      onClick={() => setExample('clip')}
                      className="ml-auto grid size-7 place-items-center rounded-md bg-white text-[#80609f] shadow-sm"
                    >
                      <Paperclip size={14} />
                    </button>
                  </div>
                </div>
                <p
                  role={example === 'clip' ? 'status' : undefined}
                  className="px-4 pb-3 pt-2 text-[10px] text-[#a192ab]"
                >
                  {example === 'clip'
                    ? 'Context ready. What would you like to know?'
                    : 'Opens a new tab with its source attached.'}
                </p>
              </div>
            </div>
            <div>
              <Step
                number="03"
                title="Make it happen."
                description="Your context becomes a clear task."
              />
              <div className="mt-4 min-h-[192px] overflow-hidden rounded-xl border border-[#e4dfe9] bg-[#fffdfb] shadow-[0_3px_12px_#38274304]">
                <div className="flex items-center gap-2 border-b border-[#eee9ef] px-3.5 py-2 text-[10px] text-[#96899e]">
                  <span className="size-1 rounded-full bg-[#b19acb]" />
                  Tasks<span className="ml-auto">EXAMPLE</span>
                </div>
                <div className="flex items-center gap-2.5 px-3.5 py-4">
                  <span
                    className={
                      'grid size-4 shrink-0 place-items-center rounded-full border ' +
                      (example === 'task' ? 'border-[#89b59e] bg-[#edf6ef]' : 'border-[#c0b4cc]')
                    }
                  >
                    {example === 'task' && <Check size={10} className="!text-[#639276]" />}
                  </span>
                  <span className="flex-1 text-[12px]">Handle expired tokens</span>
                  <button
                    onClick={() => setExample(example === 'task' ? 'idle' : 'task')}
                    aria-label="Preview starting a task"
                    className={paper('button primary') + ' min-h-7 px-3 py-1 text-[11px]'}
                  >
                    {example === 'task' ? 'Replay' : 'Start'}
                  </button>
                </div>
                <div className="mx-3.5 border-t border-[#eee9ef] pt-3">
                  <div className="flex items-center gap-2 text-[11px] text-[#918699]">
                    <FileCode2 size={12} />
                    <span className="flex-1 font-mono text-[10px]">src/auth.ts</span>
                    <span className="text-[#6c9c7d]">+12</span>
                    <span className="text-[#bc8b8b]">−3</span>
                  </div>
                  <p
                    role={example === 'task' ? 'status' : undefined}
                    className="mt-2.5 pb-3 text-[10px] text-[#a192ab]"
                  >
                    {example === 'task'
                      ? 'Ready to review. You decide what ships.'
                      : 'Start when ready. Review every change.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <footer className="mt-auto pt-3 text-center text-xs text-[#89818e]">
          Built by{' '}
          <a
            href="https://x.com/thegrandimam"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-4 hover:text-[#68517d] hover:underline"
          >
            @thegrandimam
          </a>
        </footer>
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="pt-1 font-mono text-[11px] text-[#b4a4c4]">{number}</span>
      <div>
        <h2 className="text-[17px] font-medium tracking-[-0.035em] text-[#514358]">{title}</h2>
        <p className="mt-1 text-[12px] leading-5 text-[#928797]">{description}</p>
      </div>
    </div>
  );
}

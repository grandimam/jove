import React, { useState } from 'react';
import { ArrowRight, Check, Paperclip, RotateCcw } from 'lucide-react';

/** A local demonstration; trying it never creates or changes a real conversation. */
export default function ConversationGuide() {
  const [shown, setShown] = useState(false);
  return (
    <section aria-label="Conversation capabilities" className="mx-6 mb-5 text-xs">
      <div className="mb-4 flex items-center gap-1 text-muted">
        <span className="text-ink">Clip text into another tab</span>
        <span className="ml-auto text-[10px]">TRY AN EXAMPLE</span>
      </div>
      <div className="rounded-xl border border-line bg-white/60 p-4">
        <div className="mb-3 flex items-center gap-2 text-[10px] text-muted">
          <span className="size-1 rounded-full bg-[#aaa69e]" />
          General
        </div>
        <p className="text-[13px] leading-6 text-ink">
          Use short-lived access tokens.
          <br />
          <mark className="rounded bg-[#e8e2f5] px-1 py-0.5 text-ink">
            Refresh tokens expire after 30 days.
          </mark>
        </p>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShown(true)}
            disabled={shown}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-control bg-white px-2.5 text-ink shadow-sm hover:bg-neutral disabled:shadow-none"
          >
            {shown ? <Check size={13} /> : <Paperclip size={13} />}{' '}
            {shown ? 'Done' : 'Clip selected text'}
          </button>
          <span className="text-[11px] text-muted">{shown ? '' : 'Opens a new tab instantly'}</span>
        </div>
        {shown && (
          <div className="mt-4 border-t border-line pt-3" role="status">
            <div className="mb-2 flex items-center gap-2 text-[11px] text-muted">
              <ArrowRight size={14} />
              <span className="rounded border border-line bg-surface px-2 py-1 font-medium text-ink">
                Token expiry
              </span>
              <button
                type="button"
                aria-label="Replay example"
                className="ml-auto rounded p-1 hover:bg-neutral"
                onClick={() => setShown(false)}
              >
                <RotateCcw size={13} />
              </button>
            </div>
            <p className="rounded-lg bg-[#f1efea] px-3 py-2 text-ink">
              Refresh tokens expire after 30 days.
            </p>
            <p className="mt-2 text-[11px] text-muted">
              Your clip opens in a new tab with its source. Type your next question and press Enter.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

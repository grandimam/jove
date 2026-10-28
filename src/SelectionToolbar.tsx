import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Paperclip, Plus } from 'lucide-react';

export default function SelectionToolbar({
  content,
  onClip,
  onCopy,
  onQueue,
}: {
  content: React.RefObject<HTMLDivElement | null>;
  onClip: (text: string) => void;
  onCopy: (text: string) => void;
  onQueue?: (text: string) => void;
}) {
  const [selection, setSelection] = useState<{ text: string; left: number; top: number } | null>(
    null,
  );
  const toolbar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      const selected = window.getSelection(),
        host = content.current;
      if (
        !selected ||
        !host ||
        selected.isCollapsed ||
        !selected.rangeCount ||
        !host.contains(selected.anchorNode) ||
        !host.contains(selected.focusNode)
      ) {
        setSelection(null);
        return;
      }
      const text = selected.toString().trim();
      if (!text) {
        setSelection(null);
        return;
      }
      const range = selected.getRangeAt(0),
        rects = Array.from(range.getClientRects());
      const rect = rects.at(-1) || range.getBoundingClientRect();
      const scroll = host.closest('.console-scroll')?.getBoundingClientRect();
      const topLimit = Math.max(8, scroll?.top || 0),
        bottomLimit = Math.min(window.innerHeight - 8, scroll?.bottom || window.innerHeight);
      if (rect.bottom < topLimit || rect.top > bottomLimit) {
        setSelection(null);
        return;
      }
      const width = onQueue ? 112 : 78;
      setSelection({
        text,
        left: Math.max(8, Math.min(rect.right - width / 2, window.innerWidth - width - 8)),
        top:
          rect.top - 44 >= topLimit ? rect.top - 44 : Math.min(rect.bottom + 6, bottomLimit - 38),
      });
    };
    const schedule = () => {
      clearTimeout(frame);
      frame = setTimeout(update, 0);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelection(null);
        window.getSelection()?.removeAllRanges();
      }
    };
    document.addEventListener('selectionchange', schedule);
    document.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    document.addEventListener('keydown', escape);
    return () => {
      clearTimeout(frame);
      document.removeEventListener('selectionchange', schedule);
      document.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('keydown', escape);
    };
  }, [content, Boolean(onQueue)]);
  if (!selection) return null;
  const button =
    'grid size-8 place-items-center rounded-md text-[#62566e] hover:bg-[#eee8f5] hover:text-[#473255] focus-visible:outline-2 focus-visible:outline-[#9682ac]';
  return (
    <>
      <span className="selection-anchor hidden" aria-hidden="true" />
      {createPortal(
        <div
          ref={toolbar}
          role="toolbar"
          aria-label="Selected text actions"
          style={{ left: selection.left, top: selection.top }}
          className="fixed z-[90] flex items-center gap-0.5 rounded-lg border border-[#ddd6e4] bg-[#fffefa] p-1 shadow-[0_4px_16px_#30203d20]"
          onMouseDown={(event) => event.preventDefault()}
        >
          <button
            type="button"
            className={button}
            title="Clip selection to a tab"
            aria-label="Clip selection"
            onClick={() => onClip(selection.text)}
          >
            <Paperclip size={15} />
          </button>
          <button
            type="button"
            className={button}
            title="Copy selection"
            aria-label="Copy selection"
            onClick={() => onCopy(selection.text)}
          >
            <Copy size={15} />
          </button>
          {onQueue && (
            <button
              type="button"
              className={button}
              title="Add selection to a task"
              aria-label="Queue selection"
              onClick={() => onQueue(selection.text)}
            >
              <Plus size={15} />
            </button>
          )}
        </div>,
        document.body,
      )}
    </>
  );
}

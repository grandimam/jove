import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Cpu } from 'lucide-react';
import type { Provider } from './types';

export default function ModelPicker({
  providers,
  value,
  onChange,
  disabled = false,
}: {
  providers: Provider[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [position, setPosition] = useState({ top: 0, left: 0, maxHeight: 320, transform: 'none' });
  const trigger = useRef<HTMLButtonElement>(null),
    menu = useRef<HTMLDivElement>(null),
    menuId = useId();
  const selected = providers.find((provider) => provider.id === value);
  const close = (focus = false) => {
    setOpen(false);
    if (focus) trigger.current?.focus();
  };
  const show = () => {
    const box = trigger.current!.getBoundingClientRect(),
      height = 320,
      width = Math.min(300, window.innerWidth - 24);
    const above = box.top > height || window.innerHeight - box.bottom < height;
    setPosition({
      left: Math.max(12, Math.min(box.right - width, window.innerWidth - width - 12)),
      top: above ? box.top - 8 : box.bottom + 8,
      transform: above ? 'translateY(-100%)' : 'none',
      maxHeight: above
        ? Math.min(height, box.top - 20)
        : Math.min(height, window.innerHeight - box.bottom - 20),
    });
    setOpen(true);
  };
  useEffect(() => {
    if (!open) return;
    (
      menu.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]:not(:disabled)') ||
      menu.current?.querySelector<HTMLButtonElement>('[role="option"]:not(:disabled)')
    )?.focus();
    const outside = (event: PointerEvent) => {
      if (
        !trigger.current?.contains(event.target as Node) &&
        !menu.current?.contains(event.target as Node)
      )
        close();
    };
    const dismiss = () => close();
    document.addEventListener('pointerdown', outside);
    window.addEventListener('resize', dismiss);
    return () => {
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('resize', dismiss);
    };
  }, [open]);
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);
  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-label="Model"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        disabled={disabled}
        onClick={() => (open ? close() : show())}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            show();
          }
        }}
        className="flex min-h-9 max-w-[190px] items-center gap-2 rounded-lg border border-[#dedbe8] bg-[#f5f3fa] px-2.5 text-[12px] text-[#454054] transition-colors hover:border-[#bcb4d6] hover:bg-[#eeebf8] disabled:opacity-50"
      >
        <Cpu size={14} className="shrink-0 text-[#7962be]" />
        <span className="truncate">{selected?.name.split(' · ')[0] || value}</span>
        <ChevronDown
          size={13}
          className={'shrink-0 transition-transform ' + (open ? 'rotate-180' : '')}
        />
      </button>
      {open &&
        createPortal(
          <div
            ref={menu}
            id={menuId}
            role="listbox"
            aria-label="Models"
            style={position}
            className="fixed z-[100] w-[min(300px,calc(100vw-24px))] overflow-y-auto rounded-xl border border-[#dfdbe8] bg-white p-1.5 font-sans text-[13px] text-[#252637] shadow-[0_12px_40px_#241b4430]"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                close(true);
                return;
              }
              if (event.key === 'Tab') {
                close(true);
                return;
              }
              if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
              event.preventDefault();
              const options = Array.from(
                menu.current!.querySelectorAll<HTMLButtonElement>('[role="option"]:not(:disabled)'),
              );
              const index = options.indexOf(document.activeElement as HTMLButtonElement);
              const next =
                options[
                  event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? options.length - 1
                      : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) %
                        options.length
                ];
              next?.focus();
              next?.scrollIntoView?.({ block: 'nearest' });
            }}
          >
            <div className="px-2.5 py-2 text-[10px] font-medium uppercase tracking-wider text-[#858091]">
              Model
            </div>
            {providers.map((provider) => (
              <button
                key={provider.id}
                type="button"
                role="option"
                aria-selected={provider.id === value}
                disabled={!provider.available}
                onClick={() => {
                  onChange(provider.id);
                  close(true);
                }}
                className={
                  'flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left outline-none hover:bg-[#f4f1fb] focus-visible:bg-[#eeebfa] disabled:opacity-45 ' +
                  (provider.id === value ? 'bg-[#f4f1fb]' : '')
                }
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {provider.name.split(' · ')[0]}
                  </span>
                  {!provider.available && (
                    <span className="mt-0.5 block text-[11px] text-[#858091]">Unavailable</span>
                  )}
                </span>
                {provider.id === value && <Check size={15} className="shrink-0 text-[#7962be]" />}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

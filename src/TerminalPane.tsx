import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export default function TerminalPane({ workId, visible }: { workId: string; visible: boolean }) {
  const host = useRef<HTMLDivElement>(null),
    fitRef = useRef<() => void>(() => {});
  const [error, setError] = useState(''),
    [generation, setGeneration] = useState(0);
  useEffect(() => {
    let disposed = false,
      events: EventSource | undefined,
      session = '',
      chain = Promise.resolve();
    const terminal = new Terminal({
      fontFamily: 'Geist Mono, monospace',
      fontSize: 12,
      cursorBlink: true,
      scrollback: 3000,
      theme: {
        background: '#fcfaf7',
        foreground: '#252637',
        cursor: '#5145ff',
        selectionBackground: '#ddd8f4',
        black: '#252637',
        red: '#b04740',
        green: '#27835b',
        yellow: '#996315',
        blue: '#346893',
        magenta: '#7962be',
        cyan: '#317f83',
        white: '#d5d4cd',
        brightBlack: '#7b7d8a',
        brightRed: '#b04740',
        brightGreen: '#27835b',
        brightYellow: '#996315',
        brightBlue: '#346893',
        brightMagenta: '#7962be',
        brightCyan: '#317f83',
        brightWhite: '#252637',
      },
    });
    const fit = new FitAddon();
    terminal.loadAddon(fit);
    terminal.open(host.current!);
    const request = async (suffix: string, body: unknown) => {
      const response = await fetch(`/api/works/${workId}/terminal${suffix}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Terminal disconnected');
      return result;
    };
    const resize = () => {
      if (!host.current?.clientWidth || !host.current?.clientHeight) return;
      fit.fit();
      if (session)
        void request('/resize', { session, cols: terminal.cols, rows: terminal.rows }).catch(
          (e) => {
            if (!disposed) setError(e.message);
          },
        );
    };
    fitRef.current = resize;
    const observer = new ResizeObserver(resize);
    observer.observe(host.current!);
    const input = terminal.onData((data) => {
      if (session)
        chain = chain
          .then(() => request('/input', { session, data }))
          .catch((e) => {
            if (!disposed) setError(e.message);
          });
    });
    setError('');
    void request('', {})
      .then((result) => {
        if (disposed) return;
        session = result.id;
        resize();
        events = new EventSource(
          `/api/works/${workId}/terminal/events?session=${encodeURIComponent(session)}`,
        );
        events.onmessage = (event) => {
          const payload = JSON.parse(event.data);
          if (payload.reset) terminal.reset();
          if (payload.data) terminal.write(payload.data);
          if (payload.exitCode !== undefined) {
            terminal.writeln(`\r\nShell exited (${payload.exitCode}).`);
            setError('Shell exited.');
            events?.close();
          }
        };
        events.onerror = () => {
          if (!disposed) setError('Terminal disconnected. Reopen to reconnect.');
          events?.close();
        };
        terminal.focus();
      })
      .catch((e) => {
        if (!disposed) setError(e.message);
      });
    return () => {
      disposed = true;
      events?.close();
      observer.disconnect();
      input.dispose();
      terminal.dispose();
    };
  }, [workId, generation]);
  useEffect(() => {
    if (visible) fitRef.current();
  }, [visible]);
  return (
    <section
      aria-label="Work terminal"
      className={'min-h-0 flex-1 flex-col bg-surface ' + (visible ? 'flex' : 'hidden')}
    >
      {error && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 border-b border-line px-4 py-2 text-xs text-muted"
        >
          {error}
          <button
            className="text-ink underline"
            onClick={() => setGeneration((value) => value + 1)}
          >
            Reconnect
          </button>
        </div>
      )}
      <div ref={host} className="min-h-0 flex-1 overflow-hidden p-3" />
    </section>
  );
}

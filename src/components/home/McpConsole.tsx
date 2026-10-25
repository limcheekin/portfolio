import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { useMatchMedia } from '../../lib/use-match-media';
import { MQ } from '../../lib/motion';
import type { McpServerCard, McpSpeaker } from '../../data/mcp-servers';

const ROW_GAP = 0.45;

const PROMPT_CLASS: Record<McpSpeaker, string> = {
  $: 'text-green-accent',
  ok: 'text-green-accent',
  you: 'text-slate-text',
  agent: 'text-green-accent',
};
const TEXT_CLASS: Record<McpSpeaker, string> = {
  $: 'text-lightest-slate',
  ok: 'text-slate-text',
  you: 'text-white-text',
  agent: 'text-light-slate',
};

/**
 * The "04 MCP Servers" console: ARIA tabs (automatic activation, roving tabindex), one fixed sample transcript
 * per server. Every panel is server-rendered; inactive ones are `hidden`. With motion, each tab's rows fade and
 * rise in once, the first time that tab is shown while the console's ScrollTrigger is active (never a loop, so
 * no pause control). Under reduced motion nothing is hidden: every panel shows complete.
 */
export default function McpConsole({ servers, prompts }: { servers: McpServerCard[]; prompts: Record<McpSpeaker, string> }) {
  const root = useRef<HTMLDivElement>(null);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  // Set by the motion branch: finishes the tab being left and plays the one being shown (if in view).
  const showRef = useRef<((next: number, prev: number) => void) | null>(null);

  const [copied, setCopied] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  useMatchMedia(root, (mm, el, contextSafe) => {
    mm.add(MQ.motion, () => {
      const tls = gsap.utils.toArray<HTMLElement>('[data-mcp-panel]', el).map((panel) => {
        const rows = gsap.utils.toArray<HTMLElement>('[data-mcp-row]', panel);
        gsap.set(rows, { opacity: 0, y: 6 });
        return gsap.timeline({ paused: true }).to(rows, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', stagger: ROW_GAP });
      });
      const st = ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        end: 'bottom top',
        onToggle: (self) => (self.isActive ? tls[activeRef.current]?.play() : tls.forEach((tl) => tl.pause())),
      });
      if (st.isActive) tls[activeRef.current]?.play();
      showRef.current = contextSafe((next: number, prev: number) => {
        const left = tls[prev];
        if (left && left.progress() > 0) left.progress(1);
        if (st.isActive) tls[next]?.play();
      });
      return () => {
        showRef.current = null;
      };
    });
  });

  const select = (i: number) => {
    const prev = activeRef.current;
    tabs.current[i]?.focus();
    if (i === prev) return;
    activeRef.current = i;
    setActive(i);
    showRef.current?.(i, prev);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const n = servers.length;
    const i = activeRef.current;
    let next: number;
    if (e.key === 'ArrowRight') next = (i + 1) % n;
    else if (e.key === 'ArrowLeft') next = (i - 1 + n) % n;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    else return;
    e.preventDefault();
    select(next);
  };

  const announce = (message: string, id: string | null) => {
    setStatus(message);
    setCopied(id);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setStatus('');
      setCopied(null);
    }, 2000);
  };

  const copy = async (server: McpServerCard) => {
    try {
      await navigator.clipboard.writeText(server.connect);
      announce('Copied', server.id);
      return;
    } catch {
      // No Clipboard API (insecure context, permission refused): select the command instead.
    }
    const command = document.getElementById(`mcp-cmd-${server.id}`);
    const selection = window.getSelection();
    if (!command || !selection) return;
    selection.selectAllChildren(command);
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    if (ok) announce('Copied', server.id);
    else announce('Command selected. Press Ctrl+C to copy it.', null);
  };

  return (
    <div ref={root} data-mcp-console className="w-full min-w-0 rounded-xl border border-edge bg-well font-mono text-[12px] shadow-console sm:text-[13px]">
      <div className="flex items-center border-b border-light-graphite pl-3.5 pr-2">
        <span aria-hidden="true" className="mr-3 hidden gap-1.5 sm:flex">
          <i className="inline-block h-2.5 w-2.5 rounded-full bg-edge" />
          <i className="inline-block h-2.5 w-2.5 rounded-full bg-edge" />
          <i className="inline-block h-2.5 w-2.5 rounded-full bg-edge" />
        </span>
        <div role="tablist" aria-label="MCP servers" className="flex" onKeyDown={onKeyDown}>
          {servers.map((s, i) => {
            const selected = i === active;
            return (
              <button
                key={s.id}
                ref={(b) => {
                  tabs.current[i] = b;
                }}
                type="button"
                role="tab"
                id={`mcp-tab-${s.id}`}
                aria-selected={selected}
                aria-controls={`mcp-panel-${s.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => select(i)}
                className={`-mb-px min-h-11 border-b-2 px-3 text-xs transition-colors duration-250 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-accent/70 ${
                  selected ? 'border-green-accent text-green-accent' : 'border-transparent text-slate-text hover:text-light-slate'
                }`}
              >
                {s.name}
              </button>
            );
          })}
        </div>
      </div>

      {servers.map((s, i) => (
        <div key={s.id} role="tabpanel" id={`mcp-panel-${s.id}`} aria-labelledby={`mcp-tab-${s.id}`} hidden={i !== active} data-mcp-panel>
          <div className="px-3.5 pb-4 pt-3.5 leading-[1.7] sm:px-[18px]">
            {s.transcript.map((row, r) => (
              <div key={r} data-mcp-row className="grid grid-cols-[56px_minmax(0,1fr)] gap-2 sm:grid-cols-[64px_minmax(0,1fr)] sm:gap-2.5">
                <span className={PROMPT_CLASS[row.who]}>{prompts[row.who]}</span>
                <span
                  id={row.who === '$' ? `mcp-cmd-${s.id}` : undefined}
                  className={`[overflow-wrap:anywhere] ${TEXT_CLASS[row.who]}`}
                >
                  {row.text}
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-5 border-t border-light-graphite px-3.5 text-xs sm:px-[18px]">
            <button
              type="button"
              onClick={() => copy(s)}
              // A stable name: the visible label swaps to "Copied" (announced by the live region below).
              aria-label="Copy command"
              className="inline-grid min-h-11 items-center rounded text-green-accent transition-colors duration-250 hover:text-white-text focus:outline-none focus-visible:ring-2 focus-visible:ring-green-accent/70"
            >
              <span className={`[grid-area:1/1] ${copied === s.id ? 'invisible' : ''}`}>Copy command</span>
              <span aria-hidden="true" className={`[grid-area:1/1] ${copied === s.id ? '' : 'invisible'}`}>
                Copied ✓
              </span>
            </button>
            <span className="inline-flex min-h-11 items-center gap-2 text-slate-text">
              manifest
              <a href={s.manifest} className="text-light-slate underline decoration-edge-strong underline-offset-4 transition-colors duration-250 hover:text-green-accent">
                {s.manifest}
              </a>
            </span>
          </div>
        </div>
      ))}

      <p aria-live="polite" className="sr-only">
        {status}
      </p>
    </div>
  );
}

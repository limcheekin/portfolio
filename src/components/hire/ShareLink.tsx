import { useEffect, useId, useRef, useState } from 'react';
import { LONG_LINK } from '../../lib/hire/link';
import { BTN_SECONDARY, FIELD, HINT, LABEL } from './styles';

/**
 * The report link: answers compressed into the `#a=` fragment (encoded by HireTool), which browsers never send to a
 * server. The copy button uses the Clipboard API and falls back to selecting the text so the user can copy it by hand.
 */
export default function ShareLink({ url }: { url: string }) {
  const id = useId();
  const [said, setSaid] = useState('');
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!said) return;
    const t = window.setTimeout(() => setSaid(''), 4000);
    return () => window.clearTimeout(t);
  }, [said]);

  const select = () => {
    field.current?.focus();
    field.current?.select();
  };

  const copy = async () => {
    if (!url) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('no clipboard');
      await navigator.clipboard.writeText(url);
      setSaid('Copied');
    } catch {
      select();
      setSaid('Copying is blocked here: the link is selected, so press Ctrl+C (or Cmd+C) to copy it.');
    }
  };

  const long = url.length > LONG_LINK;
  return (
    <div className="min-w-0" data-testid="hire-share">
      <label htmlFor={`${id}-url`} className={LABEL}>Report link</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          ref={field}
          id={`${id}-url`}
          type="text"
          readOnly
          className={`${FIELD} font-mono text-xs`}
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          aria-describedby={`${id}-who${long ? ` ${id}-long` : ''}`}
          data-testid="hire-share-url"
        />
        <button type="button" className={`${BTN_SECONDARY} shrink-0`} onClick={copy} disabled={!url} data-testid="hire-share-copy">
          Copy link
        </button>
      </div>
      <p id={`${id}-who`} className={`mt-2 ${HINT}`}>
        Anyone with this link can read your answers. They live in the part after <span className="font-mono">#</span>, which your browser never sends to a server.
      </p>
      {long && (
        <p id={`${id}-long`} className="mt-2 text-sm leading-relaxed text-lightest-slate" data-testid="hire-share-long">
          This link is {url.length.toLocaleString('en-US')} characters long. Some chat and email apps cut long links short: if it
          arrives broken, shorten the longer free text (rationale, job description, the R table).
        </p>
      )}
      <p role="status" aria-live="polite" className="mt-1 min-h-5 font-mono text-xs text-green-accent" data-testid="hire-share-status">{said}</p>
    </div>
  );
}

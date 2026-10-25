import { useId, useState, type ReactNode } from 'react';
import { ERROR, FIELD, LABEL } from './styles';

const nonNegative = (n: number) => (n >= 0 ? null : 'Enter a number of 0 or more.');

/** The number in `s` and why it can't be stored, if it can't. Blank is no value and no error. */
function read(s: string, check: (n: number) => string | null): { n: number | undefined; error: string | null } {
  if (s.trim() === '') return { n: undefined, error: null };
  const n = Number(s);
  if (!Number.isFinite(n)) return { n: undefined, error: check(-Infinity) ?? 'Enter a number.' };
  const error = check(n);
  return { n: error ? undefined : n, error };
}

/**
 * A number field that keeps what the user types (so "1." or "-" can be on the way to a number) and stores only a
 * finite value that passes `check`; anything else is left out of the answers and the field says why.
 */
export default function NumberField({
  label, value, onChange, suffix, check = nonNegative, hint, testId, className = '',
}: {
  label: ReactNode;
  value: number | null | undefined;
  onChange: (v: number | undefined) => void;
  suffix?: string;
  /** An error message for a number the field must not store, or null when it is fine. */
  check?: (n: number) => string | null;
  /** A line under the field (shown when there is no error). */
  hint?: ReactNode;
  testId?: string;
  className?: string;
}) {
  const id = useId();
  const v = value ?? undefined;
  const [text, setText] = useState(v === undefined ? '' : String(v));
  const [prev, setPrev] = useState(v);
  if (v !== prev) {
    // Changed from outside (a loaded link or the example): show it, unless the text already says the same.
    setPrev(v);
    if (read(text, check).n !== v) setText(v === undefined ? '' : String(v));
  }
  const { error } = read(text, check);
  const described = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={id} className={LABEL}>{label}</label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          className={FIELD}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            const { n } = read(e.target.value, check);
            setPrev(n);
            onChange(n);
          }}
          aria-invalid={error !== null}
          aria-describedby={described}
          autoComplete="off"
          data-testid={testId}
        />
        {suffix && <span className="shrink-0 font-mono text-xs text-slate-text">{suffix}</span>}
      </div>
      {error ? (
        <p id={`${id}-err`} className={ERROR}>{error}</p>
      ) : (
        hint && <div id={`${id}-hint`} className="mt-1.5 text-xs leading-relaxed text-slate-text">{hint}</div>
      )}
    </div>
  );
}

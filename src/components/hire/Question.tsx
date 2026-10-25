import { createContext, useContext, useId, type ReactNode } from 'react';
import type { ChecklistItem } from '../../lib/hire/checklist';
import { isNA } from '../../lib/hire/score';
import { TEXT_CAPS } from '../../lib/hire/validate';
import type { NA } from '../../lib/hire/types';
import Reading from './Reading';
import { ERROR, FIELD, HINT, LABEL, OPTION, OPTION_INPUT, points } from './styles';

export interface Choice<V> {
  value: V;
  label: ReactNode;
  /** Score or other short tag shown before the label (mono). */
  tag?: string;
  /** Extra line under the label, e.g. the checklist's example. */
  sub?: ReactNode;
}

/** True in Focus mode: options show the number key that picks them. */
export const KeyHints = createContext(false);

/** The number key for the nth option (1-based), shown only in Focus mode and only for the first nine. */
export function KeyHint({ n }: { n: number }) {
  if (!useContext(KeyHints) || n > 9) return null;
  return (
    <kbd aria-hidden="true" className="mt-px grid size-5 shrink-0 place-items-center rounded border border-edge font-mono text-[11px] text-slate-text">
      {n}
    </kbd>
  );
}


/**
 * One go/no-go or scored question as native radios in a fieldset. `legend` is the question as the checklist
 * words it; `hint` is its "Consider" line. Value equality is by `===`, so pass primitives.
 */
export function ChoiceGroup<V extends string | number | boolean>({
  legend, hint, extra, choices, value, onChange, columns = false, testId,
}: {
  legend: ReactNode;
  hint?: ReactNode;
  extra?: ReactNode;
  choices: Choice<V>[];
  value: V | null | undefined;
  onChange: (v: V) => void;
  /** Lay short options out in a row from `sm` up. */
  columns?: boolean;
  testId?: string;
}) {
  const id = useId();
  return (
    <fieldset className="min-w-0" aria-describedby={hint ? `${id}-hint` : undefined} data-testid={testId}>
      <legend className="mb-2 text-base leading-relaxed text-lightest-slate">{legend}</legend>
      {hint && <p id={`${id}-hint`} className={`mb-3 ${HINT}`}>{hint}</p>}
      <div className={columns ? 'grid gap-2 sm:grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))]' : 'grid gap-2'}>
        {choices.map((c, n) => (
          <label key={String(c.value)} className={OPTION}>
            <input
              type="radio"
              className={OPTION_INPUT}
              name={id}
              value={String(c.value)}
              checked={value === c.value}
              onChange={() => onChange(c.value)}
              data-choice={n}
            />
            <KeyHint n={n + 1} />
            <span className="min-w-0">
              {c.tag !== undefined && <span className="mr-2 font-mono text-xs text-slate-text">{c.tag}</span>}
              {c.label}
              {c.sub && <span className="mt-0.5 block text-xs text-slate-text">{c.sub}</span>}
            </span>
          </label>
        ))}
      </div>
      {extra}
    </fieldset>
  );
}

/** "**Label**: question" exactly as the checklist prints it. */
export const ItemLegend = ({ item }: { item: ChecklistItem }) => (
  <>
    <strong className="font-semibold">{item.label}</strong>: {item.question}
  </>
);

type ItemValue = number | NA | null | undefined;

/**
 * One checklist item: its verbatim question and "Consider" hint, the scored options, and for E guardrails and
 * boundaries a "Not applicable" option that needs a reason (this tool's reading).
 */
export default function Question({
  item, value, onChange, allowNA = false, signed = false,
}: {
  item: ChecklistItem;
  value: ItemValue;
  onChange: (v: number | NA) => void;
  allowNA?: boolean;
  /** Show scores with their sign (E items). */
  signed?: boolean;
}) {
  const id = useId();
  const na = isNA(value);
  const reasonBlank = na && value.na.trim() === '';
  const choices: Choice<number | 'na'>[] = item.options.map((o) => ({
    value: Number(o.value),
    label: o.label,
    tag: signed ? points(Number(o.value)) : String(o.value),
  }));
  if (allowNA) {
    const best = Math.max(...item.options.map((o) => Number(o.value)));
    choices.push({ value: 'na', label: 'Not applicable', tag: points(best), sub: 'scores its best value; give a reason' });
  }
  return (
    <ChoiceGroup<number | 'na'>
      testId={`q-${item.key}`}
      legend={<ItemLegend item={item} />}
      hint={item.consider ? <>Consider: {item.consider}</> : undefined}
      choices={choices}
      columns={item.options.length <= 3 && !allowNA}
      value={na ? 'na' : typeof value === 'number' ? value : null}
      onChange={(v) => onChange(v === 'na' ? { na: na ? value.na : '' } : v)}
      extra={
        na ? (
          <div className="mt-3">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <label htmlFor={`${id}-reason`} className={`${LABEL} mb-0`}>Why it does not apply (required)</label>
              <Reading k="notApplicable" />
            </div>
            <input
              id={`${id}-reason`}
              type="text"
              className={FIELD}
              maxLength={TEXT_CAPS.naReason}
              value={value.na}
              onChange={(e) => onChange({ na: e.target.value })}
              aria-invalid={reasonBlank}
              aria-describedby={reasonBlank ? `${id}-reason-error` : undefined}
              placeholder="e.g. single-tenant internal tool"
              data-testid={`q-${item.key}-reason`}
            />
            {reasonBlank && (
              <p id={`${id}-reason-error`} className={ERROR}>
                Not applicable needs a reason. Until it has one, this item counts as unanswered.
              </p>
            )}
          </div>
        ) : undefined
      }
    />
  );
}

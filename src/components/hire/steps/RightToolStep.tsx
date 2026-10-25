import { useId } from 'react';
import { R_QUESTIONS, R_TRAITS, RED_FLAGS } from '../../../lib/hire/checklist';
import { traitCount, traitsNote } from '../../../lib/hire/score';
import { TEXT_CAPS } from '../../../lib/hire/validate';
import { ChoiceGroup } from '../Question';
import Reading from '../Reading';
import { FIELD, HINT, LABEL } from '../styles';
import { Group, set, type StepProps } from './common';

// The comparison table, with the row and column wording of the framework's case-study template.
const TABLE = [
  { key: 'rule', name: 'Rule', does: 'Explain what automation would do instead of an AI Agent', why: "Why automation doesn't solve this problem" },
  { key: 'chatbot', name: 'Chatbot', does: 'Explain what a chatbot would do instead of an AI Agent', why: "Why a chatbot doesn't solve this problem" },
  { key: 'agent', name: 'Reasoning Agent', does: 'Example of a reasoning-based approach', why: "Why this is the right level / or why it's overkill" },
] as const;

/** Part 1, R · The right tool: the two classification gates, the five traits and the comparison table. */
export default function RightToolStep({ answers, dispatch }: StepProps) {
  const id = useId();
  const r = answers.r;
  const note = traitsNote(answers);
  const count = traitCount(answers);
  const ruleBlank = !r.table?.rule?.does?.trim() && !r.table?.rule?.why?.trim();

  return (
    <div className="space-y-12">
      <Group title="Task classification">
        <ChoiceGroup
          testId="q-ruleBased"
          legend={<strong className="font-semibold">{R_QUESTIONS.ruleBased.question}</strong>}
          choices={[{ value: true, label: R_QUESTIONS.ruleBased.yes }, { value: false, label: R_QUESTIONS.ruleBased.no }]}
          value={r.ruleBased}
          onChange={set(dispatch, 'r.ruleBased')}
        />
        <ChoiceGroup
          testId="q-informational"
          legend={<strong className="font-semibold">{R_QUESTIONS.informational.question}</strong>}
          choices={[{ value: true, label: R_QUESTIONS.informational.yes }, { value: false, label: R_QUESTIONS.informational.no }]}
          value={r.informational}
          onChange={set(dispatch, 'r.informational')}
        />

        <fieldset className="min-w-0" data-testid="q-traits">
          <legend className="mb-3 text-base text-lightest-slate"><strong className="font-semibold">{R_QUESTIONS.traits}</strong></legend>
          <div className="grid gap-2">
            {R_TRAITS.map((t) => (
              <label
                key={t.key}
                className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-edge bg-well px-3 py-2.5 text-sm text-light-slate transition-colors duration-250 hover:border-edge-strong has-[:checked]:border-green-accent has-[:checked]:bg-green-tint has-[:checked]:text-lightest-slate"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 shrink-0 accent-green-accent"
                  checked={r.traits[t.key as keyof typeof r.traits]}
                  onChange={(e) => dispatch({ type: 'set', path: `r.traits.${t.key}`, value: e.target.checked })}
                />
                <span>{t.label}</span>
              </label>
            ))}
          </div>
          <p className={`mt-3 ${HINT}`}>
            {R_QUESTIONS.verdict} <span className="font-mono text-xs text-light-slate">({count} of 5 checked)</span>
          </p>
          {note && (
            <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-light-slate" data-testid="hire-traits-note">
              Note: {note}. Scoring goes on. <Reading k="traits" />
            </p>
          )}
        </fieldset>
      </Group>

      <Group
        title="Rule, chatbot or agent"
        intro={
          <span className="flex flex-wrap items-center gap-2">
            Say what each approach would do and why it is not enough (or why it works). A blank Rule row raises the red flag
            “{RED_FLAGS.r3}”. <Reading k="redFlags" />
          </span>
        }
      >
        {TABLE.map((row) => (
          <fieldset key={row.key} className="min-w-0" data-testid={`r-table-${row.key}`}>
            <legend className="mb-2 font-semibold text-lightest-slate">
              {row.name}
              {row.key === 'rule' && ruleBlank && <span className="ml-2 font-mono text-xs font-normal text-danger">blank: raises a red flag</span>}
            </legend>
            <div className="grid gap-3 md:grid-cols-2">
              {(['does', 'why'] as const).map((col) => (
                <div key={col} className="min-w-0">
                  <label htmlFor={`${id}-${row.key}-${col}`} className={LABEL}>
                    {col === 'does' ? 'What It Would Do' : row.key === 'agent' ? "Why It's Not Enough (or Why It Works)" : "Why It's Not Enough"}
                  </label>
                  <textarea
                    id={`${id}-${row.key}-${col}`}
                    rows={3}
                    className={`${FIELD} resize-y`}
                    maxLength={TEXT_CAPS.tableCell}
                    placeholder={row[col]}
                    value={r.table?.[row.key]?.[col] ?? ''}
                    onChange={(e) => dispatch({ type: 'set', path: `r.table.${row.key}.${col}`, value: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </fieldset>
        ))}
      </Group>
    </div>
  );
}

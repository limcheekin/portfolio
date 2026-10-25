import { WORST_CASE_OPTIONS } from '../../../lib/hire/checklist';
import type { WorstCase } from '../../../lib/hire/types';
import { ChoiceGroup } from '../Question';
import { points } from '../styles';
import { set, type StepProps } from './common';

/** E · Worst case (Risk Assessment). Part 1 asks it; Part 2's E step shows it again, prefilled. */
export default function WorstCaseStep({ answers, dispatch }: StepProps) {
  return (
    <ChoiceGroup<WorstCase>
      testId="q-worstCase"
      legend={<strong className="font-semibold">If this agent makes the worst possible mistake, what happens?</strong>}
      hint={
        <>
          If you selected “Catastrophic impact,” DO NOT BUILD THIS AGENT. For the other cases, implement strict guardrails.
        </>
      }
      choices={WORST_CASE_OPTIONS.map((o) => ({
        value: o.value as WorstCase,
        label: o.label,
        sub: `e.g., ${o.example}`,
        tag: o.points === null ? 'STOP' : points(o.points),
      }))}
      value={answers.e.worstCase}
      onChange={set(dispatch, 'e.worstCase')}
    />
  );
}

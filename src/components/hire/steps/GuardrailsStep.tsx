import { E_BOUNDARIES, E_GUARDRAILS, type ChecklistItem } from '../../../lib/hire/checklist';
import type { NA } from '../../../lib/hire/types';
import Question from '../Question';
import Reading from '../Reading';
import { Group, set, type StepProps } from './common';
import WorstCaseStep from './WorstCaseStep';

const NA_NOTE = (
  <span className="flex flex-wrap items-center gap-2">
    Each item offers Not applicable: it scores the item's best value and needs a one-line reason.
    <Reading k="notApplicable" />
  </span>
);

/** Part 2, E · Exposure & Execution: the worst case (prefilled from Part 1), guardrails and execution boundaries. */
export default function GuardrailsStep(props: StepProps) {
  const { answers, dispatch } = props;
  const q = (item: ChecklistItem) => (
    <Question
      key={item.key}
      item={item}
      value={answers.e[item.key as keyof typeof answers.e] as number | NA | null}
      onChange={set(dispatch, `e.${item.key}`) as (v: number | NA) => void}
      allowNA
      signed
    />
  );
  return (
    <div className="space-y-12">
      <Group title="Risk assessment" intro="From Part 1; change it here if you need to.">
        <WorstCaseStep {...props} />
      </Group>
      <Group
        title="Guardrails & Safety"
        intro={<>Note: if some of the guardrails don't apply to your use case, adjust the score accordingly. {NA_NOTE}</>}
      >
        {E_GUARDRAILS.map(q)}
      </Group>
      <Group
        title="Execution Boundaries"
        intro={<>Note: if some of the execution boundaries don't apply to your use case, adjust the score accordingly. {NA_NOTE}</>}
      >
        {E_BOUNDARIES.map(q)}
      </Group>
    </div>
  );
}

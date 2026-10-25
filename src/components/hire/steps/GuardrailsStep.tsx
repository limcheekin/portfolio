import { E_BOUNDARIES, E_GUARDRAILS } from '../../../lib/hire/checklist';
import Reading from '../Reading';
import { Group, ItemQuestion, type StepProps } from './common';
import WorstCaseStep from './WorstCaseStep';

const NA_NOTE = (
  <span className="flex flex-wrap items-center gap-2">
    Each item offers Not applicable: it scores the item's best value and needs a one-line reason.
    <Reading k="notApplicable" />
  </span>
);

/** E's two groups with the checklist's note on each (Focus mode shows the group and note over each item). */
export const E_GROUPS = [
  {
    title: 'Guardrails & Safety',
    items: E_GUARDRAILS,
    intro: <>Note: if some of the guardrails don't apply to your use case, adjust the score accordingly. {NA_NOTE}</>,
  },
  {
    title: 'Execution Boundaries',
    items: E_BOUNDARIES,
    intro: <>Note: if some of the execution boundaries don't apply to your use case, adjust the score accordingly. {NA_NOTE}</>,
  },
];

/** Part 2, E · Exposure & Execution: the worst case (prefilled from Part 1), guardrails and execution boundaries. */
export default function GuardrailsStep(props: StepProps) {
  const { answers, dispatch } = props;
  return (
    <div className="space-y-12">
      <Group title="Risk assessment" intro="From Part 1; change it here if you need to.">
        <WorstCaseStep {...props} />
      </Group>
      {E_GROUPS.map((g) => (
        <Group key={g.title} title={g.title} intro={g.intro}>
          {g.items.map((item) => <ItemQuestion key={item.key} section="e" item={item} answers={answers} dispatch={dispatch} />)}
        </Group>
      ))}
    </div>
  );
}

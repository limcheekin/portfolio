import { H_ITEMS } from '../../../lib/hire/checklist';
import { Group, ItemQuestion, type StepProps } from './common';

/** H's two groups, as the checklist heads them (Focus mode shows the group over each item). */
export const H_GROUPS = [
  { title: 'Cultural Readiness', items: H_ITEMS.slice(0, 4) },
  { title: 'Infrastructure Readiness', items: H_ITEMS.slice(4) },
];

/** Part 2, H · Human & Habits: seven items scored 1 to 3. */
export default function ReadinessStep({ answers, dispatch }: StepProps) {
  return (
    <div className="space-y-12">
      {H_GROUPS.map((g) => (
        <Group key={g.title} title={g.title}>
          {g.items.map((item) => <ItemQuestion key={item.key} section="h" item={item} answers={answers} dispatch={dispatch} />)}
        </Group>
      ))}
    </div>
  );
}

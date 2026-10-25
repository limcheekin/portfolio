import { H_ITEMS } from '../../../lib/hire/checklist';
import type { NA } from '../../../lib/hire/types';
import Question from '../Question';
import { Group, set, type StepProps } from './common';

const GROUPS = [
  { title: 'Cultural Readiness', items: H_ITEMS.slice(0, 4) },
  { title: 'Infrastructure Readiness', items: H_ITEMS.slice(4) },
];

/** Part 2, H · Human & Habits: seven items scored 1 to 3. */
export default function ReadinessStep({ answers, dispatch }: StepProps) {
  return (
    <div className="space-y-12">
      {GROUPS.map((g) => (
        <Group key={g.title} title={g.title}>
          {g.items.map((item) => (
            <Question
              key={item.key}
              item={item}
              value={answers.h[item.key as keyof typeof answers.h]}
              onChange={set(dispatch, `h.${item.key}`) as (v: number | NA) => void}
            />
          ))}
        </Group>
      ))}
    </div>
  );
}

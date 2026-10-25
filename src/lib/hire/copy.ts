import {
  ALTERNATIVES, CHECKLIST_SOURCE, E_BOUNDARIES, E_GUARDRAILS, H_ITEMS, I_ITEMS, RED_FLAGS, R_QUESTIONS, R_TRAITS,
  SIGN_OFF_ROLES, THRESHOLDS, WORST_CASE_OPTIONS, type ChecklistItem,
} from './checklist.ts';

/** Page copy shared by /hire/ (Astro) and /hire/index.md (generate-api). */
export const HIRE_TITLE = 'Should you build that AI agent?';
export const HIRE_DESCRIPTION =
  'Answer the H.I.R.E. checklist and get a verdict (HIRE, TRAIN or DO NOT BUILD) with reasons and a PDF report, computed in your browser.';
export const HIRE_INTRO = [
  'Having the courage not to build an agent is what makes great product strategy. The HIRE check walks through the H.I.R.E. checklist and returns a verdict plus the reasons behind it, with a PDF report you can hand to a CEO or CTO.',
  'The same scoring module runs in the browser and behind the HIRE MCP server, so the same answers always give the same verdict. There is no LLM in the loop.',
];
export const HIRE_PRIVACY_STATEMENT =
  'Private by construction: the web tool never sends your answers anywhere. The MCP path necessarily receives answers in the request (the agent posts them); the server computes in memory, never stores or logs request bodies (including in error logs), and free text is optional there.';
/** The credit paragraph as parts, so the page (with links) and the Markdown copy come from one source. */
export const HIRE_LICENCE_URL = `${CHECKLIST_SOURCE.repo}/blob/${CHECKLIST_SOURCE.commit}/LICENSE`;
export const HIRE_CREDIT_PARTS = {
  lead: 'Built on the H.I.R.E. framework by Inês Bolaños, ',
  licence: `${CHECKLIST_SOURCE.licence} licensed`,
  licenceUrl: HIRE_LICENCE_URL,
  mid: ` (${CHECKLIST_SOURCE.copyright}). Checklist wording is from ${CHECKLIST_SOURCE.file} at commit ${CHECKLIST_SOURCE.commit} of `,
  repo: 'the framework repository',
  repoUrl: CHECKLIST_SOURCE.repo,
  end: '.',
} as const;
export const HIRE_CREDIT_MARKDOWN = (() => {
  const c = HIRE_CREDIT_PARTS;
  return `${c.lead}[${c.licence}](${c.licenceUrl})${c.mid}[${c.repo}](${c.repoUrl})${c.end} Repository: ${c.repoUrl}`;
})();
export const HIRE_NOSCRIPT = 'The interactive check needs JavaScript. The checklist text below is complete, so you can work through it by hand.';

export interface TextEntry { title: string; lines: string[] }
export interface TextSection { id: string; heading: string; entries: TextEntry[] }

const item = (i: ChecklistItem): TextEntry => ({
  title: i.label,
  lines: [
    i.question.charAt(0).toUpperCase() + i.question.slice(1),
    ...(i.consider ? [`Consider: ${i.consider}`] : []),
    `Options: ${i.options.map((o) => `${o.label} (${o.value > 0 && typeof o.value === 'number' ? '+' : ''}${o.value})`).join(' / ')}`,
  ],
});

const flags = (prefix: string) => Object.entries(RED_FLAGS).filter(([k]) => k.startsWith(prefix)).map(([, v]) => v);

/** The whole checklist as headed text entries, in the framework's order. */
export const CHECKLIST_SECTIONS: TextSection[] = [
  { id: 'h', heading: 'H: Human and Habits', entries: [...H_ITEMS.map(item), { title: 'Red flags', lines: flags('h') }] },
  { id: 'i', heading: 'I: Impact and Intent', entries: [...I_ITEMS.map(item), { title: 'Red flags', lines: flags('i') }] },
  {
    id: 'r', heading: 'R: The right tool',
    entries: [
      { title: R_QUESTIONS.ruleBased.question, lines: [R_QUESTIONS.ruleBased.yes, R_QUESTIONS.ruleBased.no] },
      { title: R_QUESTIONS.informational.question, lines: [R_QUESTIONS.informational.yes, R_QUESTIONS.informational.no] },
      { title: R_QUESTIONS.traits, lines: [...R_TRAITS.map((t) => t.label), R_QUESTIONS.verdict] },
      { title: 'Red flags', lines: flags('r') },
    ],
  },
  {
    id: 'e', heading: 'E: Exposure and Execution',
    entries: [
      {
        title: 'Worst case',
        lines: WORST_CASE_OPTIONS.map((o) => `${o.label} (${o.example}): ${o.points === null ? 'STOP, do not build' : o.points}`),
      },
      ...E_GUARDRAILS.map(item),
      ...E_BOUNDARIES.map(item),
      { title: 'Red flags', lines: flags('e') },
    ],
  },
  {
    id: 'thresholds', heading: 'Thresholds',
    entries: [{
      title: `Scores out of ${THRESHOLDS.ceiling}`,
      lines: [
        `${THRESHOLDS.doNotBuildMax} or below: DO NOT BUILD`,
        `${THRESHOLDS.doNotBuildMax + 1} to ${THRESHOLDS.trainMax}: TRAIN`,
        `Above ${THRESHOLDS.trainMax}: HIRE`,
      ],
    }],
  },
  { id: 'alternatives', heading: 'Alternatives to an agent', entries: ALTERNATIVES.map((a) => ({ title: a.name, lines: [a.description] })) },
  {
    id: 'documentation', heading: 'Documentation and sign-off',
    entries: [
      { title: 'Decision', lines: ['HIRE / TRAIN / DO NOT BUILD (FIRE for a live agent)'] },
      { title: 'Sign-off', lines: SIGN_OFF_ROLES.map((r) => r.label) },
    ],
  },
];

/** The same sections as Markdown, for /hire/index.md. */
export const checklistMarkdown = (): string[] =>
  CHECKLIST_SECTIONS.flatMap((s) => [
    `### ${s.heading}`,
    '',
    ...s.entries.flatMap((e) => [`#### ${e.title}`, '', ...e.lines.map((l) => `- ${l}`), '']),
  ]);

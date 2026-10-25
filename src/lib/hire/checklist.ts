import type { MetricKey, SignOffRole, TraitKey } from './types.ts';

// Vendored from Ines Bolanos's H.I.R.E. checklist (MIT). Wording is verbatim, including its spelling.
export const CHECKLIST_SOURCE = {
  repo: 'https://github.com/inesbolanos/HIRE-AI-framework',
  commit: '319b20e6fb7dc0452ae25677e7cefd9309151d1d',
  file: 'framework/hire-checklist.md',
  licence: 'MIT',
  copyright: 'Copyright (c) 2026 Inês Bolaños',
} as const;

export const MIT_LICENCE_TEXT = "MIT License\n\nCopyright (c) 2026 Inês Bolaños\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the \"Software\"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.\n";

export interface ChecklistOption { value: number | string; label: string }
export interface ChecklistItem {
  key: string;
  label: string;
  question: string;
  consider?: string;
  options: ChecklistOption[];
}

const three = (a: string, b: string, c: string): ChecklistOption[] => [
  { value: 1, label: a },
  { value: 2, label: b },
  { value: 3, label: c },
];

export const H_ITEMS: ChecklistItem[] = [
  {
    key: 'trust', label: 'Trust assessment',
    question: 'will users trust AI recommendations in this process?',
    consider: 'is this a high-stakes decision? Are users skeptical of automation?',
    options: three('low trust', 'medium trust', 'high trust'),
  },
  {
    key: 'culturalFit', label: 'Cultural fit',
    question: 'What is the users knowledge and acceptance of AI tools?',
    consider: 'technical experience, self-serve problems',
    options: three('low fit', 'medium fit', 'high fit'),
  },
  {
    key: 'userControl', label: 'User control',
    question: "Can users edit, correct, or override the agent's decisions?",
    consider: 'editable memory, undo functionality, manual override options',
    options: three('low control', 'medium control', 'high control'),
  },
  {
    key: 'changeManagement', label: 'Change management plan',
    question: 'do we have a plan to onboard users to this new workflow?',
    consider: 'training materials, gradual rollout, feedback loops',
    options: three('low', 'medium', 'high'),
  },
  {
    key: 'dataQuality', label: 'Data quality',
    question: 'is our historical data clean enough to train/inform the agent?',
    consider: 'Garbage in = garbage out. Poor data = poor agent performance',
    options: three('low quality', 'medium quality', 'high quality'),
  },
  {
    key: 'systemIntegration', label: 'System integration',
    question: 'can the agent access the tools and data it needs?',
    consider: 'API access, authentication, data pipelines',
    options: three('low integration', 'medium integration', 'high integration'),
  },
  {
    key: 'interaction', label: 'Interaction with user',
    question: 'Will the agent be proactive or reactive?',
    consider: 'agents should act like teammates, not search bars',
    options: three('reactive', 'mixed', 'proactive'),
  },
];

export const I_ITEMS: ChecklistItem[] = [
  {
    key: 'frequency', label: 'Problem Frequency',
    question: 'how often does this problem occur?',
    options: [
      { value: 1, label: 'annually' },
      { value: 2, label: 'quarterly' },
      { value: 3, label: 'monthly' },
      { value: 4, label: 'weekly' },
      { value: 5, label: 'daily' },
    ],
  },
  {
    key: 'timeSavings', label: 'Time Savings',
    question: 'how much time will the agent save for this process?',
    options: [
      { value: 1, label: '0-10% time saved' },
      { value: 2, label: '11-20% time saved' },
      { value: 3, label: '21-50% time saved' },
      { value: 4, label: 'more than 50% time saved' },
    ],
  },
  {
    key: 'roi', label: 'ROI',
    question: 'does the benefit of the agent justify the investment?',
    options: [
      { value: -5, label: 'negative ROI' },
      { value: 0, label: 'neutral' },
      { value: 5, label: 'positive ROI' },
    ],
  },
  {
    key: 'strategicValue', label: 'Strategical value',
    question: 'besides financial impact, is there any strategical value from this agent?',
    consider: 'positioning, competitor advantage, high-impact customer need',
    options: three('low', 'medium', 'high'),
  },
];

export const E_GUARDRAILS: ChecklistItem[] = [
  {
    key: 'hitl', label: 'Human-in-the-Loop',
    question: 'does a human approve critical actions before execution?',
    consider: 'approval workflows, confirmation dialogs, audit trails',
    options: [{ value: -5, label: 'none' }, { value: 0, label: 'partial' }, { value: 5, label: 'ensured' }],
  },
  {
    key: 'security', label: 'Deterministic Security',
    question: 'are security checks handled by rules, not AI?',
    consider: 'Role-based access control (RBAC), command blacklists, permission checks',
    options: [{ value: -5, label: 'AI' }, { value: 5, label: 'rules' }],
  },
  {
    key: 'rollback', label: 'Rollback Capability',
    question: "can we undo the agent's actions if something goes wrong?",
    consider: 'version control, backup systems, manual override',
    options: [{ value: -5, label: 'no' }, { value: 5, label: 'yes' }],
  },
  {
    key: 'audit', label: 'Audit Trail',
    question: 'do we log every action the agent takes or suggests?',
    consider: 'compliance, debugging, accountability',
    options: [{ value: -5, label: 'no' }, { value: 5, label: 'yes' }],
  },
  {
    key: 'tenant', label: 'Tenant Isolation',
    question: 'data is not used for cross customer learning',
    consider: 'isolated action',
    options: [{ value: -5, label: 'no' }, { value: 5, label: 'yes' }],
  },
];

export const E_BOUNDARIES: ChecklistItem[] = [
  {
    key: 'access', label: 'Read-Only vs. Write Access',
    question: 'does the agent only suggest, or can it execute?',
    consider: 'Suggestion-only = lower risk. Execution = requires strict guardrails',
    options: [{ value: -10, label: 'write access' }, { value: 10, label: 'read-only' }],
  },
  {
    key: 'fallback', label: 'Failure Mode',
    question: 'what happens if the agent is unavailable?',
    consider: 'Can users complete the task manually? Is there a fallback system?',
    options: [{ value: -5, label: 'no fallback system' }, { value: 5, label: 'fallback system' }],
  },
];

export const WORST_CASE_OPTIONS: Array<{ value: string; label: string; example: string; points: number | null }> = [
  { value: 'minor', label: 'Minor inconvenience', example: 'wrong email sent', points: -1 },
  { value: 'moderate', label: 'Moderate impact', example: 'temporary service disruption', points: -10 },
  { value: 'severe', label: 'Severe impact', example: 'data loss, security breach', points: -20 },
  { value: 'catastrophic', label: 'Catastrophic impact', example: 'life-or-death, legal liability', points: null },
];

// E's Risk Assessment question and its STOP line, verbatim (emphasis dropped).
export const E_WORST_CASE = {
  question: 'If this agent makes the worst possible mistake, what happens?',
  stop: 'If you selected "Catastrophic impact," DO NOT BUILD THIS AGENT. For the other cases, implement strict guardrails.',
} as const;

// The notes under E's Guardrails & Safety and Execution Boundaries, verbatim.
export const E_NOTES = {
  guardrails: "Note: if some of the guardrails don't apply to your use case, adjust the score accordingly",
  boundaries: "Note: if some of the execution boundaries don't apply to your use case, adjust the score accordingly",
} as const;

// The fill-in lines under I's Time Savings and ROI items, verbatim (the blanks are the checklist's).
export const I_FIGURES: Partial<Record<string, readonly string[]>> = {
  timeSavings: [
    'Current time to resolve: _______ minutes/hours',
    'Expected time with agent: _______ minutes/hours',
    'Time saved per process: _______ minutes/hours',
  ],
  roi: [
    'Engineering cost to build: _______',
    'Ongoing maintenance cost: _______',
    'Expected annual savings: _______',
    'Break-even timeline: _______',
    'ROI: _______',
  ],
};

// R's comparison table, verbatim.
export const R_TABLE = {
  columns: ['Approach', 'What It Would Do', "Why It's Not Enough"],
  rows: [
    { approach: 'Rule', does: 'Explain what automation would do instead of an AI Agent', why: "Why automation doesn't solve this problem" },
    { approach: 'Chatbot', does: 'Explain what a chatbot would do instead of an AI Agent', why: "Why a chatbot doesn't solve this problem" },
  ],
} as const;

export type FireKey = MetricKey | 'maintenance' | 'betterSolution';

// "When we would FIRE this agent", verbatim (emphasis and the guide's link target dropped). Keys match live.ts FireHit.
export const FIRE_CRITERIA: { heading: string; intro: string; criteria: Array<{ key: FireKey; text: string }> } = {
  heading: 'When we would FIRE this agent:',
  intro:
    "Deprecation criteria. Fire the agent when a metric sits in the Critical band of the AI Agent Metrics Guide — that table holds the numbers, so they can't drift apart from this list. Tighten them for your own risk tolerance if needed. What each one means here:",
  criteria: [
    { key: 'ucr', text: "User Correction Rate (UCR) in the critical band: the user is redoing the agent's work" },
    { key: 'ppr', text: 'Ping Pong Rate (PPR) critical, with IRR falling alongside it' },
    { key: 'diy', text: 'Do It Yourself Rate (DIY) critical months after launch: users have routed around the agent' },
    { key: 'rlr', text: 'Red Line Rate (RLR) above 0%: any violation is a compliance event, so this is the one threshold not to relax' },
    { key: 'irr', text: 'Instant Resolution Rate (IRR) critical: triage is adding a step instead of removing one' },
    { key: 'maintenance', text: 'Maintenance costs exceed value delivered' },
    { key: 'betterSolution', text: 'A better solution is available' },
  ],
};

// The Documentation block and the sign-off lead-ins, verbatim (emphasis dropped; the blanks are fields).
export const DOCUMENTATION = {
  intro: "Once you've completed this checklist, document your decision:",
  fields: [
    { key: 'name', label: 'Agent Name' },
    { key: 'decision', label: 'Decision', note: 'HIRE / TRAIN / FIRE' },
    { key: 'rationale', label: 'Rationale' },
    { key: 'nextSteps', label: 'Next Steps' },
    { key: 'reviewDate', label: 'Review Date', note: '(Revisit this decision in 3-6 months)' },
  ],
  signOffHeading: 'Stakeholder Sign-Off',
  signOffIntro: 'Before proceeding, ensure alignment across teams:',
  remember: 'Remember: having the courage to FIRE an agent before building it is what makes great product strategy.',
} as const;

// Part 1 gates of I (Intent check, Job Description Exercise), verbatim.
export const I_GATES = {
  intent: {
    label: 'Need vs. Hype',
    question: 'are we building this because of a clear business need or just industry hype?',
    stop: "If you can't clearly articulate the business problem, STOP.",
  },
  role: { label: 'Role Definition', question: 'can you write a clear job description for this agent?' },
  review: {
    label: 'Performance Review',
    question: "how will you measure this agent's success? What target do you plan to achieve for each?",
  },
  jobStop: "If you can't define the job description and metrics of success, STOP",
} as const;

export const R_QUESTIONS = {
  ruleBased: {
    question: 'Is the task predictable and rule-based?',
    yes: 'YES → You need automation (if-then rules), not an AI agent',
    no: 'NO → Continue to next question',
  },
  informational: {
    question: 'Is the task purely informational (answering questions, summarizing)?',
    yes: 'YES → You need a chatbot (retrieval-based responses), not an AI agent',
    no: 'NO → Continue to next question',
  },
  traits: 'Does the task involve:',
  verdict: 'If you checked 3+ boxes above, you likely need an AI agent.',
} as const;

export const R_TRAITS: Array<{ key: TraitKey; label: string }> = [
  { key: 'ambiguity', label: 'Ambiguity and context-dependent decisions?' },
  { key: 'multiStepReasoning', label: 'Multi-step reasoning across fragmented information?' },
  { key: 'intermediateStates', label: 'Remembering intermediate states?' },
  { key: 'retrying', label: 'Retrying when errors occur?' },
  { key: 'adapting', label: 'Adapting to changing conditions?' },
];

export const RED_FLAGS = {
  h1: 'Users are resistant to automation in this area',
  h2: 'Historical data is incomplete, inconsistent, or outdated',
  h3: 'No plan for user training or change management',
  i1: 'Problem occurs less than 10 times per year (low ROI)',
  i2: "Can't write a clear job description",
  i3: 'Building "because everyone else has AI"',
  r1: 'Using an agent for a simple rule-based task',
  r2: 'Expecting a chatbot to reason and make decisions',
  r3: "No clear distinction between what's automated vs. what requires reasoning",
  e1: 'No human approval for high-stakes actions',
  e2: 'Security decisions are made probabilistically by AI',
  e3: 'No rollback or undo capability',
  e4: 'Catastrophic failure would cause irreversible harm',
} as const;

export const ALTERNATIVES: Array<{ name: string; description: string }> = [
  { name: 'Automation', description: 'can a simple rule-based system solve this?' },
  { name: 'Chatbot', description: 'do users just need information retrieval?' },
  { name: 'Human Process Improvement', description: 'can we optimize the manual workflow instead?' },
  { name: 'Wait', description: 'is the technology/data/culture not ready yet? Revisit in a few months.' },
];

export const SIGN_OFF_ROLES: Array<{ key: SignOffRole; label: string }> = [
  { key: 'productManager', label: 'Product Manager' },
  { key: 'engineering', label: 'Engineering' },
  { key: 'dataAnalytics', label: 'Data/Analytics' },
  { key: 'securityCompliance', label: 'Security/Compliance' },
  { key: 'endUsers', label: 'End Users Representative' },
];

// From framework/agent-metrics/ai-agent-metrics.md; denominators per the guide and its glossary.
export const METRIC_DEFS: Record<MetricKey, { name: string; unit: '%' | 'turns'; denominator: string; question: string }> = {
  ucr: { name: 'User Correction Rate (UCR)', unit: '%', denominator: 'all conversations', question: 'How often users edit the agent output' },
  ppr: {
    name: 'Ping Pong Rate (PPR)', unit: 'turns',
    denominator: 'resolved conversations (conversations that reached a resolving action)',
    question: 'Back-and-forths until the user actually gets the right answer',
  },
  diy: { name: 'Fine, Do It Yourself Rate (DIY)', unit: '%', denominator: 'all conversations', question: 'Users abandon the conversation and do the action in the traditional UI' },
  irr: {
    name: 'Instant Resolution Rate (IRR)', unit: '%',
    denominator: 'resolvable conversations (conversations with an actionable request)',
    question: 'Issues solved in the first turn',
  },
  rlr: {
    name: 'Red Line Rate (RLR)', unit: '%',
    denominator: "interactions (one user message plus the agent's reply)",
    question: 'Agent crosses safety/policy boundaries',
  },
};

export const METRIC_KEYS = Object.keys(METRIC_DEFS) as MetricKey[];
export const METRIC_SHORT: Record<MetricKey, string> = { ucr: 'UCR', ppr: 'PPR', diy: 'DIY', irr: 'IRR', rlr: 'RLR' };

// The metrics guide's Good bands.
export const KPI_SUGGESTIONS: Array<{ key: MetricKey; name: string; target: string }> = [
  { key: 'irr', name: 'Instant Resolution Rate (IRR)', target: 'IRR > 60%' },
  { key: 'diy', name: 'Fine, Do It Yourself Rate (DIY)', target: 'DIY < 5%' },
  { key: 'rlr', name: 'Red Line Rate (RLR)', target: 'RLR = 0%' },
  { key: 'ucr', name: 'User Correction Rate (UCR)', target: 'UCR < 15%' },
  { key: 'ppr', name: 'Ping Pong Rate (PPR)', target: 'PPR ≤ 1.2 turns' },
];

/** The scored sections' names, as this tool heads them (steps, result, reasons, PDF). */
export const SECTION_NAMES = { h: 'Human & Habits', i: 'Impact & Intent', e: 'Exposure & Execution' } as const;

/** Every scored H, I and E item's checklist label, by key. */
export const ITEM_LABEL: Record<string, string> = Object.fromEntries(
  [...H_ITEMS, ...I_ITEMS, ...E_GUARDRAILS, ...E_BOUNDARIES].map((x) => [x.key, x.label]),
);

export interface FlowStep {
  id: string;
  letter: 'I' | 'R' | 'E' | 'H' | 'M' | '·';
  title: string;
  part: 0 | 1 | 2 | 3 | 4;
  liveOnly?: true;
}

// The spec's "Flow (decided)": order never changes the score.
export const FLOW: FlowStep[] = [
  { id: 'start', letter: '·', title: 'Start', part: 0 },
  { id: 'job', letter: 'I', title: 'The job', part: 1 },
  { id: 'tool', letter: 'R', title: 'The right tool', part: 1 },
  { id: 'worst', letter: 'E', title: 'Worst case', part: 1 },
  { id: 'metrics', letter: 'M', title: 'Live metrics', part: 2, liveOnly: true },
  { id: 'human', letter: 'H', title: SECTION_NAMES.h, part: 3 },
  { id: 'impact', letter: 'I', title: SECTION_NAMES.i, part: 3 },
  { id: 'exposure', letter: 'E', title: SECTION_NAMES.e, part: 3 },
  { id: 'result', letter: '·', title: 'Result', part: 4 },
];

export const THRESHOLDS = { doNotBuildMax: 30, trainMax: 50, ceiling: 77 } as const;

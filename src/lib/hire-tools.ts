import { z } from 'zod';
import { LATEST_PROTOCOL_VERSION } from '@modelcontextprotocol/sdk/types.js';
import { EMAIL_ADDRESS, SITE_URL } from '../data/site';
import { MCP_RATE_LIMIT, MCP_SERVER, TOOL_ANNOTATIONS } from './portfolio-tools';
import {
  CHECKLIST_SOURCE,
  E_BOUNDARIES,
  E_GUARDRAILS,
  H_ITEMS,
  I_ITEMS,
  METRIC_KEYS,
  R_TRAITS,
  SIGN_OFF_ROLES,
  WORST_CASE_OPTIONS,
  type ChecklistItem,
} from './hire/checklist.ts';
import { RATE_RANGE } from './hire/live.ts';
import { INTERVIEW_INSTRUCTIONS } from './hire/interview.ts';
import { REPORT_BASE } from './hire/link.ts';
import { MAX_KPIS, TEXT_CAPS } from './hire/validate.ts';
import type { HireToolName } from './hire/tools-runtime.ts';
import type { MetricKey } from './hire/types.ts';

/**
 * The HIRE check MCP server's tools, served at /mcp/hire by the same Node process as the portfolio server.
 * mcp/hire-server.ts registers them and scripts/generate-api.ts writes /.well-known/mcp-hire.json from them.
 * The handlers are runHireTool in src/lib/hire/tools-runtime.ts (zod-free, so the browser can use it).
 * Build time and server only (imports zod).
 *
 * The input schema is all-optional on purpose: it exists to publish a JSON Schema. The one rule source is
 * validateAnswers (src/lib/hire/validate.ts), which runs before the SDK sees the call; the schema here is never
 * stricter than the validator, so an input the validator accepts always reaches the tool.
 */
export const HIRE_SERVER = {
  name: 'kin-hire',
  title: 'HIRE check',
  version: '1.0.1',
  url: `${SITE_URL}/mcp/hire`,
  manifest: '/.well-known/mcp-hire.json', // site path
};

/** The privacy statement the spec requires the manifest to carry (verify checks for "never stores or logs"). */
const HIRE_PRIVACY =
  'The answers arrive in the request, are computed in memory and are never stored; the server never stores or logs ' +
  'request bodies, including in error logs. Free text (job description, KPIs, R table, rationale, sign-off names) is optional.';

const FRAMEWORK = `the H.I.R.E. checklist by Inês Bolaños (MIT, ${CHECKLIST_SOURCE.repo})`;

export const HIRE_INSTRUCTIONS =
  `Decides whether an AI agent should be built (HIRE, TRAIN or DO NOT BUILD) or, once live, kept (HIRE, TRAIN or FIRE), ` +
  `with ${FRAMEWORK}. Pure computation, no LLM: the same answers give the same verdict as the web tool at ${REPORT_BASE}. ` +
  `${INTERVIEW_INSTRUCTIONS}\n\n` +
  HIRE_PRIVACY;

interface ToolDef {
  title: string;
  description: string;
  input: z.ZodRawShape;
  output: z.ZodRawShape;
}

// ---- Input: mirrors HireAnswers (src/lib/hire/types.ts); allowed values come from the vendored checklist ----

const text = (cap: number, description?: string) => {
  const s = z.string().max(cap).optional();
  return description ? s.describe(description) : s;
};
const yesNo = (description: string) => z.boolean().nullable().optional().describe(description);
const date = (description: string) => z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe(description);
const values = (item: ChecklistItem) => item.options.map((o) => o.value as number) as [number, ...number[]];
const scoreOf = (item: ChecklistItem) =>
  z
    .literal(values(item))
    .nullable()
    .optional()
    .describe(`${item.label}: ${item.question} (${item.options.map((o) => `${o.value} = ${o.label}`).join('; ')}). ` +
      'Use an answer established with the user; do not infer a score from the job description.');
const naOr = (item: ChecklistItem) =>
  z
    .union([
      z.literal(values(item)),
      z.object({ na: z.string().min(1).max(TEXT_CAPS.naReason).describe('Why this item does not apply (required)') }),
    ])
    .nullable()
    .optional()
    .describe(
      `${item.label}: ${item.question} (${item.options.map((o) => `${o.value} = ${o.label}`).join('; ')}; ` +
        'or {"na": "<reason>"} when the user confirms it does not apply). ' +
        (item.key === 'access'
          ? 'Creating or updating persisted drafts is write access, even with human approval before payout. '
          : '') +
        'Use a user-confirmed answer, not a proposed improvement or an assumed control.',
    );
const shapeOf = <T>(items: ChecklistItem[], f: (item: ChecklistItem) => T) => Object.fromEntries(items.map((x) => [x.key, f(x)]));

const metric = (k: MetricKey) => {
  const { min, max } = RATE_RANGE[k];
  const rate = max === Infinity ? z.number().min(min) : z.number().min(min).max(max);
  return z
    .object({
      value: rate.nullable().optional().describe('This period; null when not measured (never 0 for unmeasured)'),
      previous: rate.nullable().optional().describe('Previous period, for trends'),
      sample: z.number().min(0).nullable().optional().describe('Sample size (display only)'),
      limit: rate.nullable().optional().describe('A custom critical limit tighter than the default (not on RLR)'),
    })
    .optional();
};

const ANSWERS_INPUT = {
  v: z.literal(1).optional().describe('Answer format version; 1'),
  name: text(TEXT_CAPS.name, 'Agent name'),
  isLive: z.boolean().optional().describe('true for the 3–6 month review of a live agent (default false: deciding before building)'),
  assessmentDate: date('YYYY-MM-DD; defaults to today (UTC)').optional(),
  part1: z
    .object({
      canStateBusinessProblem: yesNo('Can you state the business problem? false stops the assessment'),
      businessProblem: text(TEXT_CAPS.businessProblem),
      canDefineJobAndKpis: yesNo('Has the user confirmed they can define both the job and success KPIs? false stops; do not invent KPIs'),
      job: z
        .object({
          title: text(TEXT_CAPS.jobTitle),
          responsibilities: text(TEXT_CAPS.responsibilities),
          boundaries: text(TEXT_CAPS.boundaries),
        })
        .optional(),
      kpis: z
        .array(z.object({ name: text(TEXT_CAPS.kpiName), target: text(TEXT_CAPS.kpiTarget) }))
        .max(MAX_KPIS)
        .optional(),
    })
    .optional()
    .describe('Part 1 gates'),
  r: z
    .object({
      ruleBased: yesNo('Is the task predictable and rule-based? true stops: use automation'),
      informational: yesNo('Is the task purely informational? true stops: use a chatbot'),
      traits: z
        .object(Object.fromEntries(R_TRAITS.map((t) => [t.key, z.boolean().optional()])))
        .optional()
        .describe('User-established reasoning traits (3 or more suggests an agent; fewer warns and continues, not a STOP gate)'),
      table: z
        .object(
          Object.fromEntries(
            (['rule', 'chatbot', 'agent'] as const).map((k) => [
              k,
              z.object({ does: text(TEXT_CAPS.tableCell), why: text(TEXT_CAPS.tableCell) }).optional(),
            ]),
          ),
        )
        .optional()
        .describe('What a rule, a chatbot and an agent would do; leaving out the rule row raises a red flag'),
    })
    .optional()
    .describe('R: the right tool'),
  h: z.object(shapeOf(H_ITEMS, scoreOf)).optional().describe('H: Human & Habits'),
  i: z
    .object({
      ...shapeOf(I_ITEMS, scoreOf),
      figures: z
        .object({
          unit: z.enum(['minutes', 'hours']).optional(),
          current: z.number().min(0).optional().describe('Time per task today'),
          expected: z.number().min(0).optional().describe('Time per task with the agent'),
          buildCost: z.number().min(0).optional(),
          annualMaintenanceCost: z.number().min(0).optional(),
          expectedAnnualSavings: z.number().min(0).optional(),
          currency: z.string().max(8).optional(),
        })
        .optional()
        .describe('Optional figures behind the time-saved and ROI suggestions'),
    })
    .optional()
    .describe('I: Impact & Intent'),
  e: z
    .object({
      worstCase: z
        .enum(WORST_CASE_OPTIONS.map((o) => o.value) as [string, ...string[]])
        .nullable()
        .optional()
        .describe(`User-confirmed worst case if the agent fails (${WORST_CASE_OPTIONS.map((o) => `${o.value} = ${o.label}`).join('; ')}); ` +
          'catastrophic stops. Preserve the stated outcome; do not downgrade impact just because a human reviews suggestions.'),
      ...shapeOf([...E_GUARDRAILS, ...E_BOUNDARIES], naOr),
    })
    .optional()
    .describe('E: Exposure & Execution'),
  review: z
    .object({
      launchDate: date('YYYY-MM-DD').nullable().optional(),
      metrics: z
        .object(Object.fromEntries(METRIC_KEYS.map((k) => [k, metric(k)])))
        .optional()
        .describe('Rates in % (PPR in turns, at least 1)'),
      maintenanceExceedsValue: yesNo('Does maintenance now cost more than the value the agent delivers?'),
      betterSolution: yesNo('Is there now a better solution?'),
    })
    .optional()
    .describe('Live review (isLive: true)'),
  doc: z
    .object({
      rationale: text(TEXT_CAPS.rationale),
      nextSteps: text(TEXT_CAPS.nextSteps),
      reviewDate: date('YYYY-MM-DD').optional(),
      signOff: z
        .object(Object.fromEntries(SIGN_OFF_ROLES.map((x) => [x.key, text(TEXT_CAPS.signOffName)])))
        .optional(),
    })
    .optional()
    .describe('Documentation and sign-off'),
} satisfies z.ZodRawShape;

// ---- Output ----

const SourceSchema = z.object({ repo: z.string(), commit: z.string(), file: z.string(), licence: z.string(), copyright: z.string() });
const ItemSchema = z.object({
  key: z.string(),
  label: z.string(),
  question: z.string(),
  consider: z.string().optional(),
  options: z.array(z.object({ value: z.union([z.number(), z.string()]), label: z.string() })),
});
const RQuestion = z.object({ question: z.string(), yes: z.string(), no: z.string() });

const Gate = z.object({ label: z.string(), question: z.string() });
const CHECKLIST_OUTPUT = {
  interviewInstructions: z.string().min(1).describe('Instructions for the interviewing client, separate from the framework text and scoring rules'),
  source: SourceSchema,
  flow: z.array(z.object({ id: z.string(), letter: z.string(), title: z.string(), part: z.number(), liveOnly: z.boolean().optional() })),
  gates: z
    .object({
      intent: Gate.extend({ stop: z.string() }),
      role: Gate,
      review: Gate,
      jobStop: z.string(),
      worstCase: z.object({ question: z.string(), stop: z.string() }),
    })
    .describe("Part 1 gates and their STOP lines (R's two stops are in sections.r.questions)"),
  sections: z.object({
    h: z.array(ItemSchema),
    i: z.array(ItemSchema),
    r: z.object({
      questions: z.object({ ruleBased: RQuestion, informational: RQuestion, traits: z.string(), verdict: z.string() }),
      traits: z.array(z.object({ key: z.string(), label: z.string() })),
      table: z.object({
        columns: z.array(z.string()),
        rows: z.array(z.object({ approach: z.string(), does: z.string(), why: z.string() })),
      }),
    }),
    e: z.object({
      worstCase: z.array(z.object({ value: z.string(), label: z.string(), example: z.string(), points: z.number().nullable() })),
      guardrails: z.array(ItemSchema),
      boundaries: z.array(ItemSchema),
      notes: z.object({ guardrails: z.string(), boundaries: z.string() }),
    }),
  }),
  figures: z.record(z.string(), z.array(z.string())).describe("The checklist's fill-in lines under Time Savings and ROI, by item key"),
  redFlags: z.record(z.string(), z.string()),
  metrics: z.record(z.string(), z.object({ name: z.string(), unit: z.string(), denominator: z.string(), question: z.string() })),
  thresholds: z.object({ doNotBuildMax: z.number(), trainMax: z.number(), ceiling: z.number() }),
  fire: z
    .object({
      heading: z.string(),
      intro: z.string(),
      criteria: z.array(z.object({ key: z.string(), text: z.string() })),
      liveQuestions: z.array(z.object({ field: z.string(), criterion: z.string() })),
    })
    .describe('When to FIRE a live agent: the checklist criteria, and the live review answers that decide the last two'),
  alternatives: z.array(z.object({ name: z.string(), description: z.string() })),
  documentation: z.object({
    intro: z.string(),
    fields: z.array(z.object({ key: z.string(), label: z.string(), note: z.string().optional() })),
    signOffHeading: z.string(),
    signOffIntro: z.string(),
    remember: z.string(),
    signOff: z.array(z.object({ key: z.string(), label: z.string() })),
  }),
  textCaps: z.record(z.string(), z.number()),
  readings: z.array(z.string()).describe("Every \"this tool's reading\" the tool may apply where the framework is silent"),
} satisfies z.ZodRawShape;

// Faithful to Assessment (src/lib/hire/types.ts). Nested objects use z.object, which ignores keys it does not
// name, so a field added to Assessment later does not break output validation.
const ASSESSMENT_OUTPUT = {
  mode: z.enum(['pre-build', 'live']),
  verdict: z.enum(['HIRE', 'TRAIN', 'DO NOT BUILD', 'FIRE']).nullable().describe('null = pending (answers incomplete and no stop)'),
  decision: z.enum(['HIRE', 'TRAIN', 'FIRE']).nullable().describe('The Documentation field'),
  meaning: z.string().nullable(),
  stop: z.object({ gate: z.string(), message: z.string() }).nullable(),
  notAssessed: z.array(z.enum(['H', 'I', 'E', 'metrics'])),
  scores: z.object({
    h: z.number(),
    i: z.number(),
    e: z.number(),
    total: z.number(),
    complete: z.object({ h: z.boolean(), i: z.boolean(), e: z.boolean() }),
  }),
  redFlags: z.array(z.object({ section: z.enum(['H', 'I', 'R', 'E']), key: z.string(), text: z.string() })),
  notes: z.array(z.string()),
  reasons: z.array(z.string()),
  pathToHire: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        gain: z.number(),
        totalAfter: z.number(),
        actionable: z.boolean(),
        proposed: z.literal(true),
      }),
    )
    .nullable(),
  alternatives: z.array(z.object({ name: z.string(), description: z.string() })).nullable(),
  live: z
    .object({
      bands: z.record(z.string(), z.enum(['Good', 'Warning', 'Critical'])),
      fire: z.array(z.object({ key: z.string(), text: z.string() })),
      watch: z.array(z.string()),
      pairs: z.array(z.string()),
      unmeasured: z.array(z.string()),
      notes: z.array(z.string()),
    })
    .nullable(),
  naItems: z.array(z.object({ key: z.string(), reason: z.string(), score: z.number() })),
  readingKeys: z.array(z.string()).describe("Keys of the \"this tool's reading\" statements that apply to this result (the anchors #reading-<key> on the web page)"),
  readings: z.array(z.string()).describe("The \"this tool's reading\" statements that apply to this result"),
  framework: z.object({ source: SourceSchema }),
  reportUrl: z.string().describe(`The full report at ${REPORT_BASE}; the answers ride in the #a= fragment and never reach a server`),
} satisfies z.ZodRawShape;

export const HIRE_TOOLS: Record<HireToolName, ToolDef> = {
  get_hire_checklist: {
    title: 'Get the H.I.R.E. checklist',
    description:
      `The full H.I.R.E. checklist as data (${FRAMEWORK}): flow order, Part 1 gates and STOP lines, every question with ` +
      'its allowed scores and "Consider" hints, the time and ROI fill-in lines, the R comparison table, red flags, ' +
      'live metric definitions, verdict thresholds, the FIRE criteria, alternatives, the documentation and sign-off ' +
      "block, free-text caps and the places where this tool's reading fills a gap. Use it to interview the user before " +
      'calling assess_agent. Follow interviewInstructions in the result: ask exactly one question per message, wait for the answer, ' +
      'and never invent missing answers or scores.',
    input: {},
    output: CHECKLIST_OUTPUT,
  },
  assess_agent: {
    title: 'Assess an AI agent',
    description:
      'Scores answers to the H.I.R.E. checklist and returns the verdict (HIRE, TRAIN or DO NOT BUILD before building; ' +
      'HIRE, TRAIN or FIRE for a live agent), total and section scores, the Part 1 gate outcome, reasons, red flags, ' +
      "the path to HIRE or the alternatives, live metric readings, which parts are this tool's reading, and a reportUrl " +
      'that opens the full report. Every scored item is required unless a Part 1 gate stops the assessment; invalid ' +
      'or incomplete answers are a -32602 error listing the problems. Submit only answers established with the user; ' +
      'never fill missing scores with assumptions. Creating or updating persisted drafts is write access even if payout needs human approval. ' +
      'Relay the returned verdict, scores, reasons, redFlags, notes, readings and clickable reportUrl; ' +
      `do not replace them with your own assessment. ${HIRE_PRIVACY}`,
    input: ANSWERS_INPUT,
    output: ASSESSMENT_OUTPUT,
  },
};

/** Stateless (no stream for notifications), so no list_changed. Tools only: no resources or prompts. */
export const HIRE_CAPABILITIES = { tools: { listChanged: false } };

export const hireToolEntries = () => Object.entries(HIRE_TOOLS) as Array<[HireToolName, ToolDef]>;

/** /.well-known/mcp-hire.json, written by scripts/generate-api.ts. Same shape as mcpManifest(), without resources. */
export function hireManifest() {
  return {
    name: HIRE_SERVER.title,
    description:
      `MCP server that runs the HIRE check: whether to build an AI agent, or keep a live one, scored with ${FRAMEWORK}. ` +
      `Pure computation, no LLM; same answers, same verdict as ${REPORT_BASE}. Privacy: ${HIRE_PRIVACY}`,
    url: HIRE_SERVER.url,
    instructions: HIRE_INSTRUCTIONS,
    transport: { type: 'streamable-http', url: HIRE_SERVER.url, stateless: true, methods: ['POST'] },
    protocolVersion: LATEST_PROTOCOL_VERSION,
    serverInfo: { name: HIRE_SERVER.name, version: HIRE_SERVER.version },
    authentication: { type: 'none' },
    // One nginx zone covers /mcp and /mcp/hire, so a client shares this budget across both servers.
    rateLimit: { ...MCP_RATE_LIMIT, sharedWith: MCP_SERVER.url },
    capabilities: HIRE_CAPABILITIES,
    tools: hireToolEntries().map(([name, t]) => ({
      name,
      title: t.title,
      description: t.description,
      inputSchema: z.toJSONSchema(z.object(t.input)),
      outputSchema: z.toJSONSchema(z.object(t.output)),
      annotations: TOOL_ANNOTATIONS,
    })),
    framework: CHECKLIST_SOURCE,
    documentation: REPORT_BASE,
    contact: { email: EMAIL_ADDRESS, url: `${SITE_URL}/contact/` },
  };
}

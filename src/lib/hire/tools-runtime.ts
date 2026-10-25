/**
 * Runs the HIRE check tools. Zod-free and SDK-free so the browser (WebMCP) can import it as well as the MCP
 * server (mcp/hire-server.ts); the published schemas live in src/lib/hire-tools.ts.
 *
 * The validator is the one rule source: assess_agent runs validateAnswers here and throws HireInputError when the
 * answers are invalid or incomplete; the server maps that to a JSON-RPC -32602 error.
 */
import { assess } from './assess.ts';
import {
  CHECKLIST_SOURCE,
  E_BOUNDARIES,
  E_GUARDRAILS,
  FLOW,
  H_ITEMS,
  I_ITEMS,
  METRIC_DEFS,
  RED_FLAGS,
  R_QUESTIONS,
  R_TRAITS,
  THRESHOLDS,
  WORST_CASE_OPTIONS,
} from './checklist.ts';
import { reportUrl } from './link.ts';
import { READINGS } from './reasons.ts';
import { TEXT_CAPS, validateAnswers } from './validate.ts';

export type HireToolName = 'get_hire_checklist' | 'assess_agent';

/** Bad input to a HIRE tool: the issues are the validator's messages, safe to send back to the caller. */
export class HireInputError extends Error {
  readonly issues: string[];
  constructor(issues: string[]) {
    super(issues.join('; '));
    this.name = 'HireInputError';
    this.issues = issues;
  }
}

/** The whole checklist as data, so an agent can interview its user (the same for every call). */
const CHECKLIST = Object.freeze({
  source: CHECKLIST_SOURCE,
  flow: FLOW,
  sections: {
    h: H_ITEMS,
    i: I_ITEMS,
    r: { questions: R_QUESTIONS, traits: R_TRAITS },
    e: { worstCase: WORST_CASE_OPTIONS, guardrails: E_GUARDRAILS, boundaries: E_BOUNDARIES },
  },
  redFlags: RED_FLAGS,
  metrics: METRIC_DEFS,
  thresholds: THRESHOLDS,
  textCaps: TEXT_CAPS,
  readings: Object.values(READINGS) as string[],
});

export async function runHireTool(name: HireToolName, input: unknown): Promise<object> {
  switch (name) {
    case 'get_hire_checklist':
      return CHECKLIST;
    case 'assess_agent': {
      const v = validateAnswers(input, { requireComplete: true });
      if (!v.ok) throw new HireInputError(v.issues);
      return { ...assess(v.answers), reportUrl: await reportUrl(v.answers) };
    }
    default:
      throw new HireInputError([`Unknown tool: ${String(name)}`]);
  }
}

import type { HireAnswers } from './types.ts';

// The fraud / banking support agent worked example (pre-build), from the framework's case study.
// The case study does not list which R traits it ticked: the three set here are this tool's reading of its R section.
export const FRAUD_CASE: HireAnswers = {
  v: 1,
  name: 'Fraud Support Agent',
  isLive: false,
  assessmentDate: '2026-08-29',
  part1: {
    canStateBusinessProblem: true,
    businessProblem:
      'The set of things the bank can do about fraud is small and structured; the set of ways customers ask for them is not.',
    canDefineJobAndKpis: true,
    job: {
      title: 'Front-line Fraud Triage Specialist',
      responsibilities:
        'Hired to take the first pass on every inbound fraud contact: identify the intent, take the safe structured action (block, dispute, secure, refund) or gather what a human needs to act, and never promise an outcome. Success = resolving routine cases on the first exchange and routing the rest to humans with full context.',
      boundaries: [
        'Cannot guarantee refund outcomes (over-promising is a tracked red line: `overpromise_guarantee`)',
        'Cannot take an account action outside the structured action set',
        'Cannot handle non-fraud banking requests (out of scope → `other` → discovery)',
        "Cannot override a customer's request for a human",
      ].join('\n'),
    },
    kpis: [
      { name: 'Instant Resolution Rate (IRR)', target: '>60%' },
      { name: 'Fine, Do It Yourself Rate (DIY)', target: '<15% (guide Good: <5%)' },
      { name: 'Red Line Rate (RLR)', target: '0%' },
      { name: 'User Correction Rate (UCR)', target: '<15%' },
      { name: 'Ping Pong Rate (PPR)', target: '≤1.2 turns' },
      { name: 'Deterministic coverage', target: 'stable or rising trend' },
    ],
  },
  r: {
    ruleBased: false,
    informational: false,
    traits: { ambiguity: true, multiStepReasoning: true, intermediateStates: true, retrying: false, adapting: false },
    table: {
      rule: {
        does: 'Menu + buttons + dispute form',
        why: 'Works perfectly — for the 38.6% of user messages that arrive through a control. Regex over the typed 61.4% is guessing, not categorizing.',
      },
      chatbot: {
        does: 'FAQ-style answers about fraud policy',
        why: "Can explain, but can't run the multi-step triage (identify intent → gather details → take the action).",
      },
      agent: {
        does: 'Classify free text onto the intent taxonomy, gather missing details, choose the structured action',
        why: 'Right level: ambiguity lives only in the language; the action space stays deterministic.',
      },
    },
  },
  h: { trust: 2, culturalFit: 3, userControl: 3, changeManagement: 2, dataQuality: 3, systemIntegration: 3, interaction: 1 },
  i: { frequency: 5, timeSavings: 3, roi: 5, strategicValue: 2 },
  e: { worstCase: 'moderate', hitl: 5, security: 5, rollback: 5, audit: 5, tenant: 5, access: -10, fallback: 5 },
  doc: {
    rationale:
      "The case study's scores, so it reproduces 42/77 TRAIN. A strict reading of the checklist would lower E: Human-in-the-Loop asks that users approve critical actions before execution, and Tenant Isolation asks that the agent is not used for cross customer learning. The metrics guide's table puts DIY Good at <5%.",
  },
};

export type NA = { na: string }; // "not applicable" with its reason
export type HScore = 1 | 2 | 3;
export type WorstCase = 'minor' | 'moderate' | 'severe' | 'catastrophic';
export type MetricKey = 'ucr' | 'ppr' | 'diy' | 'irr' | 'rlr';
export type Verdict = 'HIRE' | 'TRAIN' | 'DO NOT BUILD' | 'FIRE';
export type SignOffRole = 'productManager' | 'engineering' | 'dataAnalytics' | 'securityCompliance' | 'endUsers';
export type TraitKey = 'ambiguity' | 'multiStepReasoning' | 'intermediateStates' | 'retrying' | 'adapting';

export interface MetricInput {
  value: number | null;
  previous?: number | null;
  sample?: number | null;
  limit?: number | null;
}

export interface HireAnswers {
  v: 1;
  name: string;
  isLive: boolean;
  assessmentDate: string; // YYYY-MM-DD
  part1: {
    canStateBusinessProblem: boolean | null;
    businessProblem?: string;
    canDefineJobAndKpis: boolean | null;
    job?: { title?: string; responsibilities?: string; boundaries?: string };
    kpis?: Array<{ name: string; target: string }>;
  };
  r: {
    ruleBased: boolean | null;
    informational: boolean | null;
    traits: Record<TraitKey, boolean>;
    table?: Partial<Record<'rule' | 'chatbot' | 'agent', { does?: string; why?: string }>>;
  };
  h: Record<
    'trust' | 'culturalFit' | 'userControl' | 'changeManagement' | 'dataQuality' | 'systemIntegration' | 'interaction',
    HScore | null
  >;
  i: {
    frequency: 1 | 2 | 3 | 4 | 5 | null;
    timeSavings: 1 | 2 | 3 | 4 | null;
    roi: -5 | 0 | 5 | null;
    strategicValue: HScore | null;
    figures?: {
      unit?: 'minutes' | 'hours';
      current?: number;
      expected?: number;
      buildCost?: number;
      annualMaintenanceCost?: number;
      expectedAnnualSavings?: number;
      currency?: string;
    };
  };
  e: {
    worstCase: WorstCase | null;
    hitl: -5 | 0 | 5 | NA | null;
    security: -5 | 5 | NA | null;
    rollback: -5 | 5 | NA | null;
    audit: -5 | 5 | NA | null;
    tenant: -5 | 5 | NA | null;
    access: -10 | 10 | NA | null;
    fallback: -5 | 5 | NA | null;
  };
  review?: {
    // present only when isLive
    launchDate: string | null;
    metrics: Record<MetricKey, MetricInput>; // rlr.limit is never set
    maintenanceExceedsValue: boolean | null;
    betterSolution: boolean | null;
  };
  doc?: {
    rationale?: string;
    nextSteps?: string;
    reviewDate?: string;
    signOff?: Partial<Record<SignOffRole, string>>;
  };
}

import type { ALTERNATIVES, CHECKLIST_SOURCE } from './checklist.ts';
import type { LiveReading } from './live.ts';
import type { READINGS } from './reasons.ts';
import type { RedFlag, SectionScores, Stop } from './score.ts';

export interface PathStep { key: string; label: string; gain: number; totalAfter: number; actionable: boolean; proposed: true }
export interface Assessment {
  mode: 'pre-build' | 'live';
  verdict: Verdict | null; // null = pending (answers incomplete and no stop)
  decision: 'HIRE' | 'TRAIN' | 'FIRE' | null; // the Documentation field
  meaning: string | null; // one line for the cover
  stop: Stop | null;
  notAssessed: Array<'H' | 'I' | 'E' | 'metrics'>;
  scores: SectionScores;
  redFlags: RedFlag[];
  notes: string[]; // traits note, N/A notes, live notes
  reasons: string[];
  pathToHire: PathStep[] | null;
  alternatives: typeof ALTERNATIVES | null;
  live: LiveReading | null;
  naItems: Array<{ key: string; reason: string; score: number }>;
  readingKeys: Array<keyof typeof READINGS>; // every "this tool's reading" that applies to this result
  readings: string[]; // their text, in the same order
  framework: { source: typeof CHECKLIST_SOURCE };
}

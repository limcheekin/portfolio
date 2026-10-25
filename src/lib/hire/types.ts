export type NA = { na: string }; // "not applicable" with its reason
export type HScore = 1 | 2 | 3;
export type WorstCase = 'minor' | 'moderate' | 'severe' | 'catastrophic';
export type MetricKey = 'ucr' | 'ppr' | 'diy' | 'irr' | 'rlr';
export type Verdict = 'HIRE' | 'TRAIN' | 'DO NOT BUILD' | 'FIRE';
export type SignOffRole = 'productManager' | 'engineering' | 'dataAnalytics' | 'securityCompliance' | 'endUsers';

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
    traits: {
      ambiguity: boolean;
      multiStepReasoning: boolean;
      intermediateStates: boolean;
      retrying: boolean;
      adapting: boolean;
    };
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

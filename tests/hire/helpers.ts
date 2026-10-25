import type { HireAnswers, MetricInput, MetricKey } from '../../src/lib/hire/types.ts';

export function blankAnswers(): HireAnswers {
  return {
    v: 1,
    name: '',
    isLive: false,
    assessmentDate: '2026-10-25',
    part1: { canStateBusinessProblem: null, canDefineJobAndKpis: null },
    r: {
      ruleBased: null,
      informational: null,
      traits: { ambiguity: false, multiStepReasoning: false, intermediateStates: false, retrying: false, adapting: false },
    },
    h: { trust: null, culturalFit: null, userControl: null, changeManagement: null, dataQuality: null, systemIntegration: null, interaction: null },
    i: { frequency: null, timeSavings: null, roi: null, strategicValue: null },
    e: { worstCase: null, hitl: null, security: null, rollback: null, audit: null, tenant: null, access: null, fallback: null },
  };
}

export function allWorst(): HireAnswers {
  return {
    ...blankAnswers(),
    h: { trust: 1, culturalFit: 1, userControl: 1, changeManagement: 1, dataQuality: 1, systemIntegration: 1, interaction: 1 },
    i: { frequency: 1, timeSavings: 1, roi: -5, strategicValue: 1 },
    e: { worstCase: 'severe', hitl: -5, security: -5, rollback: -5, audit: -5, tenant: -5, access: -10, fallback: -5 },
  };
}

// Temporary inline fraud case; Task 6 replaces it with FRAUD_CASE.
export const fraud: HireAnswers = {
  v: 1,
  name: 'Fraud Support Agent',
  isLive: false,
  assessmentDate: '2026-08-29',
  part1: { canStateBusinessProblem: true, businessProblem: 'Analysts spend too long on fraud support cases.', canDefineJobAndKpis: true },
  r: {
    ruleBased: false,
    informational: false,
    traits: { ambiguity: true, multiStepReasoning: true, intermediateStates: true, retrying: false, adapting: false },
    table: {
      rule: { does: 'Route known patterns', why: 'Cannot handle ambiguous cases' },
      chatbot: { does: 'Answer policy questions', why: 'Cannot act on cases' },
      agent: { does: 'Investigate and propose actions', why: 'Reasons across fragmented data' },
    },
  },
  h: { trust: 2, culturalFit: 3, userControl: 3, changeManagement: 2, dataQuality: 3, systemIntegration: 3, interaction: 1 },
  i: { frequency: 5, timeSavings: 3, roi: 5, strategicValue: 2 },
  e: { worstCase: 'moderate', hitl: 5, security: 5, rollback: 5, audit: 5, tenant: 5, access: -10, fallback: 5 },
};

export function m(
  v: Partial<Record<'ucr' | 'ppr' | 'diy' | 'irr' | 'rlr' | 'prevIrr' | 'prevPpr', number>>,
  opts: { launch?: string; limits?: Partial<Record<MetricKey, number>> } = {},
): NonNullable<HireAnswers['review']> {
  const mk = (k: MetricKey, previous?: number): MetricInput => ({
    value: v[k] ?? null,
    ...(previous !== undefined ? { previous } : {}),
    ...(opts.limits?.[k] !== undefined ? { limit: opts.limits[k] } : {}),
  });
  return {
    launchDate: opts.launch ?? '2026-01-01',
    metrics: { ucr: mk('ucr'), ppr: mk('ppr', v.prevPpr), diy: mk('diy'), irr: mk('irr', v.prevIrr), rlr: mk('rlr') },
    maintenanceExceedsValue: null,
    betterSolution: null,
  };
}

// Fraud with hitl and rollback at -5: E 2 instead of 12, total 22 (<= 30, no stop).
export const lowScore: HireAnswers = { ...fraud, e: { ...fraud.e, hitl: -5, rollback: -5 } };

export const withNA: HireAnswers = { ...fraud, e: { ...fraud.e, tenant: { na: 'single-tenant internal tool' } } };

export function liveFraud(values: Parameters<typeof m>[0]): HireAnswers {
  return { ...fraud, isLive: true, assessmentDate: '2026-10-25', review: m(values, { launch: '2026-01-01' }) };
}

export type VisualKey = 'claim' | 'trade' | 'ware' | 'agent' | 'concord' | 'talk' | 'rag';
export interface VisualProps { active: boolean }
export interface WorkCard { slug: string; title: string; kind: 'enterprise' | 'oss' | 'more'; label: string; tagline: string; stack: string[]; visual?: VisualKey; href: string }
export interface CareerEntry { when: string; title: string; org?: string; summary: string; chips?: string[]; condensed?: boolean }
export interface AgentRunRow { step: string; detail: string } // detail may contain **bold** spans
export interface AgentRun { name: 'trade-pilot' | 'claim-pilot' | 'warebot'; rows: AgentRunRow[] }

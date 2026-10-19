import type { CollectionEntry } from 'astro:content';

type ProjectData = CollectionEntry<'projects'>['data'];
/** Illustration keys and project kinds come from the `projects` schema in src/content/config.ts. */
export type VisualKey = NonNullable<ProjectData['visual']>;
export interface VisualProps { active: boolean }
export interface WorkCard { slug: string; title: string; kind: ProjectData['kind'] | 'more'; label: string; tagline: string; stack: string[]; visual?: VisualKey; href: string }
export interface CareerEntry { when: string; title: string; org?: string; summary: string; chips?: string[]; condensed?: boolean }
export interface AgentRunRow { step: string; detail: string } // detail may contain **bold** spans
export interface AgentRun { name: 'trade-pilot' | 'claim-pilot' | 'warebot'; rows: AgentRunRow[] }

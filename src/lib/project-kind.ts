/** Project kinds, shared by the content schema and scripts/generate-api.ts (which reads frontmatter directly). */
export const PROJECT_KINDS = ['enterprise', 'oss'] as const;
export type ProjectKind = (typeof PROJECT_KINDS)[number];
export const DEFAULT_PROJECT_KIND = 'oss' satisfies ProjectKind;

/**
 * Everything that varies by kind: the card label, the accent colour (sky marks open-source work only) and
 * whether the project is published source code (JSON-LD type, repository link).
 */
export const PROJECT_KIND_INFO: Record<ProjectKind, { label: string; accent: 'green' | 'sky'; openSource: boolean }> = {
  enterprise: { label: 'Enterprise', accent: 'green', openSource: false },
  oss: { label: 'Open source', accent: 'sky', openSource: true },
};

/** The card label: kind, then the organisation when there is one ("Enterprise · Daxonet AI"). */
export const projectLabel = (kind: ProjectKind, org?: string) => [PROJECT_KIND_INFO[kind].label, org].filter(Boolean).join(' · ');

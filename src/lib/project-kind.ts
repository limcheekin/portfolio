/** Project kinds, shared by the content schema and scripts/generate-api.ts (which reads frontmatter directly). */
export const PROJECT_KINDS = ['enterprise', 'oss'] as const;
export const DEFAULT_PROJECT_KIND = 'oss' satisfies (typeof PROJECT_KINDS)[number];

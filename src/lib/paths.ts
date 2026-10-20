/**
 * Page paths and slugs, shared by the pages, the JSON-LD helpers and scripts/generate-api.ts (no Astro imports,
 * so the build scripts can use them too).
 */
export const projectPath = (slug: string) => `/projects/${slug}/`;
export const articlePath = (slug: string) => `/insights/${slug}/`;
/** The Markdown version of a page, written next to its index.html by generate-api.ts. */
export const markdownPath = (pagePath: string) => `${pagePath}index.md`;

/** A role's slug: its experience id without the sort prefix ("02-dxc-tech-lead" -> "dxc-tech-lead"). */
export const roleSlug = (id: string) => id.replace(/^\d+-/, '');
/** A role's anchor on About. */
export const rolePath = (id: string) => `/about/#role-${roleSlug(id)}`;

export const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

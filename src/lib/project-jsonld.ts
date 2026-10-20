import type { CollectionEntry } from 'astro:content';
import { SITE_URL } from '../data/site';
import { PERSON_REF } from './jsonld';
import { PROJECT_KIND_INFO } from './project-kind';
import { projectPath } from './paths';

/**
 * schema.org description of a project: open-source work with a repository as `SoftwareSourceCode`, enterprise
 * systems (closed, no repository) as a `SoftwareApplication`, and open work without code (a channel, a home
 * server) as a `CreativeWork`. The `@id` is the same wherever the project appears (lists, its own page).
 */
export function projectJsonLd({ slug, data }: CollectionEntry<'projects'>) {
  const url = `${SITE_URL}${projectPath(slug)}`;
  const common = {
    '@id': `${url}#project`,
    name: data.title,
    description: data.description,
    url,
    ...(data.image && { image: new URL(data.image, SITE_URL).href }),
    author: PERSON_REF,
    keywords: data.technologies.join(', '),
  };
  if (!PROJECT_KIND_INFO[data.kind].openSource) {
    return { '@type': 'SoftwareApplication', ...common, applicationCategory: 'BusinessApplication' };
  }
  if (!data.githubUrl) return { '@type': 'CreativeWork', ...common, ...(data.liveUrl && { sameAs: data.liveUrl }) };
  return {
    '@type': 'SoftwareSourceCode',
    ...common,
    codeRepository: data.githubUrl,
    ...(data.languages && { programmingLanguage: data.languages }),
  };
}

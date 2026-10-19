import type { CollectionEntry } from 'astro:content';
import { ENGINEER_NAME, SITE_URL } from '../data/site';
import { PROJECT_KIND_INFO } from './project-kind';

/**
 * schema.org description of a project: open-source work as `SoftwareSourceCode` with its repository,
 * enterprise systems (closed, no repository) as a `SoftwareApplication`.
 */
export function projectJsonLd({ slug, data }: CollectionEntry<'projects'>) {
  const common = {
    name: data.title,
    description: data.description,
    url: `${SITE_URL}/projects/${slug}/`,
    author: { '@type': 'Person', name: ENGINEER_NAME },
    keywords: data.technologies.join(', '),
  };
  return PROJECT_KIND_INFO[data.kind].openSource
    ? { '@type': 'SoftwareSourceCode', ...common, codeRepository: data.githubUrl, programmingLanguage: data.technologies }
    : { '@type': 'SoftwareApplication', ...common, applicationCategory: 'BusinessApplication' };
}

import type { CollectionEntry } from 'astro:content';
import { SITE_URL } from '../data/site';
import { PERSON_REF } from './jsonld';
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
    author: PERSON_REF,
    keywords: data.technologies.join(', '),
  };
  return PROJECT_KIND_INFO[data.kind].openSource
    ? {
        '@type': 'SoftwareSourceCode',
        ...common,
        codeRepository: data.githubUrl,
        ...(data.languages && { programmingLanguage: data.languages }),
      }
    : { '@type': 'SoftwareApplication', ...common, applicationCategory: 'BusinessApplication' };
}

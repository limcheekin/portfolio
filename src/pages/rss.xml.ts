import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { ENGINEER_NAME, SITE_URL, SITE_TITLE } from '../data/site';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const articles = (await getCollection('articles'))
    .filter((a) => !!a.data.publishDate)
    .sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime());

  return rss({
    title: `Insights by ${ENGINEER_NAME}`,
    description: `Articles and insights on AI engineering, RAG systems, and open-source AI by ${ENGINEER_NAME}.`,
    site: context.site ?? SITE_URL,
    items: articles.map((article) => ({
      title: article.data.title,
      description: article.data.description,
      link: article.data.externalUrl || `/insights/${article.slug}/`,
      pubDate: article.data.publishDate,
      categories: article.data.tags,
    })),
    customData: `<language>en</language>`,
  });
}

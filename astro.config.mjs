import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import { lastmodFor } from './scripts/sitemap-lastmod.mjs';

export default defineConfig({
  site: 'https://kin.rag.wtf',
  integrations: [
    react(),
    tailwind(),
    sitemap({
      changefreq: 'weekly',
      // Form confirmation page: noindex, reached only from Formspree's redirect.
      filter: (page) => !page.endsWith('/contact/thanks/'),
      serialize(item) {
        const lastmod = lastmodFor(new URL(item.url).pathname);
        if (lastmod) item.lastmod = lastmod;
        else delete item.lastmod;
        return item;
      },
    }),
  ],
  trailingSlash: 'always',
});

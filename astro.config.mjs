import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://kin.rag.wtf',
  integrations: [
    react(),
    tailwind(),
    sitemap({
      lastmod: new Date(),
      changefreq: 'weekly',
    }),
  ],
  trailingSlash: 'always',
});

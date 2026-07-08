// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

const site = process.env.SITE_URL || process.env.PUBLIC_SITE_URL || 'https://haicuotu.tianma-if.com';

// https://astro.build/config
export default defineConfig({
  site,

  integrations: [
    react(),
    sitemap({
      changefreq: 'weekly',
      lastmod: new Date(),
      priority: 0.8
    })
  ],

  vite: {
    plugins: [tailwindcss()]
  }
});

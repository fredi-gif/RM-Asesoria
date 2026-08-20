// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import keystatic from '@keystatic/astro';

import { SITE } from './src/config/site';

// https://astro.build/config
export default defineConfig({
  site: SITE.url,

  // /tramites era un duplicado de la rejilla de la home. Se retira, pero la URL
  // llegó a publicarse y a enlazarse, así que se redirige en vez de devolver un
  // 404: 301 para que el buscador traslade la autoridad al destino.
  redirects: {
    '/tramites': { status: 301, destination: '/#tramites' },
  },

  integrations: [
    react(),
    markdoc(),
    keystatic(),
    sitemap({
      // /styleguide es una página interna de trabajo, no debe indexarse.
      filter: (page) => !page.includes('/styleguide'),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: vercel(),
});

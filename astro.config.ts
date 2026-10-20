// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import keystatic from '@keystatic/astro';

import { createRequire } from 'node:module';
import { dirname } from 'node:path';

import { SITE } from './src/config/site';

/**
 * Satori (el motor de las imágenes de marca, `src/lib/marca`) carga harfbuzz
 * como WebAssembly leyendo `hb.wasm` de disco. El trazado de dependencias del
 * adaptador de Vercel no ve esa lectura y no copia el fichero a la función,
 * y sin él la función entera se cae al arrancar —panel incluido—. Se añade a
 * mano, resolviendo la ruta desde Satori para que siga valiendo aunque cambie
 * la versión.
 */
const requerir = createRequire(import.meta.url);
const harfbuzzWasm = createRequire(`${dirname(requerir.resolve('satori/package.json'))}/`).resolve(
  'harfbuzzjs/hb.wasm',
);

// https://astro.build/config
export default defineConfig({
  site: SITE.url,

  // Una sola URL por página, sin barra final, que es como enlaza la web por
  // dentro. Con 'ignore' cada página respondía 200 en /x y en /x/, y el
  // canónico y el sitemap usaban /x/ mientras los enlaces internos iban a /x:
  // dos URLs por página con señales cruzadas para Google.
  trailingSlash: 'never',

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
      // /styleguide y /marca son herramientas internas: no deben indexarse (y
      // robots.txt ya las bloquea, así que listarlas en el sitemap es contradictorio).
      filter: (page) => !page.includes('/styleguide') && !page.includes('/marca'),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: vercel({ includeFiles: [harfbuzzWasm] }),
});

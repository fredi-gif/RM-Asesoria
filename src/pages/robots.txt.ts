import type { APIRoute } from 'astro';
import { SITE } from '../config/site';

export const GET: APIRoute = () =>
  new Response(
    [
      'User-agent: *',
      'Allow: /',
      // El panel de contenidos y la guía de estilo no deben indexarse.
      'Disallow: /keystatic',
      'Disallow: /styleguide',
      '',
      `Sitemap: ${SITE.url}/sitemap-index.xml`,
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );

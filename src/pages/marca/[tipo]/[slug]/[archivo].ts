import type { APIRoute } from 'astro';

import { EXTENSIONES, type Extension } from '../../../../lib/marca/formatos';
import { leerPieza, leerTarjeta, SinSesion } from '../../../../lib/marca/datos';
import { ficheroPieza, ficheroTarjeta } from '../../../../lib/marca/generar';

/**
 * Un fichero de una pieza o de una tarjeta: `/marca/piezas/<slug>/<formato>.<ext>`
 * o `/marca/tarjetas/<slug>/<cara>.<ext>`.
 *
 * Se genera en cada petición, a partir de lo último guardado en el panel (ver
 * `src/lib/marca/datos.ts`). Con `?descargar` se sirve como adjunto; sin él,
 * en línea, que es como lo pinta la galería.
 */
export const prerender = false;

export const GET: APIRoute = async ({ params, url, cookies, redirect }) => {
  const { tipo, slug = '', archivo = '' } = params;
  const [, id, ext] = archivo.match(/^([a-z0-9-]+)\.([a-z]+)$/) ?? [];
  if (!id || !EXTENSIONES.includes(ext as Extension)) return new Response('No encontrado', { status: 404 });
  const rama = url.searchParams.get('rama');

  try {
    let fichero = null;
    let nombre = '';
    if (tipo === 'piezas') {
      const pieza = await leerPieza(cookies, rama, slug);
      if (pieza) fichero = await ficheroPieza(pieza, id, ext as Extension);
      nombre = `rm-gestion-${slug}-${id}.${ext}`;
    } else if (tipo === 'tarjetas') {
      const tarjeta = await leerTarjeta(cookies, rama, slug);
      if (tarjeta) fichero = await ficheroTarjeta(tarjeta, id as never, ext as Extension);
      nombre = `rm-gestion-tarjeta-${slug}${id === 'tarjeta' ? '' : `-${id}`}.${ext}`;
    }
    if (!fichero) return new Response('No encontrado', { status: 404 });

    return new Response(fichero.cuerpo as BodyInit, {
      headers: {
        'Content-Type': fichero.tipo,
        'Content-Disposition': `${url.searchParams.has('descargar') ? 'attachment' : 'inline'}; filename="${nombre}"`,
        // Es contenido en edición: nada de cachés compartidas.
        'Cache-Control': 'private, max-age=30',
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch (error) {
    if (error instanceof SinSesion) return redirect('/keystatic');
    throw error;
  }
};

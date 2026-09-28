import type { APIRoute } from 'astro';

import { EXTENSIONES, type Extension } from '../../../../lib/marca/formatos';
import { leerPieza, leerTarjeta, piezaDeBorrador, tarjetaDeBorrador, SinSesion } from '../../../../lib/marca/datos';
import { aSlug, decodificarBorrador } from '../../../../lib/marca/entradas';
import { ficheroPieza, ficheroTarjeta } from '../../../../lib/marca/generar';
import { ramaDe } from '../../../../lib/marca/rama';

/**
 * Un fichero de una pieza o de una tarjeta: `/marca/piezas/<slug>/<formato>.<ext>`
 * o `/marca/tarjetas/<slug>/<cara>.<ext>`.
 *
 * Se genera en cada petición. Con `?borrador=…` sale de lo que hay en el
 * editor, sin guardar (ver `src/lib/marca/entradas.ts`); sin él, de lo último
 * guardado (ver `src/lib/marca/datos.ts`). Con `?descargar` se sirve como
 * adjunto; sin él, en línea, que es como lo pinta el estudio.
 */
export const prerender = false;

export const GET: APIRoute = async ({ params, url, cookies, redirect }) => {
  const { tipo, slug = '', archivo = '' } = params;
  const [, id, ext] = archivo.match(/^([a-z0-9-]+)\.([a-z]+)$/) ?? [];
  if (!id || !EXTENSIONES.includes(ext as Extension)) return new Response('No encontrado', { status: 404 });
  const rama = ramaDe(url.searchParams.get('rama'));
  const codigo = url.searchParams.get('borrador');
  const borrador = codigo ? decodificarBorrador(codigo) : null;
  if (codigo && !borrador) return new Response('Borrador no válido', { status: 400 });

  try {
    let fichero = null;
    let nombre = slug;
    if (tipo === 'piezas') {
      const pieza = borrador ? await piezaDeBorrador(cookies, rama, borrador, slug) : await leerPieza(cookies, rama, slug);
      if (pieza) {
        fichero = await ficheroPieza(pieza, id, ext as Extension);
        nombre = `rm-gestion-${aSlug(pieza.nombre) || slug}-${id}.${ext}`;
      }
    } else if (tipo === 'tarjetas') {
      const tarjeta = borrador ? await tarjetaDeBorrador(cookies, borrador, slug) : await leerTarjeta(cookies, rama, slug);
      if (tarjeta) {
        fichero = await ficheroTarjeta(tarjeta, id as never, ext as Extension);
        nombre = `rm-gestion-tarjeta-${aSlug(tarjeta.nombre) || slug}${id === 'tarjeta' ? '' : `-${id}`}.${ext}`;
      }
    }
    if (!fichero) return new Response('No encontrado', { status: 404 });

    return new Response(fichero.cuerpo as BodyInit, {
      headers: {
        'Content-Type': fichero.tipo,
        'Content-Disposition': `${url.searchParams.has('descargar') ? 'attachment' : 'inline'}; filename="${nombre}"`,
        // Es contenido en edición: nada de cachés compartidas. Un borrador es
        // inmutable (la URL es su contenido), así que el navegador puede
        // guardarlo un rato y no volver a pedirlo al deshacer un cambio.
        'Cache-Control': borrador ? 'private, max-age=600' : 'private, max-age=30',
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch (error) {
    if (error instanceof SinSesion) return redirect(`/marca/entrar?volver=${encodeURIComponent(url.pathname + url.search)}`);
    throw error;
  }
};

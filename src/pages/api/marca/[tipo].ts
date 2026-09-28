import type { APIRoute } from 'astro';

import { SinSesion } from '../../../lib/marca/datos';
import { esTipo } from '../../../lib/marca/entradas';
import { Conflicto, eliminar, guardar } from '../../../lib/marca/escribir';
import { ramaDe } from '../../../lib/marca/rama';

/**
 * Guardar (POST) y borrar (DELETE) una pieza o una tarjeta desde el estudio.
 *
 *   POST   /api/marca/<tipo>   { rama, slug?, sha?, entrada }  →  { slug, sha }
 *   DELETE /api/marca/<tipo>   { rama, slug }
 *
 * Sin `slug`, el POST crea una entrada nueva. Ver `src/lib/marca/escribir.ts`.
 */
export const prerender = false;

const json = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

async function manejar(request: Request, tipo: unknown, accion: (cuerpo: Record<string, unknown>) => Promise<unknown>) {
  if (!esTipo(tipo)) return json({ error: 'No encontrado' }, 404);
  // Solo desde el propio estudio: además de la cookie SameSite, que la
  // petición venga de esta misma web.
  const origen = request.headers.get('origin');
  if (origen && origen !== new URL(request.url).origin) return json({ error: 'Origen no permitido' }, 403);

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'Petición no válida' }, 400);
  }

  try {
    return json((await accion(cuerpo)) ?? { ok: true });
  } catch (error) {
    if (error instanceof SinSesion) return json({ error: 'sin-sesion' }, 401);
    if (error instanceof Conflicto)
      return json({ error: 'Alguien ha cambiado esta entrada mientras la editabas. Recarga la página para ver su versión.' }, 409);
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'No se ha podido guardar.' }, 500);
  }
}

const texto = (v: unknown) => (typeof v === 'string' && v ? v : null);

export const POST: APIRoute = ({ request, params, cookies }) =>
  manejar(request, params.tipo, (c) =>
    guardar(cookies, ramaDe(c.rama), params.tipo as 'piezas', c.entrada, { slug: texto(c.slug), sha: texto(c.sha) }),
  );

export const DELETE: APIRoute = ({ request, params, cookies }) =>
  manejar(request, params.tipo, (c) => eliminar(cookies, ramaDe(c.rama), params.tipo as 'piezas', texto(c.slug) ?? ''));

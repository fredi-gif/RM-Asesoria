/**
 * Guardar y borrar entradas de marca desde el estudio de `/marca`.
 *
 * Escribe lo mismo que escribiría Keystatic, en el mismo sitio:
 * `src/content/marca/<tipo>/<slug>.json`.
 *
 *   - En local, en disco.
 *   - En producción, un commit en GitHub en la rama que se esté editando, con
 *     el token de la sesión del panel. Es el mismo permiso con el que guarda
 *     Keystatic: si alguien no puede guardar en el panel, tampoco aquí.
 */
import type { AstroCookies } from 'astro';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { REPO, SinSesion, olvidar, token } from './datos';
import { SLUG_VALIDO, aSlug, normalizar, type Entrada, type Tipo } from './entradas';

export class Conflicto extends Error {}

const ruta = (tipo: Tipo, slug: string) => `src/content/marca/${tipo}/${slug}.json`;

/** Como lo formatea Keystatic: dos espacios y salto de línea final. */
const serializar = (entrada: unknown) => `${JSON.stringify(entrada, null, 2)}\n`;

function base64(texto: string): string {
  return Buffer.from(texto, 'utf8').toString('base64');
}

async function github(t: string, metodo: string, path: string, cuerpo?: unknown) {
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${t}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(cuerpo ? { 'Content-Type': 'application/json' } : {}),
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  if (r.status === 401) throw new SinSesion();
  // 409: la rama se movió; 422: el sha que mandamos ya no es el del fichero.
  if (r.status === 409 || (r.status === 422 && metodo !== 'GET')) throw new Conflicto();
  return r;
}

/** El sha actual del fichero en la rama, o `null` si no existe. */
async function shaActual(t: string, path: string, rama: string | null): Promise<string | null> {
  const r = await github(t, 'GET', `${path}${rama ? `?ref=${encodeURIComponent(rama)}` : ''}`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GitHub respondió ${r.status} al leer ${path}`);
  const { sha } = (await r.json()) as { sha: string };
  return sha;
}

async function existe(t: string | null, path: string, rama: string | null): Promise<boolean> {
  if (!t) {
    try {
      await readFile(join(process.cwd(), path));
      return true;
    } catch {
      return false;
    }
  }
  return (await shaActual(t, path, rama)) !== null;
}

export interface Guardado {
  slug: string;
  /** El sha del fichero ya guardado, para encadenar guardados sin volver a leerlo. */
  sha: string | null;
}

/**
 * Guarda una entrada. Sin `slug`, la crea: el slug sale del nombre y, si ya
 * hay una entrada con ese slug, se le añade «-2», «-3»… en vez de pisarla.
 */
export async function guardar<T extends Tipo>(
  cookies: AstroCookies,
  rama: string | null,
  tipo: T,
  datos: unknown,
  opciones: { slug?: string | null; sha?: string | null } = {},
): Promise<Guardado> {
  const t = token(cookies);
  const entrada: Entrada<T> = normalizar(tipo, datos);
  if (!entrada.nombre) throw new Error('Falta el nombre.');

  let slug = opciones.slug ?? null;
  const creando = !slug;
  if (slug && !SLUG_VALIDO.test(slug)) throw new Error('Slug no válido.');
  if (!slug) {
    // «nueva» es la dirección del editor vacío: no puede ser el slug de nada.
    const base = aSlug(entrada.nombre) || (tipo === 'piezas' ? 'pieza' : 'tarjeta');
    const reservado = (s: string) => s === 'nueva';
    for (let n = 1; ; n++) {
      const candidato = n === 1 ? base : `${base}-${n}`;
      if (!reservado(candidato) && !(await existe(t, ruta(tipo, candidato), rama))) {
        slug = candidato;
        break;
      }
      if (n > 50) throw new Error('No hay un slug libre para ese nombre.');
    }
  }

  const path = ruta(tipo, slug);
  const contenido = serializar(entrada);

  if (!t) {
    await mkdir(dirname(join(process.cwd(), path)), { recursive: true });
    await writeFile(join(process.cwd(), path), contenido);
    olvidar();
    return { slug, sha: null };
  }

  const sha = creando ? null : (opciones.sha ?? (await shaActual(t, path, rama)));
  const r = await github(t, 'PUT', path, {
    message: `${creando ? 'Create' : 'Update'} ${path.replace(/\.json$/, '')}`,
    content: base64(contenido),
    ...(sha ? { sha } : {}),
    ...(rama ? { branch: rama } : {}),
  });
  if (!r.ok) throw new Error(`GitHub respondió ${r.status} al guardar: ${await r.text()}`);
  const { content } = (await r.json()) as { content: { sha: string } };
  olvidar();
  return { slug, sha: content.sha };
}

export async function eliminar(cookies: AstroCookies, rama: string | null, tipo: Tipo, slug: string): Promise<void> {
  if (!SLUG_VALIDO.test(slug)) throw new Error('Slug no válido.');
  const t = token(cookies);
  const path = ruta(tipo, slug);

  if (!t) {
    await rm(join(process.cwd(), path), { force: true });
    olvidar();
    return;
  }

  const sha = await shaActual(t, path, rama);
  if (sha) {
    const r = await github(t, 'DELETE', path, {
      message: `Delete ${path.replace(/\.json$/, '')}`,
      sha,
      ...(rama ? { branch: rama } : {}),
    });
    if (!r.ok) throw new Error(`GitHub respondió ${r.status} al borrar: ${await r.text()}`);
  }
  olvidar();
}

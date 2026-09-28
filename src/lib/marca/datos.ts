/**
 * De una entrada de marca a los datos que pintan las plantillas.
 *
 * Las piezas y las tarjetas se generan al vuelo, no en el build: quien edita
 * en el estudio (`/marca`) tiene que ver lo que acaba de escribir, no lo que
 * había en el último despliegue.
 *
 *   - En local se lee del disco, que es donde se guarda.
 *   - En producción se guarda en GitHub, así que se lee de GitHub, de la rama
 *     que esté editando, con el token de la propia sesión del panel (la cookie
 *     `keystatic-gh-access-token`). Eso de paso deja las páginas cerradas: sin
 *     sesión en el panel, no hay nada que ver.
 *
 * Mientras se edita, las imágenes no salen de lo guardado sino del borrador que
 * manda el editor en la URL (ver `entradas.ts`); lo único que se lee entonces
 * es el trámite de la plantilla «Trámite con precio».
 */
import type { AstroCookies } from 'astro';
import { createReader } from '@keystatic/core/reader';
import { createGitHubReader } from '@keystatic/core/reader/github';

import keystaticConfig from '../../../keystatic.config';
import home from '../../content/home/index.json';
import { empresa } from '../config';
import { euros } from '../format';
import { TEMA_POR_DEFECTO, TEMAS, type Tema } from '../tema';
import type { DatosEmpresa, DatosPieza, DatosTarjeta } from './plantillas';
import {
  normalizarPieza,
  normalizarTarjeta,
  normalizar,
  type Entrada,
  type EntradaPieza,
  type EntradaTarjeta,
  type Tipo,
} from './entradas';

/** El mismo repositorio que `storage` en `keystatic.config.ts`. */
export const REPO = 'fredi-gif/RM-Asesoria';

export class SinSesion extends Error {}

type Lector = ReturnType<typeof createReader<(typeof keystaticConfig)['collections'], (typeof keystaticConfig)['singletons']>>;

/** Un token caducado (duran unas horas) hace que GitHub responda 401. */
export const esFaltaDeSesion = (error: unknown) => /\b401\b|bad credentials/i.test(String(error));

/**
 * Caché de lecturas de un minuto, para los enlaces a lo guardado (sin
 * borrador): cada formato volvería a leer la misma entrada de GitHub; así se
 * lee una vez. También guarda los trámites de la plantilla «Trámite con
 * precio» y la comprobación de sesión. Al guardar desde el estudio se vacía
 * (`olvidar`).
 */
const cache = new Map<string, { hasta: number; valor: Promise<unknown> }>();
function cacheado<T>(clave: string, leer: () => Promise<T>, ms = 60_000): Promise<T> {
  const ahora = Date.now();
  const hit = cache.get(clave);
  if (hit && hit.hasta > ahora) return hit.valor as Promise<T>;
  // Se trata como falta de sesión, para mandar a entrar otra vez en el panel.
  const valor = leer().catch((error) => {
    if (esFaltaDeSesion(error)) throw new SinSesion();
    throw error;
  });
  cache.set(clave, { hasta: ahora + ms, valor });
  valor.catch(() => cache.delete(clave));
  return valor;
}

/** Tras guardar o borrar: que la siguiente lectura vaya a la fuente. */
export function olvidar() {
  for (const clave of cache.keys()) if (!clave.startsWith('sesion:')) cache.delete(clave);
}

/** El token de la sesión del panel, o `null` en local, donde no hace falta. */
export function token(cookies: AstroCookies): string | null {
  if (!import.meta.env.PROD) return null;
  const t = cookies.get('keystatic-gh-access-token')?.value;
  if (!t) throw new SinSesion();
  return t;
}

function lector(cookies: AstroCookies, rama: string | null): { lector: Lector; clave: string } {
  const t = token(cookies);
  if (!t) return { lector: createReader(process.cwd(), keystaticConfig) as Lector, clave: 'local' };
  return {
    lector: createGitHubReader(keystaticConfig, { repo: REPO, token: t, ref: rama || undefined }) as Lector,
    // El token entra en la clave: la caché no puede servir a una sesión lo que
    // leyó otra.
    clave: `${t.slice(-12)}:${rama ?? ''}`,
  };
}

/**
 * Comprueba que la cookie es de verdad una sesión con acceso al repositorio.
 * Hace falta para los borradores: generar una imagen no lee nada de GitHub y,
 * sin esto, bastaría una cookie inventada para poner a Satori a trabajar.
 */
export async function comprobarSesion(cookies: AstroCookies): Promise<void> {
  const t = token(cookies);
  if (!t) return;
  await cacheado(
    `sesion:${t.slice(-12)}`,
    async () => {
      const r = await fetch(`https://api.github.com/repos/${REPO}`, {
        headers: { Authorization: `Bearer ${t}`, Accept: 'application/vnd.github+json' },
      });
      if (r.status === 401 || r.status === 403 || r.status === 404) throw new SinSesion();
      if (!r.ok) throw new Error(`GitHub respondió ${r.status}`);
    },
    5 * 60_000,
  );
}

export const EMPRESA: DatosEmpresa = {
  name: empresa.name,
  url: empresa.url,
  telefono: empresa.telefono,
  whatsapp: empresa.whatsapp,
  email: empresa.email,
};

const tema = (v: unknown): Tema => (TEMAS.includes(v as Tema) ? (v as Tema) : TEMA_POR_DEFECTO);
const texto = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

// ---------------------------------------------------------------------------
// Entradas tal cual, para el estudio

/** Una entrada guardada, normalizada, o `null` si no existe. Sin caché: es lo que se va a editar. */
export async function leerEntrada<T extends Tipo>(
  cookies: AstroCookies,
  rama: string | null,
  tipo: T,
  slug: string,
): Promise<Entrada<T> | null> {
  const { lector: l } = lector(cookies, rama);
  try {
    const entrada = await (l.collections[tipo] as Lector['collections']['piezas']).read(slug);
    return entrada ? normalizar(tipo, entrada) : null;
  } catch (error) {
    if (esFaltaDeSesion(error)) throw new SinSesion();
    throw error;
  }
}

/** Sin caché: es lo primero que se ve al volver de guardar, y tiene que estar al día. */
export async function listarEntradas<T extends Tipo>(
  cookies: AstroCookies,
  rama: string | null,
  tipo: T,
): Promise<{ slug: string; entrada: Entrada<T> }[]> {
  const { lector: l } = lector(cookies, rama);
  try {
    const todas = await (l.collections[tipo] as Lector['collections']['piezas']).all();
    return todas
      .map(({ slug, entry }) => ({ slug, entrada: normalizar(tipo, entry) }))
      .sort((a, b) => (a.entrada.nombre || a.slug).localeCompare(b.entrada.nombre || b.slug, 'es'));
  } catch (error) {
    if (esFaltaDeSesion(error)) throw new SinSesion();
    throw error;
  }
}

// ---------------------------------------------------------------------------
// De la entrada a lo que pintan las plantillas

export interface Pieza {
  nombre: string;
  datos: DatosPieza;
}

async function piezaDesde(cookies: AstroCookies, rama: string | null, entrada: EntradaPieza, slug: string): Promise<Pieza> {
  const { discriminant: plantilla, value } = entrada.plantilla;
  const v = value as Partial<Record<'antetitulo' | 'titular' | 'texto' | 'tramite', string>> & {
    puntos?: string[];
    mostrarPrecio?: boolean;
    mostrarPlazo?: boolean;
  };

  const datos: DatosPieza = {
    tema: tema(entrada.tema),
    plantilla,
    antetitulo: texto(v.antetitulo),
    titular: texto(v.titular),
    texto: texto(v.texto),
    puntos: (v.puntos ?? []).map(texto).filter(Boolean),
    boton: texto(entrada.boton),
    pie: entrada.pie,
    silueta: entrada.silueta,
  };

  if (plantilla === 'marca') {
    datos.titular ||= texto(home.hero.claim);
  }

  if (plantilla === 'tramite') {
    const slugTramite = texto(v.tramite);
    const { lector: l, clave } = lector(cookies, rama);
    const tramite = slugTramite
      ? await cacheado(`tramite:${clave}:${slugTramite}`, () => l.collections.tramites.read(slugTramite))
      : null;
    if (tramite) {
      const precio = tramite.precio;
      const total = Math.round(((precio.honorarios ?? 0) + (precio.tasaDgt ?? 0)) * 100) / 100;
      datos.titular ||= texto(tramite.hero.claim) || texto(tramite.title);
      datos.texto ||= texto(tramite.summary);
      datos.antetitulo ||= 'Trámite online';
      datos.tramite = {
        icono: texto(tramite.icon) || 'documento',
        precio: v.mostrarPrecio !== false && total > 0 ? `${precio.mostrarDesde ? 'Desde ' : ''}${euros(total)}` : undefined,
        plazo: v.mostrarPlazo !== false ? texto(tramite.hero.plazo) || undefined : undefined,
      };
    }
  }

  return { nombre: texto(entrada.nombre) || slug, datos };
}

export async function leerPieza(cookies: AstroCookies, rama: string | null, slug: string): Promise<Pieza | null> {
  const { lector: l, clave } = lector(cookies, rama);
  const entrada = await cacheado(`pieza:${clave}:${slug}`, () => l.collections.piezas.read(slug));
  return entrada ? piezaDesde(cookies, rama, normalizarPieza(entrada), slug) : null;
}

/** La pieza tal como está en el editor, sin guardar. */
export async function piezaDeBorrador(cookies: AstroCookies, rama: string | null, borrador: unknown, slug: string): Promise<Pieza> {
  await comprobarSesion(cookies);
  return piezaDesde(cookies, rama, normalizarPieza(borrador), slug);
}

export interface Tarjeta {
  nombre: string;
  datos: DatosTarjeta;
}

function tarjetaDesde(entrada: EntradaTarjeta, slug: string): Tarjeta {
  const nombre = texto(entrada.nombre) || slug;
  return {
    nombre,
    datos: {
      nombre,
      cargo: texto(entrada.cargo),
      telefono: texto(entrada.telefono) || empresa.telefono,
      email: texto(entrada.email) || empresa.email,
      whatsapp: entrada.whatsapp,
      web: entrada.web,
      qr: entrada.qr,
      tema: tema(entrada.tema),
    },
  };
}

export async function leerTarjeta(cookies: AstroCookies, rama: string | null, slug: string): Promise<Tarjeta | null> {
  const { lector: l, clave } = lector(cookies, rama);
  const entrada = await cacheado(`tarjeta:${clave}:${slug}`, () => l.collections.tarjetas.read(slug));
  return entrada ? tarjetaDesde(normalizarTarjeta(entrada), slug) : null;
}

export async function tarjetaDeBorrador(cookies: AstroCookies, borrador: unknown, slug: string): Promise<Tarjeta> {
  await comprobarSesion(cookies);
  return tarjetaDesde(normalizarTarjeta(borrador), slug);
}

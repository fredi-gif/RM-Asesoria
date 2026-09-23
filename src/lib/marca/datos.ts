/**
 * De una entrada de Keystatic a los datos que pintan las plantillas.
 *
 * Las piezas y las tarjetas se generan al vuelo, no en el build: quien edita
 * en el panel pulsa «Vista previa» y tiene que ver lo que acaba de guardar,
 * no lo que había en el último despliegue.
 *
 *   - En local se lee del disco, que es donde escribe Keystatic.
 *   - En producción Keystatic guarda en GitHub, así que se lee de GitHub, de
 *     la rama que esté editando, con el token de la propia sesión del panel
 *     (la cookie `keystatic-gh-access-token`). Eso de paso deja las páginas
 *     cerradas: sin sesión en el panel, no hay nada que ver.
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
import { PLANTILLAS, type Plantilla } from './opciones';

/** El mismo repositorio que `storage` en `keystatic.config.ts`. */
const REPO = 'fredi-gif/RM-Asesoria';

export class SinSesion extends Error {}

type Lector = ReturnType<typeof createReader<(typeof keystaticConfig)['collections'], (typeof keystaticConfig)['singletons']>>;

/**
 * Caché de lecturas de un minuto. La galería pide una imagen por formato y
 * cada una volvería a leer la misma entrada de GitHub; así se lee una vez.
 */
const cache = new Map<string, { hasta: number; valor: Promise<unknown> }>();
function cacheado<T>(clave: string, leer: () => Promise<T>): Promise<T> {
  const ahora = Date.now();
  const hit = cache.get(clave);
  if (hit && hit.hasta > ahora) return hit.valor as Promise<T>;
  // Un token caducado (duran unas horas) hace que GitHub responda 401: se
  // trata como falta de sesión, para mandar a entrar otra vez en el panel.
  const valor = leer().catch((error) => {
    if (/\b401\b|bad credentials/i.test(String(error))) throw new SinSesion();
    throw error;
  });
  cache.set(clave, { hasta: ahora + 60_000, valor });
  valor.catch(() => cache.delete(clave));
  return valor;
}

function lector(cookies: AstroCookies, rama: string | null): { lector: Lector; clave: string } {
  if (!import.meta.env.PROD) {
    return { lector: createReader(process.cwd(), keystaticConfig) as Lector, clave: 'local' };
  }
  const token = cookies.get('keystatic-gh-access-token')?.value;
  if (!token) throw new SinSesion();
  return {
    lector: createGitHubReader(keystaticConfig, { repo: REPO, token, ref: rama || undefined }) as Lector,
    // El token entra en la clave: la caché no puede servir a una sesión lo que
    // leyó otra.
    clave: `${token.slice(-12)}:${rama ?? ''}`,
  };
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

export interface Pieza {
  nombre: string;
  datos: DatosPieza;
}

export async function leerPieza(cookies: AstroCookies, rama: string | null, slug: string): Promise<Pieza | null> {
  const { lector: l, clave } = lector(cookies, rama);
  return cacheado(`pieza:${clave}:${slug}`, async () => {
    const entrada = await l.collections.piezas.read(slug);
    if (!entrada) return null;

    const { discriminant, value } = entrada.plantilla as { discriminant: string; value: Record<string, unknown> };
    const plantilla: Plantilla = PLANTILLAS.some((p) => p.value === discriminant) ? (discriminant as Plantilla) : 'titular';

    const datos: DatosPieza = {
      tema: tema(entrada.tema),
      plantilla,
      antetitulo: texto(value.antetitulo),
      titular: texto(value.titular),
      texto: texto(value.texto),
      puntos: Array.isArray(value.puntos) ? value.puntos.map(texto).filter(Boolean) : [],
      boton: texto(entrada.boton),
      pie: (['ambos', 'web', 'whatsapp', 'nada'] as const).find((p) => p === entrada.pie) ?? 'ambos',
      silueta: entrada.silueta !== false,
    };

    if (plantilla === 'marca') {
      datos.titular ||= texto(home.hero.claim);
    }

    if (plantilla === 'tramite') {
      const slugTramite = texto(value.tramite);
      const tramite = slugTramite ? await l.collections.tramites.read(slugTramite) : null;
      if (tramite) {
        const precio = tramite.precio;
        const total = Math.round(((precio.honorarios ?? 0) + (precio.tasaDgt ?? 0)) * 100) / 100;
        datos.titular ||= texto(tramite.hero.claim) || texto(tramite.title);
        datos.texto ||= texto(tramite.summary);
        datos.antetitulo ||= 'Trámite online';
        datos.tramite = {
          icono: texto(tramite.icon) || 'documento',
          precio: value.mostrarPrecio !== false && total > 0 ? `${precio.mostrarDesde ? 'Desde ' : ''}${euros(total)}` : undefined,
          plazo: value.mostrarPlazo !== false ? texto(tramite.hero.plazo) || undefined : undefined,
        };
      }
    }

    return { nombre: texto(entrada.nombre) || slug, datos };
  });
}

export interface Tarjeta {
  nombre: string;
  datos: DatosTarjeta;
}

export async function leerTarjeta(cookies: AstroCookies, rama: string | null, slug: string): Promise<Tarjeta | null> {
  const { lector: l, clave } = lector(cookies, rama);
  return cacheado(`tarjeta:${clave}:${slug}`, async () => {
    const entrada = await l.collections.tarjetas.read(slug);
    if (!entrada) return null;
    const nombre = texto(entrada.nombre) || slug;
    return {
      nombre,
      datos: {
        nombre,
        cargo: texto(entrada.cargo),
        telefono: texto(entrada.telefono) || empresa.telefono,
        email: texto(entrada.email) || empresa.email,
        whatsapp: entrada.whatsapp !== false,
        web: entrada.web !== false,
        qr: (['ninguno', 'web', 'whatsapp'] as const).find((q) => q === entrada.qr) ?? 'whatsapp',
        tema: tema(entrada.tema),
      },
    };
  });
}

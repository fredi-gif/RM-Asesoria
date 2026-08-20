import { getCollection, type CollectionEntry } from 'astro:content';

export type Tramite = CollectionEntry<'tramites'>;

/** Ordena por destacado, luego por el campo `orden`, luego alfabéticamente. */
function comparar(a: Tramite, b: Tramite): number {
  if (a.data.destacado !== b.data.destacado) return a.data.destacado ? -1 : 1;
  if (a.data.orden !== b.data.orden) return a.data.orden - b.data.orden;
  return a.data.shortTitle.localeCompare(b.data.shortTitle, 'es');
}

/**
 * Todos los trámites publicados, ya ordenados.
 *
 * No hay agrupación por categoría: el catálogo se presenta como una única
 * rejilla en la home y en el menú.
 *
 * Los borradores solo se ocultan al construir para producción. En local se
 * siguen viendo todos, que es lo que permite repasar un trámite a medias antes
 * de darlo por bueno. Como esta función es la única puerta a la colección, el
 * filtro alcanza de una vez a la home, al menú, al pie, al 404, a /faqs y a las
 * rutas que se generan.
 */
export async function getTramites(): Promise<Tramite[]> {
  const tramites = await getCollection('tramites');
  const publicados = import.meta.env.PROD
    ? tramites.filter((tramite) => tramite.data.estado === 'revisado')
    : tramites;
  return publicados.sort(comparar);
}

/** URL pública de un trámite. */
export function tramiteHref(tramite: Tramite): string {
  return `/tramites/${tramite.id}`;
}

/**
 * Total orientativo: honorarios (con IVA) + tasa DGT (sin IVA).
 * Los conceptos variables (ITP, por ejemplo) quedan fuera a propósito — por eso
 * el total se presenta como «desde».
 *
 * Se redondea a céntimos porque sumar decimales en coma flotante puede dejar
 * restos del tipo 197.00000000000003, y este número acaba tal cual en el
 * `price` del JSON-LD.
 */
export function totalTramite(precio: Tramite['data']['precio']): number {
  return Math.round((precio.honorarios + (precio.tasaDgt ?? 0)) * 100) / 100;
}

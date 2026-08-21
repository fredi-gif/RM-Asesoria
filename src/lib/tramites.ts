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
export function totalTramite(
  precio: Tramite['data']['precio'],
  perfil: Perfil = PERFIL_POR_DEFECTO,
): number {
  return Math.round((honorariosPerfil(precio, perfil) + (precio.tasaDgt ?? 0)) * 100) / 100;
}

/**
 * Perfiles de precio.
 *
 * El mismo trámite se factura distinto a un particular que a un profesional
 * (compraventas, concesionarios, flotas), y la home permite alternar entre uno
 * y otro. Lo que cambia son los honorarios: la tasa de la DGT es un tributo y
 * vale igual para todos.
 *
 * El particular es el perfil por defecto en todas partes —es el tráfico
 * mayoritario y el que llega desde buscadores— y el profesional se activa desde
 * el selector, que recuerda la elección en el navegador.
 */
export const PERFILES = ['particular', 'profesional'] as const;
export type Perfil = (typeof PERFILES)[number];

export const PERFIL_POR_DEFECTO: Perfil = 'particular';

/** Etiquetas del selector y de los textos que acompañan al precio. */
export const ETIQUETA_PERFIL: Record<Perfil, string> = {
  particular: 'Particulares',
  profesional: 'Profesionales',
};

/**
 * Honorarios del perfil pedido.
 *
 * Si el trámite no tiene tarifa de profesional, se cobra la de particular: un
 * campo vacío en el panel significa «aquí no hay precio especial», no un cero.
 */
export function honorariosPerfil(precio: Tramite['data']['precio'], perfil: Perfil): number {
  if (perfil === 'profesional' && precio.honorariosProfesional !== null) {
    return precio.honorariosProfesional;
  }
  return precio.honorarios;
}

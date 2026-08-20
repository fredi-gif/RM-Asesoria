import navegacion from '../content/navegacion/index.json';

/**
 * Menú, pie de página e insignias de confianza, editables desde Keystatic.
 *
 * Mismo planteamiento que `empresa` en `src/lib/config.ts`: aquí está la red de
 * seguridad, no en los componentes. Un guardado desde el panel puede dejar
 * cualquiera de estas listas vacía o ausente —ya ocurrió una vez y tumbó el
 * build de producción entero—, así que todo se normaliza en este único sitio y
 * Header y Footer reciben siempre arrays con la forma esperada.
 *
 * Una lista vacía es una respuesta legítima: significa «no quiero ese bloque».
 * Lo que no puede pasar es que llegue `undefined` a un `.map()`.
 */
export interface Enlace {
  etiqueta: string;
  enlace: string;
}

export interface Insignia {
  icono: string;
  texto: string;
}

/** Descarta las entradas a medias: sin texto o sin destino no se pueden pintar. */
function enlaces(lista: unknown): Enlace[] {
  if (!Array.isArray(lista)) return [];
  return lista.filter(
    (item): item is Enlace =>
      Boolean(item) && Boolean((item as Enlace).etiqueta) && Boolean((item as Enlace).enlace),
  );
}

function insignias(lista: unknown): Insignia[] {
  if (!Array.isArray(lista)) return [];
  return lista.filter((item): item is Insignia => Boolean(item) && Boolean((item as Insignia).texto));
}

/** Páginas fijas del menú principal, aparte del desplegable de trámites. */
export const menu = enlaces(navegacion?.menu);

/** Columna «La web» del pie. */
export const pie = enlaces(navegacion?.pie);

/** Columna «Legal» del pie. */
export const legales = enlaces(navegacion?.legales);

/** Franja «Seguridad y confianza» del pie. */
export const confianza = insignias(navegacion?.confianza);

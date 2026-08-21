import home from '../content/home/index.json';

/**
 * Tema visual de la cabecera de la home.
 *
 * Las dos variantes comparten estructura —barra de navegación integrada, sin
 * fondo propio, sobre un hero con reja de líneas y grano— y se diferencian en
 * el color: una va sobre azul de marca calentado hacia el naranja y la otra
 * sobre un crema de papel.
 *
 * Los valores viven aquí y no en los componentes porque los reparten dos
 * sitios distintos: el `data-tema` del <html>, que alimenta las variables CSS
 * de `global.css`, y la cabecera, que necesita saber si pinta sobre claro o
 * sobre oscuro para elegir el color del texto.
 *
 * Misma red de seguridad que `empresa` o `menu`: un guardado desde el panel
 * puede dejar el campo vacío o con un valor viejo, y eso no puede tumbar el
 * build ni publicar una home sin fondo.
 */
export const TEMAS = ['atardecer', 'crema'] as const;
export type Tema = (typeof TEMAS)[number];

export const TEMA_POR_DEFECTO: Tema = 'atardecer';

/**
 * Lo único que necesitan los componentes: si el fondo es oscuro. De ahí salen
 * el color del texto, el de las burbujas de logos y el de la franja de
 * ventajas. El resto de valores del tema son color puro y viven en el CSS.
 */
export const TEMA_OSCURO: Record<Tema, boolean> = {
  atardecer: true,
  crema: false,
};

function normalizar(valor: unknown): Tema {
  return TEMAS.includes(valor as Tema) ? (valor as Tema) : TEMA_POR_DEFECTO;
}

/** Tema elegido en el panel. */
export const tema: Tema = normalizar((home as { tema?: unknown }).tema);

/** `true` cuando la cabecera va sobre un fondo oscuro. */
export const temaOscuro: boolean = TEMA_OSCURO[tema];

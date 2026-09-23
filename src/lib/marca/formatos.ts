/**
 * Catálogo de formatos de la imagen de marca.
 *
 * Cada formato es un lienzo con su tamaño de exportación y su **zona segura**:
 * el recuadro que la red no tapa nunca con su interfaz (la foto de perfil en
 * las portadas, los botones de las historias, el recorte del móvil en el
 * banner de YouTube…). Las plantillas colocan el contenido dentro de esa zona
 * y dejan que el fondo llegue a sangre por fuera.
 *
 * Los tamaños son los que recomienda cada plataforma a fecha de 2026. Si alguna
 * cambia, este archivo es el único que hay que tocar: la plantilla se adapta a
 * la proporción que tenga el lienzo.
 */

export type Red = 'instagram' | 'whatsapp' | 'linkedin' | 'facebook' | 'youtube';

/**
 * - `pieza`: publicación, historia o portada. Lleva el contenido de la pieza.
 * - `perfil`: avatar. Sólo el símbolo, porque la red lo recorta en círculo y
 *   lo pinta a 40 px, donde no se lee ningún texto.
 */
export type TipoFormato = 'pieza' | 'perfil';

export interface Formato {
  id: string;
  red: Red;
  nombre: string;
  tipo: TipoFormato;
  ancho: number;
  alto: number;
  /** Márgenes de la zona segura, en px del lienzo. */
  seguro: { arriba: number; derecha: number; abajo: number; izquierda: number };
  nota?: string;
}

const SIN_RECORTE = { arriba: 0, derecha: 0, abajo: 0, izquierda: 0 };

export const REDES: { id: Red; nombre: string }[] = [
  { id: 'instagram', nombre: 'Instagram' },
  { id: 'whatsapp', nombre: 'WhatsApp' },
  { id: 'linkedin', nombre: 'LinkedIn' },
  { id: 'facebook', nombre: 'Facebook' },
  { id: 'youtube', nombre: 'YouTube' },
];

export const FORMATOS: Formato[] = [
  // --- Instagram ---
  {
    id: 'instagram-post',
    red: 'instagram',
    nombre: 'Publicación cuadrada',
    tipo: 'pieza',
    ancho: 1080,
    alto: 1080,
    seguro: SIN_RECORTE,
  },
  {
    id: 'instagram-vertical',
    red: 'instagram',
    nombre: 'Publicación vertical (4:5)',
    tipo: 'pieza',
    ancho: 1080,
    alto: 1350,
    seguro: SIN_RECORTE,
    nota: 'La rejilla del perfil la recorta a 3:4 por los lados; el margen de la plantilla ya lo cubre.',
  },
  {
    id: 'instagram-historia',
    red: 'instagram',
    nombre: 'Historia y portada de reel',
    tipo: 'pieza',
    ancho: 1080,
    alto: 1920,
    // Arriba, la barra de progreso y el nombre; abajo, el campo de respuesta.
    seguro: { arriba: 250, derecha: 0, abajo: 340, izquierda: 0 },
  },
  {
    id: 'instagram-perfil',
    red: 'instagram',
    nombre: 'Foto de perfil',
    tipo: 'perfil',
    ancho: 320,
    alto: 320,
    seguro: SIN_RECORTE,
  },

  // --- WhatsApp ---
  {
    id: 'whatsapp-estado',
    red: 'whatsapp',
    nombre: 'Estado',
    tipo: 'pieza',
    ancho: 1080,
    alto: 1920,
    seguro: { arriba: 220, derecha: 0, abajo: 260, izquierda: 0 },
  },
  {
    id: 'whatsapp-imagen',
    red: 'whatsapp',
    nombre: 'Imagen para chats y catálogo',
    tipo: 'pieza',
    ancho: 1080,
    alto: 1080,
    seguro: SIN_RECORTE,
  },
  {
    id: 'whatsapp-perfil',
    red: 'whatsapp',
    nombre: 'Foto de perfil (Business)',
    tipo: 'perfil',
    ancho: 640,
    alto: 640,
    seguro: SIN_RECORTE,
  },

  // --- LinkedIn ---
  {
    id: 'linkedin-post',
    red: 'linkedin',
    nombre: 'Publicación horizontal',
    tipo: 'pieza',
    ancho: 1200,
    alto: 627,
    seguro: SIN_RECORTE,
  },
  {
    id: 'linkedin-cuadrado',
    red: 'linkedin',
    nombre: 'Publicación cuadrada',
    tipo: 'pieza',
    ancho: 1200,
    alto: 1200,
    seguro: SIN_RECORTE,
  },
  {
    id: 'linkedin-vertical',
    red: 'linkedin',
    nombre: 'Publicación vertical (4:5)',
    tipo: 'pieza',
    ancho: 1080,
    alto: 1350,
    seguro: SIN_RECORTE,
  },
  {
    id: 'linkedin-portada-perfil',
    red: 'linkedin',
    nombre: 'Portada de perfil personal',
    tipo: 'pieza',
    ancho: 1584,
    alto: 396,
    // La foto de perfil se monta sobre el tercio izquierdo, por abajo.
    seguro: { arriba: 40, derecha: 60, abajo: 40, izquierda: 520 },
  },
  {
    id: 'linkedin-portada-empresa',
    red: 'linkedin',
    nombre: 'Portada de página de empresa',
    tipo: 'pieza',
    ancho: 1128,
    alto: 191,
    seguro: { arriba: 20, derecha: 40, abajo: 20, izquierda: 40 },
  },
  {
    id: 'linkedin-logo',
    red: 'linkedin',
    nombre: 'Logo de página de empresa',
    tipo: 'perfil',
    ancho: 400,
    alto: 400,
    seguro: SIN_RECORTE,
  },

  // --- Facebook ---
  {
    id: 'facebook-post',
    red: 'facebook',
    nombre: 'Publicación horizontal',
    tipo: 'pieza',
    ancho: 1200,
    alto: 630,
    seguro: SIN_RECORTE,
  },
  {
    id: 'facebook-vertical',
    red: 'facebook',
    nombre: 'Publicación vertical (4:5)',
    tipo: 'pieza',
    ancho: 1080,
    alto: 1350,
    seguro: SIN_RECORTE,
  },
  {
    id: 'facebook-historia',
    red: 'facebook',
    nombre: 'Historia',
    tipo: 'pieza',
    ancho: 1080,
    alto: 1920,
    seguro: { arriba: 250, derecha: 0, abajo: 300, izquierda: 0 },
  },
  {
    id: 'facebook-portada',
    red: 'facebook',
    nombre: 'Portada de página',
    tipo: 'pieza',
    ancho: 1640,
    alto: 624,
    // El móvil recorta los laterales y el escritorio monta la foto de perfil
    // abajo a la izquierda.
    seguro: { arriba: 60, derecha: 200, abajo: 90, izquierda: 200 },
  },
  {
    id: 'facebook-evento',
    red: 'facebook',
    nombre: 'Portada de evento',
    tipo: 'pieza',
    ancho: 1920,
    alto: 1005,
    seguro: SIN_RECORTE,
  },
  {
    id: 'facebook-perfil',
    red: 'facebook',
    nombre: 'Foto de perfil',
    tipo: 'perfil',
    ancho: 720,
    alto: 720,
    seguro: SIN_RECORTE,
  },

  // --- YouTube ---
  {
    id: 'youtube-miniatura',
    red: 'youtube',
    nombre: 'Miniatura de vídeo',
    tipo: 'pieza',
    ancho: 1280,
    alto: 720,
    // Abajo a la derecha YouTube superpone la duración del vídeo.
    seguro: { arriba: 0, derecha: 0, abajo: 40, izquierda: 0 },
  },
  {
    id: 'youtube-banner',
    red: 'youtube',
    nombre: 'Banner del canal',
    tipo: 'pieza',
    ancho: 2560,
    alto: 1440,
    // Sólo el recuadro central de 1546 × 423 se ve en todos los dispositivos.
    seguro: { arriba: 508, derecha: 507, abajo: 509, izquierda: 507 },
    nota: 'Sólo la franja central se ve en móvil y escritorio; el resto aparece en la tele.',
  },
  {
    id: 'youtube-perfil',
    red: 'youtube',
    nombre: 'Foto de perfil',
    tipo: 'perfil',
    ancho: 800,
    alto: 800,
    seguro: SIN_RECORTE,
  },
  {
    id: 'youtube-marca-agua',
    red: 'youtube',
    nombre: 'Marca de agua de vídeo',
    tipo: 'perfil',
    ancho: 150,
    alto: 150,
    seguro: SIN_RECORTE,
  },
];

export function formato(id: string): Formato | undefined {
  return FORMATOS.find((f) => f.id === id);
}

/**
 * Tarjeta de visita.
 *
 * Tamaño estándar en España (85 × 55 mm) más 3 mm de sangrado por cada lado,
 * que es lo que piden las imprentas: el fondo tiene que pasarse del corte para
 * que no quede un filete blanco si la guillotina se desvía. El contenido se
 * queda a 4 mm del corte como mínimo.
 */
export const TARJETA = {
  corteMm: { ancho: 85, alto: 55 },
  sangradoMm: 3,
  margenMm: 4,
  /**
   * Resolución del lienzo: 12 px por milímetro. Es sólo la unidad de trabajo
   * de la plantilla; el SVG y el PDF son vectoriales y el PNG se exporta a
   * 300 ppp, que es lo que exige la imprenta.
   */
  pxPorMm: 12,
} as const;

export const TARJETA_PX = {
  ancho: (TARJETA.corteMm.ancho + TARJETA.sangradoMm * 2) * TARJETA.pxPorMm,
  alto: (TARJETA.corteMm.alto + TARJETA.sangradoMm * 2) * TARJETA.pxPorMm,
  sangrado: TARJETA.sangradoMm * TARJETA.pxPorMm,
  margen: (TARJETA.sangradoMm + TARJETA.margenMm) * TARJETA.pxPorMm,
};

export const CARAS = [
  { id: 'anverso', nombre: 'Anverso' },
  { id: 'reverso', nombre: 'Reverso' },
] as const;
export type Cara = (typeof CARAS)[number]['id'];

/** Formatos de descarga. */
export const EXTENSIONES = ['png', 'jpg', 'svg', 'pdf'] as const;
export type Extension = (typeof EXTENSIONES)[number];

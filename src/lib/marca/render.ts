/**
 * Del diseño a los ficheros descargables.
 *
 * Todo sale de un único SVG por lienzo:
 *
 *   - **SVG**: el fondo de marca (`fondo.ts`) más la maqueta de Satori, con el
 *     texto ya convertido en trazados. Se abre igual en cualquier programa
 *     aunque no tenga instaladas las fuentes de la marca.
 *   - **PNG / JPG**: ese SVG rasterizado con sharp, a tamaño real (o a 300 ppp
 *     en la tarjeta de visita).
 *   - **PDF**: ese SVG dibujado como vectores con PDFKit, sin grano (es un
 *     filtro y el PDF no lo admite). Varias caras = varias páginas.
 */
import { Children, cloneElement, isValidElement, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import satori from 'satori';
import sharp from 'sharp';
import PDFDocument from 'pdfkit';
import SVGtoPDF from 'svg-to-pdfkit';

import { fuentes } from './fuentes';
import { fondo, type OpcionesFondo } from './fondo';

export interface Lienzo {
  ancho: number;
  alto: number;
  /** Maqueta del contenido para Satori. Va sobre fondo transparente. */
  contenido: ReactNode;
  /** Fondo de marca. Si se omite, el lienzo es transparente. */
  fondo?: Omit<OpcionesFondo, 'ancho' | 'alto' | 'grano'>;
  /** SVG suelto que se pinta entre el fondo y el contenido. */
  decoracion?: string;
  /** La salida de Satori, si ya se maquetó (ver `ajustar`). */
  maqueta?: string;
}

/**
 * Satori mete cada `<img>` como una `<image>` con el SVG en base64. Eso se
 * rasteriza bien, pero PDFKit sólo sabe pintar PNG y JPG dentro de un
 * `<image>`, y un editor como Illustrator no deja tocar lo que hay dentro. Se
 * despliegan como `<svg>` anidados: siguen siendo vectores en todas partes.
 */
function desplegarImagenes(svg: string): string {
  return svg.replace(/<image\b([^>]*?)href="data:image\/svg\+xml;base64,([^"]+)"([^>]*)\/>/g, (_, a, b64, b) => {
    const attrs = `${a} ${b}`;
    const valor = (nombre: string) => attrs.match(new RegExp(`\\b${nombre}="([^"]*)"`))?.[1];
    const interior = Buffer.from(b64, 'base64').toString('utf8');
    const apertura = interior.match(/<svg\b([^>]*)>/);
    if (!apertura) return '';
    const viewBox =
      apertura[1].match(/viewBox="([^"]*)"/)?.[1] ??
      `0 0 ${apertura[1].match(/width="([\d.]+)"/)?.[1] ?? 100} ${apertura[1].match(/height="([\d.]+)"/)?.[1] ?? 100}`;
    // Conserva los atributos de presentación del SVG de origen (el trazo de
    // los iconos va en la raíz) y sustituye la caja por la de la maqueta.
    const presentacion = apertura[1]
      .replace(/\s(xmlns|width|height|viewBox|x|y)="[^"]*"/g, '')
      .trim();
    const cuerpo = interior.slice(apertura.index! + apertura[0].length, interior.lastIndexOf('</svg>'));
    return (
      `<svg x="${valor('x')}" y="${valor('y')}" width="${valor('width')}" height="${valor('height')}" ` +
      `viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet" ${presentacion}>${cuerpo}</svg>`
    );
  });
}

/**
 * Ninguna caja puede encogerse por debajo de su contenido.
 *
 * Satori aplica el `flex-shrink: 1` de CSS: cuando el contenido no cabe,
 * aplasta las cajas y el texto se desborda por encima del bloque siguiente
 * (el botón acaba montado sobre el último punto de una lista). Con todo a 0,
 * lo que sobra asoma por el borde del contenedor, y eso `desborda` lo ve.
 */
function sinEncoger(nodo: ReactNode): ReactNode {
  if (Array.isArray(nodo)) return nodo.map(sinEncoger);
  if (!isValidElement(nodo) || typeof nodo.type !== 'string') return nodo;
  const el = nodo as ReactElement<{ style?: CSSProperties; children?: ReactNode }>;
  const hijos = el.props.children;
  return cloneElement(
    el,
    { style: { flexShrink: 0, ...el.props.style } },
    ...(hijos === undefined ? [] : Children.toArray(hijos).map(sinEncoger)),
  );
}

async function maquetar(lienzo: Lienzo): Promise<string> {
  return satori(sinEncoger(lienzo.contenido) as never, {
    width: lienzo.ancho,
    height: lienzo.alto,
    fonts: fuentes(),
  });
}

/**
 * ¿Algún elemento se sale de la caja que lo contiene?
 *
 * Satori deja en el SVG, para cada elemento, una máscara con su caja
 * (`satori_om-id-1-3-0` es el primer hijo del cuarto hijo del segundo hijo de
 * la raíz). Basta comparar cada caja con la de su padre.
 */
export function desborda(maqueta: string): boolean {
  const cajas = new Map<string, number[]>();
  for (const m of maqueta.matchAll(
    /<mask id="satori_om-(id[-\d]*)"><rect x="([-\d.]+)" y="([-\d.]+)" width="([-\d.]+)" height="([-\d.]+)"/g,
  )) {
    cajas.set(m[1], m.slice(2, 6).map(Number));
  }
  const tolerancia = 1;
  for (const [id, [x, y, w, h]] of cajas) {
    const padre = cajas.get(id.replace(/-\d+$/, ''));
    if (!padre || id === 'id') continue;
    const [px, py, pw, ph] = padre;
    if (x < px - tolerancia || y < py - tolerancia || x + w > px + pw + tolerancia || y + h > py + ph + tolerancia) {
      return true;
    }
  }
  return false;
}

/**
 * Maqueta a la mayor escala (hasta 1) en la que todo cabe.
 *
 * Los cuerpos de letra se estiman antes de maquetar; con textos largos la
 * estimación se queda corta. Aquí se comprueba de verdad y, si algo se sale,
 * se reduce todo el texto un 8 % y se vuelve a probar. Un titular corto no
 * se toca; uno largo baja lo justo para caber.
 */
export async function ajustar(crear: (escala: number) => Lienzo | Promise<Lienzo>): Promise<Lienzo> {
  let escala = 1;
  for (let intento = 0; ; intento++) {
    const lienzo = await crear(escala);
    const maqueta = await maquetar(lienzo);
    const cabe = !desborda(maqueta);
    if (cabe || intento >= 12) {
      if (!cabe) console.warn(`[marca] La maqueta de ${lienzo.ancho}×${lienzo.alto} no cabe ni al ${Math.round(escala * 100)} %`);
      return { ...lienzo, maqueta };
    }
    escala *= 0.92;
  }
}

export async function aSvg(lienzo: Lienzo, { grano = true } = {}): Promise<string> {
  const { ancho, alto } = lienzo;
  const maqueta = lienzo.maqueta ?? (await maquetar(lienzo));
  const interior = maqueta.slice(maqueta.indexOf('>') + 1, maqueta.lastIndexOf('</svg>'));

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}">` +
    (lienzo.fondo ? fondo({ ancho, alto, grano, ...lienzo.fondo }) : '') +
    (lienzo.decoracion ?? '') +
    desplegarImagenes(interior) +
    `</svg>`
  );
}

export interface OpcionesRaster {
  /** Píxeles por unidad del lienzo. 1 = tamaño real. */
  escala?: number;
  /** Resolución que se anota en el fichero (la tarjeta va a 300 ppp). */
  ppp?: number;
}

export async function aPng(svg: string, { escala = 1, ppp }: OpcionesRaster = {}): Promise<Buffer> {
  let img = sharp(Buffer.from(svg), { density: 72 * escala }).png({ compressionLevel: 9 });
  if (ppp) img = img.withMetadata({ density: ppp });
  return img.toBuffer();
}

export async function aJpg(svg: string, { escala = 1, ppp }: OpcionesRaster = {}): Promise<Buffer> {
  let img = sharp(Buffer.from(svg), { density: 72 * escala })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 92, mozjpeg: true, chromaSubsampling: '4:4:4' });
  if (ppp) img = img.withMetadata({ density: ppp });
  return img.toBuffer();
}

export interface PaginaPdf {
  svg: string;
  /** Tamaño de la página en puntos. */
  ancho: number;
  alto: number;
  /** Sangrado en puntos: marca la caja de corte para la imprenta. */
  sangrado?: number;
}

export async function aPdf(paginas: PaginaPdf[], titulo: string): Promise<Buffer> {
  // `font: null` evita que PDFKit cargue la Helvetica al arrancar: la lee de
  // disco y en Vercel ese fichero no viaja con la función. Aquí no hace falta
  // ninguna fuente, porque todo el texto llega ya como trazados.
  const doc = new PDFDocument({
    autoFirstPage: false,
    font: null as unknown as string,
    info: { Title: titulo, Author: 'RM Gestión', Creator: 'RM Gestión · Keystatic' },
  });
  const trozos: Buffer[] = [];
  doc.on('data', (t: Buffer) => trozos.push(t));
  const fin = new Promise<Buffer>((ok) => doc.on('end', () => ok(Buffer.concat(trozos))));

  for (const pagina of paginas) {
    doc.addPage({ size: [pagina.ancho, pagina.alto], margin: 0 });
    if (pagina.sangrado) {
      const s = pagina.sangrado;
      const caja = [s, s, pagina.ancho - s, pagina.alto - s];
      const dict = (doc.page as unknown as { dictionary: { data: Record<string, unknown> } }).dictionary.data;
      dict.TrimBox = caja;
      dict.BleedBox = [0, 0, pagina.ancho, pagina.alto];
    }
    SVGtoPDF(doc, pagina.svg, 0, 0, {
      width: pagina.ancho,
      height: pagina.alto,
      preserveAspectRatio: 'none',
    });
  }
  doc.end();
  return fin;
}

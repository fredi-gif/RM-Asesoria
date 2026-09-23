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
import type { ReactNode } from 'react';
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

export async function aSvg(lienzo: Lienzo, { grano = true } = {}): Promise<string> {
  const { ancho, alto } = lienzo;
  const maqueta = await satori(lienzo.contenido as never, { width: ancho, height: alto, fonts: fuentes() });
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

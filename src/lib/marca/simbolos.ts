/**
 * Piezas gráficas sueltas de la marca, como SVG en texto.
 *
 * Las plantillas las usan dentro de un `<img>` de Satori, y el render las
 * vuelve a desplegar como vectores al final (ver `render.ts`), así que el SVG
 * y el PDF descargados siguen siendo vectoriales de punta a punta.
 *
 * La geometría del símbolo es la de `layout/Logo.astro` y `docs/logo.md`: si
 * cambia allí, cambia aquí.
 */
import { PATHS, type IconName } from '../iconos';
import { COLOR } from './tema';

const TESELA =
  'M24 0H76A24 24 0 0 1 100 24V62A38 38 0 0 1 62 100H24A24 24 0 0 1 0 76V24A24 24 0 0 1 24 0Z';
const FRANJA = 'M100 62A38 38 0 0 1 62 100L62 86A24 24 0 0 0 86 62Z';
const LETRA_R =
  'M15.00 66.00V28.47H29.36Q33.24 28.47 36.24 29.83Q39.23 31.19 40.95 33.86Q42.66 36.53 42.66 40.46Q42.66 44.29 40.90 46.98Q39.13 49.68 36.16 51.04L44.73 66.00H35.96L26.69 49.42L31.73 52.40H22.81V66.00ZM22.81 45.60H29.41Q31.07 45.60 32.28 44.94Q33.49 44.29 34.17 43.13Q34.85 41.97 34.85 40.46Q34.85 38.89 34.17 37.74Q33.49 36.58 32.28 35.92Q31.07 35.27 29.41 35.27H22.81Z';
const LETRA_M =
  'M41.70 66.00V28.47H49.26L63.32 47.11H59.79L73.44 28.47H81.00V66.00H73.19V37.08L76.31 37.79L61.85 56.43H60.85L46.89 37.79L49.51 37.08V66.00Z';

export function dataUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * El símbolo. En negativo (para fondos oscuros) la tesela pasa a blanco y las
 * letras a azul; la franja naranja no cambia nunca.
 */
export function simbolo(negativo = false): string {
  const tesela = negativo ? '#ffffff' : COLOR.marca900;
  const letra = negativo ? COLOR.marca900 : '#ffffff';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="none">` +
    `<path d="${TESELA}" fill="${tesela}"/>` +
    `<path d="${FRANJA}" fill="${COLOR.acento500}"/>` +
    `<path d="${LETRA_R}" fill="${letra}"/>` +
    // El contorno del color de la tesela abre el corte de aire entre la R y la
    // M. Va como un trazado aparte, debajo, en lugar de con `paint-order`: no
    // todos los motores que leen el SVG descargado lo respetan.
    `<path d="${LETRA_M}" stroke="${tesela}" stroke-width="4.5" stroke-linejoin="round"/>` +
    `<path d="${LETRA_M}" fill="${letra}"/>` +
    `</svg>`
  );
}

/** Icono del set de la web, con su trazo de 1,5 sobre rejilla 24. */
export function icono(nombre: string, color: string): string {
  const path = PATHS[nombre as IconName] ?? PATHS.aviso;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" ` +
    `stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" color="${color}">` +
    path.replaceAll('currentColor', color) +
    `</svg>`
  );
}

/**
 * La esquina de la tesela a gran tamaño, como recurso gráfico de fondo: la
 * franja naranja recorriendo el arco y, si se pide `linea`, el contorno de la
 * tesela muy tenue.
 *
 * Es lo que la marca tiene de reconocible —`docs/logo.md` lo explica: la
 * esquina que se abre en arco— llevado a escala de cartel. El grosor de la
 * franja no es el del logo (14 de 100), porque a este tamaño sería una losa:
 * se queda en un filete que sigue la misma curva.
 */
export function silueta(opts: { lado: number; linea?: string; grosor: number; franja: number }): string {
  const { lado, linea, grosor, franja } = opts;
  const k = lado / 100;
  // Radio exterior de la esquina y el centro del arco, en px del lienzo.
  const r = 38 * k;
  const c = 62 * k;
  const ri = r - franja;
  const m = grosor / 2;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 ${lado} ${lado}" fill="none">` +
    (linea ? `<path d="${TESELA}" transform="scale(${k})" stroke="${linea}" stroke-width="${grosor / k}"/>` : '') +
    `<path d="M${lado - m} ${c}A${r - m} ${r - m} 0 0 1 ${c} ${lado - m}L${c} ${c + ri}A${ri} ${ri} 0 0 0 ${c + ri} ${c}Z" fill="${COLOR.acento500}"/>` +
    `</svg>`
  );
}

/**
 * Fuentes de las plantillas de marca.
 *
 * Son las mismas familias que la web —Plus Jakarta Sans para titulares y Source
 * Sans 3 para el texto—, pero en sus cortes estáticos WOFF y no en los
 * variables WOFF2 que carga el CSS: Satori, que compone las piezas, no lee
 * WOFF2 ni fuentes variables.
 *
 * Se importan con `?inline` para que Vite las meta dentro del bundle del
 * servidor. Leerlas de `node_modules` con `fs` funcionaría en local, pero en
 * Vercel la función no lleva `node_modules` completo y la ruta no existiría.
 */
import jakarta600 from '@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-600-normal.woff?inline';
import jakarta700 from '@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-700-normal.woff?inline';
import jakarta800 from '@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-800-normal.woff?inline';
import source400 from '@fontsource/source-sans-3/files/source-sans-3-latin-400-normal.woff?inline';
import source600 from '@fontsource/source-sans-3/files/source-sans-3-latin-600-normal.woff?inline';

export const DISPLAY = 'Plus Jakarta Sans';
export const TEXTO = 'Source Sans 3';

type Peso = 400 | 600 | 700 | 800;

function binario(dataUrl: string): ArrayBuffer {
  const buf = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

let cache: { name: string; data: ArrayBuffer; weight: Peso; style: 'normal' }[] | undefined;

export function fuentes() {
  cache ??= [
    { name: DISPLAY, data: binario(jakarta600), weight: 600, style: 'normal' },
    { name: DISPLAY, data: binario(jakarta700), weight: 700, style: 'normal' },
    { name: DISPLAY, data: binario(jakarta800), weight: 800, style: 'normal' },
    { name: TEXTO, data: binario(source400), weight: 400, style: 'normal' },
    { name: TEXTO, data: binario(source600), weight: 600, style: 'normal' },
  ];
  return cache;
}

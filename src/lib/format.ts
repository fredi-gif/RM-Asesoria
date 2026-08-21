import { LOCALE } from '../config/site';

const eurosConDecimales = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

const eurosEnteros = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

/**
 * Formatea un importe en euros.
 * Los importes redondos se muestran sin decimales («59 €», no «59,00 €»):
 * cuesta menos leerlos y el precio entra mejor. Las tasas de la DGT, que
 * siempre llevan céntimos, conservan los dos decimales.
 */
export function euros(valor: number): string {
  return Number.isInteger(valor) ? eurosEnteros.format(valor) : eurosConDecimales.format(valor);
}

const numeroEntero = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
const numeroDecimal = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 2 });

/**
 * El importe sin el símbolo de moneda, con la misma regla de decimales.
 *
 * Lo usa el precio destacado de `PriceBreakdown`, que compone la cifra y el «€»
 * por separado para poder darles tamaños distintos.
 */
export function numeroEuros(valor: number): string {
  return Number.isInteger(valor) ? numeroEntero.format(valor) : numeroDecimal.format(valor);
}

/**
 * Reduce un cuerpo Markdoc a texto corrido.
 *
 * Se usa para el JSON-LD de FAQPage, que espera la respuesta en texto plano:
 * el mismo contenido se pinta con formato en la página y sin él en los datos
 * estructurados.
 */
export function textoPlano(markdoc: string): string {
  return markdoc
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Convierte los **dobles asteriscos** de un texto plano en el subrayado naranja
 * del claim. Evita meter un editor de texto rico en el hero solo para esto.
 *
 * Acepta `undefined` porque el texto viene de Keystatic y el editor puede dejar
 * el campo vacío. Un claim sin rellenar debe verse como un hueco en la home, no
 * tumbar el build entero de la web.
 */
export function resaltar(texto: string | undefined): string {
  if (!texto) return '';

  const escapado = texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escapado.replace(/\*\*(.+?)\*\*/g, '<span class="claim-mark">$1</span>');
}

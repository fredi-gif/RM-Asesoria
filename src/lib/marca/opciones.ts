/**
 * Opciones de las plantillas de marca que comparten el panel y el render.
 *
 * Van en un módulo aparte, sin dependencias, porque `keystatic.config.ts` se
 * empaqueta también para el navegador: si importara `plantillas.tsx` se
 * llevaría consigo Satori y las fuentes.
 */
export const PLANTILLAS = [
  { value: 'titular', label: 'Titular' },
  { value: 'lista', label: 'Lista con checks' },
  { value: 'tramite', label: 'Trámite con precio' },
  { value: 'marca', label: 'Marca (portadas)' },
] as const;
export type Plantilla = (typeof PLANTILLAS)[number]['value'];

export const TEMAS_MARCA = [
  { value: 'atardecer', label: 'Atardecer — azul de marca calentado hacia el naranja' },
  { value: 'crema', label: 'Crema — papel cálido, texto en azul' },
] as const;

export const PIES = [
  { value: 'ambos', label: 'Web y WhatsApp' },
  { value: 'web', label: 'Solo la web' },
  { value: 'whatsapp', label: 'Solo WhatsApp' },
  { value: 'nada', label: 'Nada' },
] as const;

export const QRS = [
  { value: 'whatsapp', label: 'QR a WhatsApp' },
  { value: 'web', label: 'QR a la web' },
  { value: 'ninguno', label: 'Sin QR' },
] as const;

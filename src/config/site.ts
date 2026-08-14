/**
 * Configuración del sitio.
 *
 * ⚠️ VALORES PROVISIONALES — sustituir por los datos reales del cliente.
 * Todo lo que aparece aquí se propaga a Header, Footer, WhatsAppCTA, las páginas
 * legales y el JSON-LD. Es el único archivo que hay que tocar para cambiarlos.
 *
 * El singleton `configuracion` de Keystatic sobrescribe estos valores cuando
 * existe; esto es el fallback y la fuente de tipos.
 */
export const SITE = {
  /** Nombre comercial, usado en el logo, el título y el JSON-LD. */
  name: 'RM Gestión',
  /** Descripción por defecto para meta description y Open Graph. */
  description:
    'Gestoría online especializada en trámites de vehículos: transferencias, matriculaciones, bajas y mucho más. Sin colas y sin desplazamientos.',
  /** Sin barra final. */
  url: 'https://rmgestion.es',
  /** Formato internacional sin «+» ni espacios — es lo que espera wa.me. */
  whatsapp: '34600000000',
  email: 'hola@rmgestion.es',
  telefono: '+34 600 00 00 00',
  horario: 'Lunes a viernes, de 9:00 a 19:00',

  /** Datos registrales — obligatorios en el aviso legal. */
  legal: {
    razonSocial: 'RM Gestión S.L.',
    cif: 'B00000000',
    direccion: 'Calle Ejemplo 1, 08001 Barcelona',
    registro: 'Registro Mercantil de Barcelona',
  },
} as const;

/** Idioma del documento y locale para el JSON-LD. */
export const LOCALE = 'es-ES';
export const LANG = 'es';

/**
 * Construye el enlace a WhatsApp con un mensaje prellenado.
 *
 * Punto único de cambio: cuando el CTA pase a ser el formulario de captación
 * inteligente, solo hay que reemplazar lo que devuelve esta función.
 */
export function whatsappUrl(mensaje?: string, numero: string = SITE.whatsapp): string {
  const base = `https://wa.me/${numero}`;
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
}

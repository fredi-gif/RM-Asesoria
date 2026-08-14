import { SITE } from '../config/site';
import configuracion from '../content/configuracion/index.json';

/**
 * Datos de la empresa, editables por el cliente desde Keystatic.
 *
 * `SITE` (en `src/config/site.ts`) aporta la URL del sitio y actúa de red de
 * seguridad: si el cliente vacía un campo en el panel, se cae al valor por
 * defecto en lugar de publicar un hueco.
 */
export const empresa = {
  name: configuracion.name || SITE.name,
  description: configuracion.description || SITE.description,
  url: SITE.url,
  whatsapp: configuracion.whatsapp || SITE.whatsapp,
  email: configuracion.email || SITE.email,
  telefono: configuracion.telefono || SITE.telefono,
  horario: configuracion.horario || SITE.horario,
  legal: {
    razonSocial: configuracion.legal?.razonSocial || SITE.legal.razonSocial,
    cif: configuracion.legal?.cif || SITE.legal.cif,
    direccion: configuracion.legal?.direccion || SITE.legal.direccion,
    registro: configuracion.legal?.registro || SITE.legal.registro,
  },
};

/** Enlace a WhatsApp con mensaje prellenado, usando el número configurado. */
export function whatsapp(mensaje?: string): string {
  const base = `https://wa.me/${empresa.whatsapp}`;
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
}

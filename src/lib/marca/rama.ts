/**
 * La rama de GitHub en la que se está editando.
 *
 * Keystatic sustituye `{branch}` por la rama activa en el enlace de vista
 * previa; en local puede llegar vacío o como texto literal, y entonces no hay
 * rama que arrastrar (se usa la rama por defecto del repositorio).
 */
export function ramaDe(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const rama = v.trim();
  if (!rama || rama === '{branch}' || rama === 'undefined' || rama === 'null') return null;
  // Nombres de rama de git razonables; nada de rutas raras en la API.
  return /^[\w.\-/]{1,200}$/.test(rama) && !rama.includes('..') ? rama : null;
}

/** `?rama=…` para arrastrar la rama de un enlace a otro, o cadena vacía. */
export const consultaRama = (rama: string | null, extra = '') => {
  const q = [rama ? `rama=${encodeURIComponent(rama)}` : '', extra].filter(Boolean).join('&');
  return q ? `?${q}` : '';
};

/** A dónde vuelve «Volver al panel». */
export const urlPanel = (rama: string | null, resto = '') =>
  rama ? `/keystatic/branch/${encodeURIComponent(rama)}${resto}` : `/keystatic${resto}`;

/**
 * Llamadas del navegador al endpoint de guardar y borrar
 * (`src/pages/api/marca/[tipo].ts`). Las usan el editor
 * (`components/marca/Estudio.tsx`) y la lista (`pages/marca/[tipo]/index.astro`).
 */
import type { Tipo } from './entradas';

/**
 * El token del panel caduca a las pocas horas. Keystatic lo renueva con su
 * endpoint de refresco; aquí se usa el mismo, una sola vez a la vez.
 */
let refresco: Promise<boolean> | null = null;
export function refrescarSesion(): Promise<boolean> {
  refresco ??= fetch('/api/keystatic/github/refresh-token', { method: 'POST' })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => setTimeout(() => (refresco = null), 10_000));
  return refresco;
}

/** Lanza `Error('sin-sesion')` si la sesión ha caducado y no se ha podido renovar. */
export async function peticionMarca(
  tipo: Tipo,
  metodo: 'POST' | 'DELETE',
  cuerpo: unknown,
  reintentar = true,
): Promise<Record<string, unknown>> {
  const r = await fetch(`/api/marca/${tipo}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
  if (r.status === 401 && reintentar && (await refrescarSesion())) return peticionMarca(tipo, metodo, cuerpo, false);
  const datos = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  if (r.status === 401) throw new Error('sin-sesion');
  if (!r.ok) throw new Error(typeof datos.error === 'string' ? datos.error : `Error ${r.status}`);
  return datos;
}

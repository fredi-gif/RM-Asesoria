/**
 * Las entradas de marca tal como se guardan en `src/content/marca/`.
 *
 * Es el mismo JSON que escribiría Keystatic con el esquema de
 * `keystatic.config.ts` (colecciones `piezas` y `tarjetas`), para que el
 * estudio de `/marca` y el panel puedan leer y escribir los mismos ficheros.
 * Si cambia un campo allí, hay que cambiarlo aquí.
 *
 * El módulo no tiene dependencias de servidor: lo usan a la vez el editor del
 * navegador (`components/marca/Estudio.tsx`) y los endpoints que guardan y
 * generan las imágenes, y así los dos normalizan igual.
 */
import { PIES, PLANTILLAS, QRS, TEMAS_MARCA, type Plantilla } from './opciones';

export type Tipo = 'piezas' | 'tarjetas';
export const TIPOS: Tipo[] = ['piezas', 'tarjetas'];
export const esTipo = (v: unknown): v is Tipo => v === 'piezas' || v === 'tarjetas';

type Pie = (typeof PIES)[number]['value'];
type Qr = (typeof QRS)[number]['value'];
type TemaMarca = (typeof TEMAS_MARCA)[number]['value'];

export interface ValoresPlantilla {
  titular: { antetitulo: string; titular: string; texto: string };
  lista: { antetitulo: string; titular: string; puntos: string[] };
  tramite: {
    tramite?: string;
    titular: string;
    texto: string;
    antetitulo: string;
    mostrarPrecio: boolean;
    mostrarPlazo: boolean;
  };
  marca: { titular: string; texto: string };
}

export type PlantillaGuardada = {
  [P in Plantilla]: { discriminant: P; value: ValoresPlantilla[P] };
}[Plantilla];

export interface EntradaPieza {
  nombre: string;
  plantilla: PlantillaGuardada;
  tema: TemaMarca;
  boton: string;
  pie: Pie;
  silueta: boolean;
}

export interface EntradaTarjeta {
  nombre: string;
  cargo: string;
  telefono: string;
  email: string;
  whatsapp: boolean;
  web: boolean;
  qr: Qr;
  tema: TemaMarca;
}

export type Entrada<T extends Tipo> = T extends 'piezas' ? EntradaPieza : EntradaTarjeta;

// ---------------------------------------------------------------------------
// Normalización: de cualquier cosa (un JSON viejo, lo que manda el navegador)
// a una entrada válida. Los valores por defecto son los de `keystatic.config.ts`.

type Suelto = Record<string, unknown>;
const obj = (v: unknown): Suelto => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Suelto) : {});
const txt = (v: unknown, max = 400): string => (typeof v === 'string' ? v.slice(0, max) : '');
const si = (v: unknown, porDefecto: boolean): boolean => (typeof v === 'boolean' ? v : porDefecto);
function opcion<T extends string>(v: unknown, opciones: readonly { value: T }[], porDefecto: T): T {
  return opciones.some((o) => o.value === v) ? (v as T) : porDefecto;
}

export function valoresPlantilla<P extends Plantilla>(plantilla: P, v: unknown): ValoresPlantilla[P] {
  const o = obj(v);
  const valores: { [K in Plantilla]: () => ValoresPlantilla[K] } = {
    titular: () => ({ antetitulo: txt(o.antetitulo), titular: txt(o.titular), texto: txt(o.texto) }),
    lista: () => ({
      antetitulo: txt(o.antetitulo),
      titular: txt(o.titular),
      puntos: (Array.isArray(o.puntos) ? o.puntos : []).slice(0, 12).map((p) => txt(p, 200)),
    }),
    tramite: () => {
      const tramite = txt(o.tramite, 120).trim();
      return {
        // Como el campo de relación de Keystatic: vacío = sin clave.
        ...(tramite ? { tramite } : {}),
        titular: txt(o.titular),
        texto: txt(o.texto),
        antetitulo: txt(o.antetitulo),
        mostrarPrecio: si(o.mostrarPrecio, true),
        mostrarPlazo: si(o.mostrarPlazo, true),
      };
    },
    marca: () => ({ titular: txt(o.titular), texto: txt(o.texto) }),
  };
  return valores[plantilla]() as ValoresPlantilla[P];
}

export function normalizarPieza(v: unknown): EntradaPieza {
  const o = obj(v);
  const p = obj(o.plantilla);
  const discriminant = opcion(p.discriminant, PLANTILLAS, 'titular');
  return {
    nombre: txt(o.nombre, 120).trim(),
    plantilla: { discriminant, value: valoresPlantilla(discriminant, p.value) } as PlantillaGuardada,
    tema: opcion(o.tema, TEMAS_MARCA, 'atardecer'),
    boton: typeof o.boton === 'string' ? txt(o.boton, 80) : 'Escríbenos por WhatsApp',
    pie: opcion(o.pie, PIES, 'ambos'),
    silueta: si(o.silueta, true),
  };
}

export function normalizarTarjeta(v: unknown): EntradaTarjeta {
  const o = obj(v);
  return {
    nombre: txt(o.nombre, 120).trim(),
    cargo: txt(o.cargo, 120),
    telefono: txt(o.telefono, 40),
    email: txt(o.email, 120),
    whatsapp: si(o.whatsapp, true),
    web: si(o.web, true),
    qr: opcion(o.qr, QRS, 'whatsapp'),
    tema: opcion(o.tema, TEMAS_MARCA, 'atardecer'),
  };
}

export function normalizar<T extends Tipo>(tipo: T, v: unknown): Entrada<T> {
  return (tipo === 'piezas' ? normalizarPieza(v) : normalizarTarjeta(v)) as Entrada<T>;
}

export const nuevaEntrada = <T extends Tipo>(tipo: T): Entrada<T> => normalizar(tipo, {});

// ---------------------------------------------------------------------------
// Slugs y borradores

/** Un slug como los del campo `fields.slug` de Keystatic: «Transferencia online» → `transferencia-online`. */
export function aSlug(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export const SLUG_VALIDO = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * El editor pide las imágenes de lo que hay en pantalla, sin guardar: la
 * entrada viaja en la URL, como JSON en base64url, en el parámetro `borrador`.
 * Así la vista previa se actualiza al escribir y lo que se descarga es
 * exactamente lo que se ve.
 */
export function codificarBorrador(entrada: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(entrada));
  let binario = '';
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodificarBorrador(codigo: string): unknown {
  if (codigo.length > 12_000) return null;
  try {
    const binario = atob(codigo.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = Uint8Array.from(binario, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

/**
 * Plantillas de la imagen de marca.
 *
 * Una sola maqueta sirve a todos los formatos: se mide la zona segura del
 * lienzo y, según su proporción, el contenido se ordena en columna (historias,
 * cuadrados), en dos columnas (publicaciones horizontales) o en una banda de
 * una línea (portadas y banners). Los tamaños salen del lado corto de esa
 * zona, así que un cuadrado de 320 px y un banner de 2560 px guardan la misma
 * relación entre logo, titular y texto.
 *
 * El lenguaje es el de la cabecera de la web: fondo `atardecer` o `crema`,
 * titular en Plus Jakarta Sans 700 con el tramo entre **dobles asteriscos**
 * subrayado en naranja, texto en Source Sans 3 y el botón naranja de acción.
 */
import { Fragment, type CSSProperties, type ReactElement, type ReactNode } from 'react';

import { DISPLAY, TEXTO } from './fuentes';
import { PIELES, COLOR, type Piel } from './tema';
import { dataUri, icono, silueta, simbolo } from './simbolos';
import { TARJETA_PX, type Formato } from './formatos';
import type { Lienzo } from './render';
import type { Tema } from '../tema';
import type { Plantilla } from './opciones';

// ---------------------------------------------------------------------------
// Datos

export { PLANTILLAS, type Plantilla } from './opciones';

export interface DatosEmpresa {
  name: string;
  url: string;
  telefono: string;
  whatsapp: string;
  email: string;
}

export interface DatosPieza {
  tema: Tema;
  plantilla: Plantilla;
  antetitulo: string;
  titular: string;
  texto: string;
  puntos: string[];
  /** Solo en la plantilla de trámite. */
  tramite?: { icono: string; precio?: string; plazo?: string };
  boton: string;
  pie: 'ambos' | 'web' | 'whatsapp' | 'nada';
  silueta: boolean;
}

export interface DatosTarjeta {
  nombre: string;
  cargo: string;
  telefono: string;
  email: string;
  whatsapp: boolean;
  web: boolean;
  qr: 'ninguno' | 'web' | 'whatsapp';
  tema: Tema;
}

// ---------------------------------------------------------------------------
// Utilidades de maqueta

const r = (v: number) => Math.round(v * 10) / 10;

/** El dominio sin protocolo, que es como se escribe en un cartel. */
export function dominio(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

/** El número de WhatsApp en formato de lectura: «681 879 306». */
function telefonoLegible(numero: string): string {
  const nacional = numero.replace(/\D/g, '').replace(/^34(?=\d{9}$)/, '');
  return nacional.length === 9 ? nacional.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3') : numero;
}

/**
 * Tamaño del titular para que quepa en su caja.
 *
 * Satori no reduce el texto solo, así que se estima: con un ancho medio de
 * glifo de 0,56 em (Plus Jakarta Sans en 700) y un interlineado de 1,1, el
 * área que ocupa un texto de `n` caracteres a cuerpo `fs` es
 * `n · 0,56 · 1,1 · fs²`. Se despeja `fs` para el área disponible, con un
 * margen por los cortes de línea, y se limita por arriba para que un titular
 * de tres palabras no se convierta en un cartel de obra.
 */
function cuerpoTitular(texto: string, ancho: number, alto: number, maximo: number, minimo: number) {
  const n = Math.max(8, texto.replace(/\*\*/g, '').length);
  const fs = Math.sqrt((ancho * alto * 0.72) / (n * 0.56 * 1.1));
  // Ninguna palabra puede ser más ancha que la caja.
  const palabraMasLarga = Math.max(...texto.replace(/\*\*/g, '').split(/\s+/).map((p) => p.length), 1);
  const porPalabra = ancho / (palabraMasLarga * 0.62);
  return Math.max(minimo, Math.min(fs, maximo, porPalabra));
}

/**
 * El titular con su resaltado.
 *
 * Satori no sabe partir en líneas un texto con `<span>` dentro, así que el
 * titular se compone palabra a palabra en una fila que envuelve. Las palabras
 * entre **dobles asteriscos** llevan el subrayado naranja de `.claim-mark`.
 */
function Titular({ texto, fs, piel, alinear = 'flex-start' }: { texto: string; fs: number; piel: Piel; alinear?: CSSProperties['justifyContent'] }) {
  const palabras: { t: string; marcada: boolean }[] = [];
  texto.split(/(\*\*[^*]+\*\*)/g).forEach((trozo) => {
    const marcada = trozo.startsWith('**') && trozo.endsWith('**');
    trozo
      .replace(/\*\*/g, '')
      .split(/\s+/)
      .filter(Boolean)
      .forEach((t) => palabras.push({ t, marcada }));
  });

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: alinear,
        fontFamily: DISPLAY,
        fontWeight: 700,
        fontSize: r(fs),
        lineHeight: 1.1,
        letterSpacing: r(-fs * 0.02),
        color: piel.titular,
      }}
    >
      {palabras.map(({ t, marcada }, i) => (
        // El subrayado va palabra a palabra. Si el espacio entrara en el
        // subrayado, al partirse la línea dentro de un tramo resaltado el trazo
        // se quedaría colgando al final del renglón.
        <span
          key={i}
          style={{
            marginRight: i === palabras.length - 1 ? 0 : r(fs * 0.26),
            ...(marcada
              ? { textDecorationLine: 'underline', textDecorationColor: COLOR.acento500, textDecorationStyle: 'solid' }
              : {}),
          }}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

function Icono({ nombre, color, lado }: { nombre: string; color: string; lado: number }) {
  return <img src={dataUri(icono(nombre, color))} width={r(lado)} height={r(lado)} style={{ flexShrink: 0 }} />;
}

/** Símbolo más nombre, como en la cabecera de la web. */
export function Logo({ tesela, piel, nombre }: { tesela: number; piel: Piel; nombre: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: r(tesela * 0.3) }}>
      <img src={dataUri(simbolo(piel.oscuro))} width={r(tesela)} height={r(tesela)} />
      <div
        style={{
          display: 'flex',
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: r(tesela * 0.56),
          letterSpacing: r(-tesela * 0.56 * 0.02),
          color: piel.oscuro ? '#ffffff' : COLOR.marca900,
        }}
      >
        {nombre}
      </div>
    </div>
  );
}

function Antetitulo({ texto, fs, piel }: { texto: string; fs: number; piel: Piel }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: r(fs * 0.6) }}>
      <div style={{ display: 'flex', width: r(fs * 1.6), height: r(Math.max(2, fs * 0.16)), backgroundColor: COLOR.acento500, borderRadius: 99 }} />
      <div
        style={{
          display: 'flex',
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: r(fs),
          letterSpacing: r(fs * 0.08),
          textTransform: 'uppercase',
          color: piel.acento,
        }}
      >
        {texto}
      </div>
    </div>
  );
}

function Boton({ texto, fs }: { texto: string; fs: number }) {
  const conWhatsapp = /whatsapp/i.test(texto);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: r(fs * 0.5),
        padding: `${r(fs * 0.7)}px ${r(fs * 1.25)}px`,
        backgroundColor: COLOR.acento500,
        borderRadius: r(fs * 0.4),
        fontFamily: DISPLAY,
        fontWeight: 600,
        fontSize: r(fs),
        color: '#ffffff',
      }}
    >
      {conWhatsapp && <Icono nombre="whatsapp" color="#ffffff" lado={fs * 1.25} />}
      <div style={{ display: 'flex' }}>{texto}</div>
      {!conWhatsapp && <Icono nombre="flecha-derecha" color="#ffffff" lado={fs * 1.1} />}
    </div>
  );
}

function Pie({ pie, fs, piel, empresa, alinear = 'flex-start' }: { pie: DatosPieza['pie']; fs: number; piel: Piel; empresa: DatosEmpresa; alinear?: CSSProperties['justifyContent'] }) {
  if (pie === 'nada') return null;
  const items: { icono: string; texto: string }[] = [];
  if (pie === 'ambos' || pie === 'web') items.push({ icono: 'globo', texto: dominio(empresa.url) });
  if (pie === 'ambos' || pie === 'whatsapp') items.push({ icono: 'whatsapp', texto: telefonoLegible(empresa.whatsapp) });
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: alinear, columnGap: r(fs * 1.4), rowGap: r(fs * 0.4) }}>
      {items.map((item) => (
        <div key={item.texto} style={{ display: 'flex', alignItems: 'center', gap: r(fs * 0.4) }}>
          <Icono nombre={item.icono} color={piel.acento} lado={fs * 1.2} />
          <div style={{ display: 'flex', fontFamily: TEXTO, fontWeight: 600, fontSize: r(fs), color: piel.texto }}>{item.texto}</div>
        </div>
      ))}
    </div>
  );
}

function Parrafo({ texto, fs, piel, alinear = 'left' }: { texto: string; fs: number; piel: Piel; alinear?: 'left' | 'center' }) {
  return (
    <div style={{ display: 'flex', fontFamily: TEXTO, fontWeight: 400, fontSize: r(fs), lineHeight: 1.4, color: piel.texto, textAlign: alinear }}>
      {texto}
    </div>
  );
}

function Puntos({ puntos, fs, piel }: { puntos: string[]; fs: number; piel: Piel }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: r(fs * 0.55) }}>
      {puntos.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: r(fs * 0.55) }}>
          <Icono nombre="check-circle" color={COLOR.acento500} lado={fs * 1.3} />
          <div style={{ display: 'flex', fontFamily: TEXTO, fontWeight: 600, fontSize: r(fs), lineHeight: 1.3, color: piel.titular, paddingTop: r(fs * 0.02) }}>
            {p}
          </div>
        </div>
      ))}
    </div>
  );
}

/** La ficha de trámite: el icono en su tesela y el precio. */
function FichaTramite({ datos, fs, piel }: { datos: NonNullable<DatosPieza['tramite']>; fs: number; piel: Piel }) {
  const chip = (texto: string, fuerte = false) => (
    <div
      style={{
        display: 'flex',
        padding: `${r(fs * 0.35)}px ${r(fs * 0.8)}px`,
        borderRadius: 99,
        border: `${r(Math.max(1, fs * 0.06))}px solid ${fuerte ? COLOR.acento500 : piel.silueta}`,
        backgroundColor: fuerte ? (piel.oscuro ? 'rgba(249,115,22,0.14)' : '#fff4ec') : 'transparent',
        fontFamily: DISPLAY,
        fontWeight: 700,
        fontSize: r(fs),
        color: fuerte ? piel.acento : piel.texto,
      }}
    >
      {texto}
    </div>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: r(fs * 0.8) }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: r(fs * 3),
          height: r(fs * 3),
          borderRadius: r(fs * 0.75),
          backgroundColor: piel.oscuro ? 'rgba(255,255,255,0.08)' : '#ffffff',
          border: `${r(Math.max(1, fs * 0.05))}px solid ${piel.silueta}`,
        }}
      >
        <Icono nombre={datos.icono} color={piel.oscuro ? '#ffffff' : COLOR.marca900} lado={fs * 1.7} />
      </div>
      {datos.precio && chip(datos.precio, true)}
      {datos.plazo && chip(datos.plazo)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pieza para redes

type Modo = 'vertical' | 'cuadrado' | 'horizontal' | 'banda';

function zona(f: Formato) {
  const x = f.seguro.izquierda;
  const y = f.seguro.arriba;
  const w = f.ancho - f.seguro.izquierda - f.seguro.derecha;
  const h = f.alto - f.seguro.arriba - f.seguro.abajo;
  const prop = w / h;
  const modo: Modo = prop <= 0.85 ? 'vertical' : prop < 1.3 ? 'cuadrado' : prop < 2.5 ? 'horizontal' : 'banda';
  return { x, y, w, h, modo, lado: Math.min(w, h) };
}

function decoracionSilueta(modo: Modo, z: ReturnType<typeof zona>): string {
  // La esquina de la silueta se apoya en la esquina de la zona segura, para
  // que se vea también en las portadas que recortan los laterales.
  const lado = z.lado * (modo === 'banda' ? 1.5 : 1.2);
  const franja = Math.max(3, z.lado * (modo === 'banda' ? 0.035 : 0.02));
  const grosor = Math.max(1.5, z.lado * 0.004);
  const exceso = lado * 0.04;
  const x = z.x + z.w + exceso - lado;
  const y = z.y + z.h + exceso - lado;
  // Sólo el arco: el contorno completo de la tesela, a esta escala, corta el
  // contenido con una línea que no lleva a ninguna parte.
  const svg = silueta({ lado, grosor, franja });
  return svg.replace('<svg ', `<svg x="${r(x)}" y="${r(y)}" `);
}

/**
 * `escala` reduce todo el texto a la vez. La pone `ajustar` (en `render.ts`)
 * cuando la maqueta a tamaño normal no cabe en su caja: los cuerpos de letra
 * se estiman antes de maquetar y con textos largos la estimación se queda
 * corta.
 */
export function lienzoPieza(f: Formato, d: DatosPieza, empresa: DatosEmpresa, escala = 1): Lienzo {
  const piel = PIELES[d.tema] ?? PIELES.atardecer;
  if (f.tipo === 'perfil') return lienzoPerfil(f, piel);

  const z = zona(f);
  const { modo, lado } = z;
  const pad = lado * (modo === 'banda' ? 0.14 : 0.075);
  const caja = { w: z.w - pad * 2, h: z.h - pad * 2 };

  // Unidad base: el cuerpo de texto. Todo lo demás cuelga de ella.
  const u = lado * (modo === 'banda' ? 0.1 : modo === 'horizontal' ? 0.042 : 0.034) * escala;
  const tesela = u * (modo === 'banda' ? 2.2 : 2.1);
  const esMarca = d.plantilla === 'marca';
  const hayCuerpo = !!d.texto || (d.plantilla === 'lista' && d.puntos.length > 0);

  const decoracion = d.silueta ? decoracionSilueta(modo, z) : undefined;
  const base = { ancho: f.ancho, alto: f.alto, fondo: { piel }, decoracion };

  // Satori trata un fragmento como una caja más (en fila), no como una lista
  // de hijos: se desenvuelve para que el `flexDirection` llegue a cada bloque.
  const contenedor = (hijos: ReactElement, estilo: CSSProperties = {}) => (
    <div
      style={{
        display: 'flex',
        position: 'absolute',
        left: r(z.x + pad),
        top: r(z.y + pad),
        width: r(caja.w),
        height: r(caja.h),
        ...estilo,
      }}
    >
      {hijos.type === Fragment ? (hijos.props as { children: ReactNode }).children : hijos}
    </div>
  );

  // --- Banda: portadas y banners. Una sola línea: logo, titular y pie.
  if (modo === 'banda') {
    const titular = d.titular.trim();
    const anchoTexto = caja.w * 0.62;
    const fs = cuerpoTitular(titular, anchoTexto - lado * 0.35, caja.h * 0.5, caja.h * 0.3, u * 0.8) * escala;
    return {
      ...base,
      contenido: contenedor(
        <>
          <Logo tesela={tesela} piel={piel} nombre={empresa.name} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: r(u * 0.35), width: r(anchoTexto), paddingRight: r(lado * 0.35) }}>
            {titular && <Titular texto={titular} fs={fs} piel={piel} />}
            {z.h >= 250 && <Pie pie={d.pie} fs={u * 0.62} piel={piel} empresa={empresa} />}
          </div>
        </>,
        { alignItems: 'center', justifyContent: 'space-between', gap: r(u * 1.2) },
      ),
    };
  }

  const titular = d.titular.trim();
  const fsTexto = u * (modo === 'horizontal' ? 0.95 : 1.05);
  const fsBoton = u * 1.05;
  const fsPie = u * 0.9;
  const fsAnte = u * 0.78;

  // --- Horizontal: el titular a la izquierda; el cuerpo, a la derecha si lo
  // hay. Sin cuerpo, el titular ocupa todo el ancho.
  if (modo === 'horizontal') {
    const dosColumnas = hayCuerpo && !esMarca;
    const anchoTitular = dosColumnas ? caja.w * 0.55 : caja.w * 0.8;
    const fs = cuerpoTitular(titular, anchoTitular, caja.h * (d.boton ? 0.46 : 0.56), lado * 0.13, u * 1.2) * escala;
    const columnaDerecha = dosColumnas && (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: r(u * 0.8), width: r(caja.w * 0.38) }}>
        {d.plantilla === 'lista' ? <Puntos puntos={d.puntos.slice(0, 5)} fs={fsTexto} piel={piel} /> : <Parrafo texto={d.texto} fs={fsTexto} piel={piel} />}
      </div>
    );
    return {
      ...base,
      contenido: contenedor(
        <>
          <Logo tesela={tesela} piel={piel} nombre={empresa.name} />
          <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'space-between', gap: r(caja.w * 0.07) }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: r(u * 0.7), width: r(anchoTitular) }}>
              {d.antetitulo && <Antetitulo texto={d.antetitulo} fs={fsAnte} piel={piel} />}
              {d.tramite && <FichaTramite datos={d.tramite} fs={u * 0.85} piel={piel} />}
              {titular && <Titular texto={titular} fs={fs} piel={piel} />}
              {!dosColumnas && d.texto && <Parrafo texto={d.texto} fs={fsTexto} piel={piel} />}
            </div>
            {columnaDerecha}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: r(u * 1.4) }}>
            {d.boton && <Boton texto={d.boton} fs={fsBoton} />}
            <Pie pie={d.pie} fs={fsPie} piel={piel} empresa={empresa} />
          </div>
        </>,
        // El hueco entre bloques es un mínimo de verdad: si no cabe, `ajustar`
        // reduce el texto. Deja sitio al subrayado, que cuelga bajo la línea.
        { flexDirection: 'column', justifyContent: 'space-between', gap: r(u * 1.5) },
      ),
    };
  }

  // --- Vertical y cuadrado: todo en columna, de arriba abajo.
  const vertical = modo === 'vertical';
  const presupuesto = hayCuerpo ? (vertical ? 0.34 : 0.3) : vertical ? 0.46 : 0.42;
  const fs = cuerpoTitular(titular, caja.w, caja.h * presupuesto, lado * (esMarca ? 0.12 : 0.105), u * 1.3) * escala;
  const centrado = esMarca;
  const alinear = centrado ? 'center' : 'flex-start';

  return {
    ...base,
    contenido: contenedor(
      <>
        <div style={{ display: 'flex', justifyContent: alinear }}>
          <Logo tesela={tesela * (esMarca ? 1.5 : 1)} piel={piel} nombre={empresa.name} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: alinear, gap: r(u * (vertical ? 1.1 : 0.85)) }}>
          {d.antetitulo && <Antetitulo texto={d.antetitulo} fs={fsAnte} piel={piel} />}
          {d.tramite && <FichaTramite datos={d.tramite} fs={u * 0.95} piel={piel} />}
          {titular && <Titular texto={titular} fs={fs} piel={piel} alinear={alinear} />}
          {d.texto && <Parrafo texto={d.texto} fs={fsTexto} piel={piel} alinear={centrado ? 'center' : 'left'} />}
          {d.plantilla === 'lista' && d.puntos.length > 0 && <Puntos puntos={d.puntos.slice(0, vertical ? 7 : 5)} fs={fsTexto} piel={piel} />}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: alinear, gap: r(u * 0.9) }}>
          {d.boton && <Boton texto={d.boton} fs={fsBoton} />}
          <Pie pie={d.pie} fs={fsPie} piel={piel} empresa={empresa} alinear={alinear} />
        </div>
      </>,
      { flexDirection: 'column', justifyContent: 'space-between', gap: r(u * 1.5) },
    ),
  };
}

// ---------------------------------------------------------------------------
// Foto de perfil

/**
 * El símbolo solo, centrado. Ocupa el 58 % del lado: las redes recortan el
 * avatar en círculo y a ese tamaño las esquinas de la tesela quedan dentro
 * del círculo con el área de respeto de `docs/logo.md` sobrada.
 */
function lienzoPerfil(f: Formato, piel: Piel): Lienzo {
  const lado = Math.min(f.ancho, f.alto) * 0.58;
  return {
    ancho: f.ancho,
    alto: f.alto,
    fondo: { piel, paso: Math.max(12, Math.round(f.ancho / 10)) },
    contenido: (
      <div style={{ display: 'flex', width: f.ancho, height: f.alto, alignItems: 'center', justifyContent: 'center' }}>
        <img src={dataUri(simbolo(piel.oscuro))} width={r(lado)} height={r(lado)} />
      </div>
    ),
  };
}

// ---------------------------------------------------------------------------
// Tarjeta de visita

const MM = TARJETA_PX.ancho / 91;

/** Código QR como trazado vectorial, un cuadrado por módulo. */
async function qrSvg(texto: string, color: string): Promise<string> {
  const QR = await import('qrcode');
  const { modules } = QR.create(texto, { errorCorrectionLevel: 'M' });
  const n = modules.size;
  const q = 2; // Zona tranquila mínima dentro del propio SVG.
  let d = '';
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (modules.get(x, y)) d += `M${x + q} ${y + q}h1v1h-1z`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${n + q * 2}" height="${n + q * 2}" viewBox="0 0 ${n + q * 2} ${n + q * 2}" shape-rendering="crispEdges"><rect width="${n + q * 2}" height="${n + q * 2}" rx="1.5" fill="#ffffff"/><path d="${d}" fill="${color}"/></svg>`;
}

export function lienzoAnverso(t: DatosTarjeta, empresa: DatosEmpresa): Lienzo {
  const piel = PIELES[t.tema] ?? PIELES.atardecer;
  const { ancho, alto, sangrado } = TARJETA_PX;
  const corte = { x: sangrado, y: sangrado, w: ancho - sangrado * 2, h: alto - sangrado * 2 };
  const lado = corte.h * 1.25;
  const exceso = lado * 0.05;
  const deco = silueta({ lado, grosor: 0.25 * MM, franja: 1.1 * MM }).replace(
    '<svg ',
    `<svg x="${r(corte.x + corte.w + exceso - lado)}" y="${r(corte.y + corte.h + exceso - lado)}" `,
  );
  return {
    ancho,
    alto,
    fondo: { piel, paso: Math.round(4.5 * MM) },
    decoracion: deco,
    contenido: (
      <div style={{ display: 'flex', flexDirection: 'column', width: ancho, height: alto, alignItems: 'center', justifyContent: 'center', gap: r(3 * MM) }}>
        <Logo tesela={11 * MM} piel={piel} nombre={empresa.name} />
        <div style={{ display: 'flex', fontFamily: TEXTO, fontWeight: 600, fontSize: r(2.6 * MM), letterSpacing: r(0.15 * MM), color: piel.suave }}>
          {dominio(empresa.url)}
        </div>
      </div>
    ),
  };
}

export async function lienzoReverso(t: DatosTarjeta, empresa: DatosEmpresa, escala = 1): Promise<Lienzo> {
  // El reverso va siempre claro: es la cara que se lee, y sobre crema los
  // datos pequeños aguantan mejor la impresión que en blanco sobre azul.
  const piel = PIELES.crema;
  const { ancho, alto, margen } = TARJETA_PX;
  // El nombre manda sobre el cargo: con uno largo se parte en dos líneas en
  // vez de encogerse, y si aun así no cabe, `ajustar` reduce todo a la vez.
  const fsNombre = 4.2 * MM * escala;
  const fsDato = 2.55 * MM * escala;

  const datos: { icono: string; texto: string }[] = [];
  if (t.telefono) datos.push({ icono: 'telefono', texto: t.telefono });
  // Si el teléfono ya es el del WhatsApp, basta con una línea.
  const mismoNumero = t.telefono.replace(/\D/g, '').endsWith(empresa.whatsapp.replace(/\D/g, '').slice(-9));
  if (t.whatsapp && !mismoNumero) datos.push({ icono: 'whatsapp', texto: telefonoLegible(empresa.whatsapp) });
  else if (t.whatsapp && datos[0]) datos[0].icono = 'whatsapp';
  if (t.email) datos.push({ icono: 'sobre', texto: t.email });
  if (t.web) datos.push({ icono: 'globo', texto: dominio(empresa.url) });

  const qr =
    t.qr === 'ninguno'
      ? null
      : await qrSvg(t.qr === 'web' ? empresa.url : `https://wa.me/${empresa.whatsapp}`, COLOR.marca900);

  return {
    ancho,
    alto,
    fondo: { piel, paso: Math.round(4.5 * MM) },
    contenido: (
      <div style={{ display: 'flex', width: ancho, height: alto, padding: r(margen), justifyContent: 'space-between', gap: r(3 * MM) }}>
        {/* La columna de datos es la única que cede ancho: el nombre y el cargo
            se parten; un email que no cabe asoma por fuera y lo detecta
            `ajustar`. */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexShrink: 1, flexGrow: 1, minWidth: 0, gap: r(2 * MM) }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: r(1 * MM) }}>
            <div style={{ display: 'flex', fontFamily: DISPLAY, fontWeight: 700, fontSize: r(fsNombre), lineHeight: 1.15, letterSpacing: r(-fsNombre * 0.02), color: COLOR.marca900 }}>
              {t.nombre}
            </div>
            {t.cargo && (
              <div style={{ display: 'flex', fontFamily: TEXTO, fontWeight: 400, fontSize: r(2.9 * MM * escala), color: COLOR.tintaSuave }}>{t.cargo}</div>
            )}
            <div style={{ display: 'flex', width: r(7 * MM), height: r(0.6 * MM), marginTop: r(1.2 * MM), backgroundColor: COLOR.acento500, borderRadius: 99 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: r(1.1 * MM) }}>
            {datos.map((dato) => (
              <div key={dato.texto} style={{ display: 'flex', alignItems: 'center', gap: r(1.4 * MM) }}>
                <Icono nombre={dato.icono} color={COLOR.acento600} lado={fsDato * 1.25} />
                <div style={{ display: 'flex', fontFamily: TEXTO, fontWeight: 600, fontSize: r(fsDato), color: COLOR.marca900 }}>{dato.texto}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: qr ? 'space-between' : 'flex-start' }}>
          <img src={dataUri(simbolo(false))} width={r(8 * MM)} height={r(8 * MM)} />
          {qr && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: r(0.6 * MM) }}>
              <img src={dataUri(qr)} width={r(19 * MM)} height={r(19 * MM)} />
              <div style={{ display: 'flex', fontFamily: TEXTO, fontWeight: 600, fontSize: r(1.9 * MM), color: COLOR.tintaSuave }}>
                {t.qr === 'web' ? 'Visita la web' : 'Escríbenos por WhatsApp'}
              </div>
            </div>
          )}
        </div>
      </div>
    ),
  };
}

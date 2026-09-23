/**
 * Genera un fichero descargable a partir de una pieza o una tarjeta.
 */
import { CARAS, TARJETA, TARJETA_PX, formato, type Cara, type Extension } from './formatos';
import { aJpg, aPdf, aPng, aSvg, ajustar, type Lienzo } from './render';
import { lienzoAnverso, lienzoPieza, lienzoReverso } from './plantillas';
import { EMPRESA, type Pieza, type Tarjeta } from './datos';

export interface Fichero {
  cuerpo: Buffer | string;
  tipo: string;
}

const TIPOS: Record<Extension, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  svg: 'image/svg+xml; charset=utf-8',
  pdf: 'application/pdf',
};

/** Un px del lienzo en puntos de PDF, a 96 ppp: lo que mide en pantalla. */
const PT_POR_PX = 0.75;

async function exportar(lienzos: Lienzo[], ext: Extension, titulo: string, imprenta = false): Promise<Fichero> {
  const tipo = TIPOS[ext];
  // La tarjeta se dibuja a 12 px/mm y la imprenta pide 300 ppp: 300 / 25,4 / 12.
  const raster = imprenta ? { escala: 300 / 25.4 / TARJETA.pxPorMm, ppp: 300 } : {};

  if (ext === 'pdf') {
    const paginas = await Promise.all(
      lienzos.map(async (l) => {
        const svg = await aSvg(l, { grano: false });
        if (imprenta) {
          const ptPorPx = 72 / 25.4 / TARJETA.pxPorMm;
          return { svg, ancho: l.ancho * ptPorPx, alto: l.alto * ptPorPx, sangrado: TARJETA_PX.sangrado * ptPorPx };
        }
        return { svg, ancho: l.ancho * PT_POR_PX, alto: l.alto * PT_POR_PX };
      }),
    );
    return { cuerpo: await aPdf(paginas, titulo), tipo };
  }

  const svg = await aSvg(lienzos[0]);
  if (ext === 'svg') return { cuerpo: svg, tipo };
  if (ext === 'png') return { cuerpo: await aPng(svg, raster), tipo };
  return { cuerpo: await aJpg(svg, raster), tipo };
}

export async function ficheroPieza(pieza: Pieza, idFormato: string, ext: Extension): Promise<Fichero | null> {
  const f = formato(idFormato);
  if (!f) return null;
  const lienzo = await ajustar((escala) => lienzoPieza(f, pieza.datos, EMPRESA, escala));
  return exportar([lienzo], ext, `${pieza.nombre} · ${f.nombre}`);
}

/**
 * `cara` es `anverso`, `reverso` o `tarjeta`. Esta última sólo existe en PDF:
 * las dos caras en un fichero de dos páginas, que es lo que se manda a la
 * imprenta.
 */
export async function ficheroTarjeta(tarjeta: Tarjeta, cara: Cara | 'tarjeta', ext: Extension): Promise<Fichero | null> {
  const lienzos: Record<Cara, () => Promise<Lienzo>> = {
    anverso: () => ajustar(() => lienzoAnverso(tarjeta.datos, EMPRESA)),
    reverso: () => ajustar((escala) => lienzoReverso(tarjeta.datos, EMPRESA, escala)),
  };
  if (cara === 'tarjeta') {
    if (ext !== 'pdf') return null;
    return exportar(await Promise.all(CARAS.map((c) => lienzos[c.id]())), ext, `Tarjeta · ${tarjeta.nombre}`, true);
  }
  if (!(cara in lienzos)) return null;
  return exportar([await lienzos[cara]()], ext, `Tarjeta · ${tarjeta.nombre}`, true);
}

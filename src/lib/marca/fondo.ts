/**
 * El fondo de las piezas, como SVG escrito a mano.
 *
 * Reproduce las tres capas del hero de la web (`layout/HeroFondo.astro`):
 * degradado con dos resplandores, reja de líneas que se apaga hacia abajo y
 * grano fino. No se compone con Satori porque Satori traduce los fondos CSS a
 * patrones anidados con máscaras que ni el PDF ni muchos editores leen bien;
 * a mano cada capa es un elemento SVG sencillo.
 *
 * Encima va, si se pide, la silueta de la tesela a gran escala (`silueta` en
 * `simbolos.ts`) asomando por una esquina.
 */
import type { Piel } from './tema';

export interface OpcionesFondo {
  ancho: number;
  alto: number;
  piel: Piel;
  /** El grano es un filtro: sólo en PNG/JPG y SVG, nunca en el PDF. */
  grano: boolean;
  /** Paso de la reja en px. Por defecto sale de la escala del lienzo. */
  paso?: number;
}

const n = (v: number) => Math.round(v * 100) / 100;

export function fondo({ ancho: w, alto: h, piel, grano, paso }: OpcionesFondo): string {
  // La web está pensada para ~1200 px de ancho; todo lo demás escala desde ahí.
  const lado = Math.min(w, h);
  const s = Math.max(w, h) / 1200;
  const p = paso ?? Math.max(24, Math.round(lado / (piel.oscuro ? 16 : 18)));
  const grosor = Math.max(1, lado / 1080);

  const partes: string[] = [];
  const defs: string[] = [];

  // 1 · Base y degradado.
  partes.push(`<rect width="${w}" height="${h}" fill="${piel.base}"/>`);
  if (piel.degradado) {
    // 150deg en CSS: de arriba a la izquierda hacia abajo a la derecha, un
    // poco más vertical que la diagonal.
    const a = ((150 - 90) * Math.PI) / 180;
    const largo = Math.abs(w * Math.cos(a)) + Math.abs(h * Math.sin(a));
    const dx = (Math.cos(a) * largo) / 2;
    const dy = (Math.sin(a) * largo) / 2;
    const paradas = [...piel.degradado.matchAll(/(#[0-9a-f]{6})\s+(\d+)%/gi)]
      .map(([, color, pos]) => `<stop offset="${pos}%" stop-color="${color}"/>`)
      .join('');
    defs.push(
      `<linearGradient id="rm-degradado" gradientUnits="userSpaceOnUse" x1="${n(w / 2 - dx)}" y1="${n(h / 2 - dy)}" x2="${n(w / 2 + dx)}" y2="${n(h / 2 + dy)}">${paradas}</linearGradient>`,
    );
    partes.push(`<rect width="${w}" height="${h}" fill="url(#rm-degradado)"/>`);
  }

  // 2 · Resplandores: los mismos dos círculos difuminados del hero, arriba a
  // la izquierda (azul) y abajo a la derecha (naranja).
  const resplandor = (id: string, cx: number, cy: number, r: number, color: string) => {
    const [, rgb, alfa] = color.match(/rgba\(([^)]+),\s*([\d.]+)\)/) ?? [];
    defs.push(
      `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}">` +
        `<stop offset="0" stop-color="rgb(${rgb})" stop-opacity="${alfa}"/>` +
        `<stop offset="1" stop-color="rgb(${rgb})" stop-opacity="0"/></radialGradient>`,
    );
    partes.push(`<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="url(#${id})"/>`);
  };
  resplandor('rm-resplandor-a', 210 * s, 160 * s, 380 * s, piel.resplandorA);
  resplandor('rm-resplandor-b', w - 220 * s, h - 90 * s, 370 * s, piel.resplandorB);

  // 3 · La reja, recortada con la misma máscara radial que en la web: se
  // apaga hacia los bordes y hacia abajo para que no se vea dónde acaba.
  defs.push(
    `<radialGradient id="rm-reja-fundido" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(${n(w / 2)} 0) scale(${n(w * 1.2)} ${n(h * 0.85)})">` +
      `<stop offset="0.3" stop-color="#fff"/><stop offset="0.78" stop-color="#fff" stop-opacity="0"/></radialGradient>` +
      `<mask id="rm-reja-mascara" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="url(#rm-reja-fundido)"/></mask>`,
  );
  const lineas: string[] = [];
  for (let x = p; x < w; x += p) lineas.push(`M${x} 0V${h}`);
  for (let y = p; y < h; y += p) lineas.push(`M0 ${y}H${w}`);
  partes.push(
    `<path d="${lineas.join('')}" stroke="${piel.reja}" stroke-width="${n(grosor)}" mask="url(#rm-reja-mascara)"/>`,
  );

  // 4 · Grano.
  if (grano) {
    defs.push(
      `<filter id="rm-grano" x="0" y="0" width="100%" height="100%" filterUnits="userSpaceOnUse">` +
        `<feTurbulence type="fractalNoise" baseFrequency="${n(0.82 / Math.max(1, s * 0.9))}" numOctaves="2" stitchTiles="stitch"/>` +
        `<feColorMatrix type="saturate" values="0"/></filter>`,
    );
    partes.push(
      `<rect width="${w}" height="${h}" filter="url(#rm-grano)" opacity="${piel.grano}" style="mix-blend-mode:${piel.granoMezcla}"/>`,
    );
  }

  return `<defs>${defs.join('')}</defs>${partes.join('')}`;
}

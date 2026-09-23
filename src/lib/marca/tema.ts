/**
 * Colores y fondos de las plantillas de marca.
 *
 * Son los de la web: los hex de `src/styles/tokens.css` y los dos temas del
 * hero de `src/styles/global.css` (`atardecer` y `crema`). Van repetidos aquí
 * en hexadecimal porque Satori no lee variables CSS; si cambian allí, hay que
 * cambiarlos aquí.
 */
import type { Tema } from '../tema';

export const COLOR = {
  marca950: '#060f24',
  marca900: '#0a1f44',
  marca800: '#12305f',
  marca100: '#dde6f2',
  acento600: '#ea6a0b',
  acento500: '#f97316',
  acento400: '#fb923c',
  tinta: '#0f172a',
  tintaSuave: '#475569',
  crema: '#fcf9f3',
} as const;

export interface Piel {
  oscuro: boolean;
  base: string;
  degradado?: string;
  reja: string;
  resplandorA: string;
  resplandorB: string;
  /** Opacidad y modo de fusión del grano, como en `HeroFondo.astro`. */
  grano: number;
  granoMezcla: 'overlay' | 'multiply';
  titular: string;
  texto: string;
  suave: string;
  /** Color del resaltado del titular y del antetítulo. */
  acento: string;
  silueta: string;
}

export const PIELES: Record<Tema, Piel> = {
  atardecer: {
    oscuro: true,
    base: COLOR.marca900,
    degradado: 'linear-gradient(150deg, #0a1f44 0%, #132b4f 45%, #3b2a3f 78%, #5a2f2a 100%)',
    reja: 'rgba(255, 255, 255, 0.055)',
    resplandorA: 'rgba(36, 82, 143, 0.45)',
    resplandorB: 'rgba(249, 115, 22, 0.42)',
    grano: 0.07,
    granoMezcla: 'overlay',
    titular: '#ffffff',
    texto: 'rgba(255, 255, 255, 0.74)',
    suave: 'rgba(255, 255, 255, 0.56)',
    acento: COLOR.acento400,
    silueta: 'rgba(255, 255, 255, 0.10)',
  },
  crema: {
    oscuro: false,
    base: COLOR.crema,
    reja: 'rgba(10, 31, 68, 0.055)',
    resplandorA: 'rgba(234, 106, 11, 0.07)',
    resplandorB: 'rgba(36, 82, 143, 0.05)',
    grano: 0.05,
    granoMezcla: 'multiply',
    titular: COLOR.marca900,
    texto: COLOR.tintaSuave,
    suave: '#64748b',
    acento: COLOR.acento600,
    silueta: 'rgba(10, 31, 68, 0.10)',
  },
};

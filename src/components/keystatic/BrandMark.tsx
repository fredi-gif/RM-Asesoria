/**
 * La marca de RM Gestión en la cabecera del panel de Keystatic.
 *
 * Es la tesela con el monograma —la misma de `layout/Logo.astro` y del
 * favicon—, sin el nombre al lado: Keystatic ya compone el nombre él mismo
 * junto a la marca, así que repetirlo aquí lo duplicaría. Y a 24 px, que es el
 * tamaño que usa el panel, el logotipo horizontal no se leería: es justo el
 * caso para el que `docs/logo.md` reserva el símbolo solo.
 *
 * Los colores van en hexadecimal y no como `var(--color-brand-900)` a
 * propósito: el panel es una aplicación aparte que no carga `tokens.css`, así
 * que las variables de la web no existen en este contexto. Si algún día cambian
 * los hex de la marca en `src/styles/tokens.css`, hay que cambiarlos también
 * aquí — son los dos únicos sitios donde viven sueltos.
 *
 * Keystatic nos pasa el esquema de color que esté activo (y resuelve él el
 * modo «auto» antes de llamarnos, así que aquí solo llegan `light` o `dark`).
 * En oscuro se usa el negativo, como manda `docs/logo.md`: la tesela pasa a
 * blanco y las letras a azul. La franja naranja no cambia nunca.
 */
export function BrandMark({ colorScheme }: { colorScheme: 'light' | 'dark' }) {
  const tesela = colorScheme === 'dark' ? '#ffffff' : '#0a1f44';
  const letra = colorScheme === 'dark' ? '#0a1f44' : '#ffffff';

  return (
    <svg width={24} height={24} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <path
        d="M24 0H76A24 24 0 0 1 100 24V62A38 38 0 0 1 62 100H24A24 24 0 0 1 0 76V24A24 24 0 0 1 24 0Z"
        fill={tesela}
      />
      <path d="M100 62A38 38 0 0 1 62 100L62 86A24 24 0 0 0 86 62Z" fill="#f97316" />
      <path
        d="M15.00 66.00V28.47H29.36Q33.24 28.47 36.24 29.83Q39.23 31.19 40.95 33.86Q42.66 36.53 42.66 40.46Q42.66 44.29 40.90 46.98Q39.13 49.68 36.16 51.04L44.73 66.00H35.96L26.69 49.42L31.73 52.40H22.81V66.00ZM22.81 45.60H29.41Q31.07 45.60 32.28 44.94Q33.49 44.29 34.17 43.13Q34.85 41.97 34.85 40.46Q34.85 38.89 34.17 37.74Q33.49 36.58 32.28 35.92Q31.07 35.27 29.41 35.27H22.81Z"
        fill={letra}
      />
      <path
        d="M41.70 66.00V28.47H49.26L63.32 47.11H59.79L73.44 28.47H81.00V66.00H73.19V37.08L76.31 37.79L61.85 56.43H60.85L46.89 37.79L49.51 37.08V66.00Z"
        fill={letra}
        stroke={tesela}
        strokeWidth={4.5}
        paintOrder="stroke"
      />
    </svg>
  );
}

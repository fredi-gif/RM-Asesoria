# Imagen de marca: piezas para redes y tarjetas de visita

El panel de Keystatic tiene un grupo **Imagen de marca** con dos colecciones:

- **Imágenes para redes**: una pieza (titular, lista, trámite o marca) que se
  genera en todos los formatos de Instagram, WhatsApp, LinkedIn, Facebook y
  YouTube.
- **Tarjetas de visita**: una por persona, 85 × 55 mm con 3 mm de sangrado.

No se publican en la web. Se guarda la entrada y el botón **Vista previa**
(arriba a la derecha en el editor) abre `/marca/piezas/<slug>` o
`/marca/tarjetas/<slug>`: una galería con cada formato y sus descargas en
**PNG, JPG, SVG y PDF**. El PDF de la tarjeta lleva las dos caras en vectorial
y la caja de corte marcada, listo para la imprenta. PNG y JPG de la tarjeta
salen a 300 ppp.

## Cómo funciona

| Archivo | Qué hace |
| --- | --- |
| `src/lib/marca/formatos.ts` | Catálogo de formatos: tamaño y zona segura de cada red. Si una red cambia sus medidas, se toca aquí. |
| `src/lib/marca/plantillas.tsx` | La maqueta (Satori). Se adapta a la proporción de la zona segura: columna, dos columnas o banda. |
| `src/lib/marca/fondo.ts` | El fondo del hero de la web (degradado, resplandores, reja y grano) en SVG. |
| `src/lib/marca/tema.ts` | Colores y los dos temas, `atardecer` y `crema`, copiados de `tokens.css` y `global.css`. |
| `src/lib/marca/simbolos.ts` | Símbolo, iconos y la silueta en arco, como SVG. |
| `src/lib/marca/render.ts` | SVG → PNG/JPG (sharp) y PDF vectorial (PDFKit). |
| `src/lib/marca/datos.ts` | Lee la entrada: del disco en local, de GitHub en producción. |

Todo sale de un único SVG por lienzo, con el texto convertido en trazados:
se abre igual en cualquier programa aunque no tenga las fuentes instaladas.

## Producción

En Vercel, Keystatic guarda en GitHub, así que las galerías leen de GitHub —de
la rama que se esté editando— con el token de la sesión del panel (la cookie
`keystatic-gh-access-token`). Sin sesión en el panel redirigen a `/keystatic`:
no son públicas. No hace falta ninguna variable de entorno nueva.

Si cambian los colores de `tokens.css`, hay que cambiarlos también en
`src/lib/marca/tema.ts` (Satori no lee variables CSS).

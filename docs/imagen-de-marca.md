# Imagen de marca: piezas para redes y tarjetas de visita

Todo se gestiona en un único sitio, el **estudio de marca** de `/marca`:

- **Imágenes para redes** (`/marca/piezas`): una pieza (titular, lista, trámite
  o marca) que se genera en todos los formatos de Instagram, WhatsApp,
  LinkedIn, Facebook y YouTube.
- **Tarjetas de visita** (`/marca/tarjetas`): una por persona, 85 × 55 mm con
  3 mm de sangrado.

Se llega desde el grupo **Imagen de marca** del menú lateral del panel: sus dos
entradas redirigen al estudio, en la misma rama en la que se esté trabajando.
Cada sección tiene la lista con miniaturas y el botón «Nueva»; al abrir una
entrada, el formulario queda a la izquierda y a la derecha todos los formatos,
que **se actualizan mientras se escribe**, sin guardar. Cada formato se
descarga en **PNG, JPG, SVG y PDF**, y lo que se descarga es siempre lo que se
ve. El PDF de la tarjeta lleva las dos caras en vectorial y la caja de corte
marcada, listo para la imprenta. PNG y JPG de la tarjeta salen a 300 ppp.

**Guardar** (o Ctrl/Cmd + S) escribe la entrada en `src/content/marca/`, el
mismo JSON que escribiría Keystatic: en local en disco y en producción como un
commit en GitHub. Desde la entrada también se puede **duplicar** y **borrar**.

No se publica nada en la web: el estudio sólo se ve con sesión en el panel y
no se indexa.

### ¿Y las colecciones de Keystatic?

`piezas` y `tarjetas` siguen definidas en `keystatic.config.ts` porque son el
esquema del que leen el estudio y el lector de Keystatic, pero ya no salen en
el menú. En su lugar hay dos singletons, `estudioPiezas` y `estudioTarjetas`,
cuyo único campo (`src/components/keystatic/AccesoEstudio.tsx`) redirige al
estudio: el menú de Keystatic no admite enlaces a una URL cualquiera. Si
alguien abre una entrada en el panel por su dirección, sigue funcionando, y
su «Vista previa» lleva al estudio.

Si cambias un campo del esquema, cámbialo en los tres sitios:
`keystatic.config.ts`, `src/lib/marca/entradas.ts` (normalización) y el
formulario de `src/components/marca/Estudio.tsx`.

## Cómo funciona

| Archivo | Qué hace |
| --- | --- |
| `src/lib/marca/formatos.ts` | Catálogo de formatos: tamaño y zona segura de cada red. Si una red cambia sus medidas, se toca aquí. |
| `src/lib/marca/plantillas.tsx` | La maqueta (Satori). Se adapta a la proporción de la zona segura: columna, dos columnas o banda. |
| `src/lib/marca/fondo.ts` | El fondo del hero de la web (degradado, resplandores, reja y grano) en SVG. |
| `src/lib/marca/tema.ts` | Colores y los dos temas, `atardecer` y `crema`, copiados de `tokens.css` y `global.css`. |
| `src/lib/marca/simbolos.ts` | Símbolo, iconos y la silueta en arco, como SVG. |
| `src/lib/marca/render.ts` | SVG → PNG/JPG (sharp) y PDF vectorial (PDFKit). |
| `src/lib/marca/datos.ts` | Lee la entrada (del disco en local, de GitHub en producción) o el borrador que manda el editor. |
| `src/lib/marca/entradas.ts` | Forma de las entradas guardadas, su normalización y el borrador en la URL (`?borrador=…`, JSON en base64url). |
| `src/lib/marca/escribir.ts` | Guarda y borra entradas: en disco en local, con la API de contenidos de GitHub en producción. |
| `src/components/marca/Estudio.tsx` | El editor (isla de React): formulario, vista previa en vivo y descargas. |
| `src/pages/marca/` | Lista (`[tipo]/index.astro`), editor (`[tipo]/[slug]/index.astro`) y ficheros (`[tipo]/[slug]/[archivo].ts`). |
| `src/pages/api/marca/[tipo].ts` | Endpoint de guardar (POST) y borrar (DELETE). |

Todo sale de un único SVG por lienzo, con el texto convertido en trazados:
se abre igual en cualquier programa aunque no tenga las fuentes instaladas.

## Producción

En Vercel, Keystatic guarda en GitHub, así que el estudio lee de GitHub —de la
rama que se esté editando— y guarda en GitHub, con el token de la sesión del
panel (la cookie `keystatic-gh-access-token`). Es el mismo permiso con el que
guarda el panel: quien no puede guardar allí, tampoco aquí. Cada guardado es
un commit, igual que desde Keystatic, y dispara el despliegue como cualquier
otro cambio de contenido.

Sin sesión, el estudio manda a `/marca/entrar`, que intenta renovar el token
con el endpoint de refresco de Keystatic y, si no puede, lleva a entrar en
`/keystatic`. No hace falta ninguna variable de entorno nueva.

Si cambian los colores de `tokens.css`, hay que cambiarlos también en
`src/lib/marca/tema.ts` (Satori no lee variables CSS).

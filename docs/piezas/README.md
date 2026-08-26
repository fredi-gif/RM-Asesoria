# Generador de piezas

La herramienta que usa el cliente para sacar sus propias piezas: elige
plantilla y formato, edita el texto y descarga el archivo.

**No se publica en la web.** `docs/` no entra en el build de Astro, así que
nada de esto llega al sitio. Se monta en dos versiones:

| Archivo | Para qué |
|---|---|
| `piezas-rm.html` | publicar como artefacto de Claude — [enlace](https://claude.ai/code/artifact/e8148cc6-5161-4c42-80e1-04aa6909f6e5) |
| `piezas-rm-standalone.html` | pasárselo al cliente por correo |

El standalone es un documento completo, sin dependencias externas y con la
tipografía y el icono incrustados: doble clic y se abre en el navegador, sin
servidor y sin conexión. Cada copia que se manda es una versión congelada; si
cambian precios o plantillas, hay que reenviarla.

### Las descargas tienen dos vías

Dentro del visor de artefactos de Claude un enlace de descarga está capado, y
hay que pedirle al anfitrión que guarde el archivo (`window.claude.downloads`);
además el visor solo admite una lista cerrada de extensiones, en la que el PDF
no está. Abierto como archivo suelto no hay ninguna de las dos limitaciones y
basta con un `<a download>`. `entregar()` elige la vía según dónde se esté
ejecutando, así que el mismo código sirve para las dos versiones.

Comprobado abriendo el standalone con `file://`: se rasteriza a PNG, JPG y
WEBP sin que el navegador manche el canvas, y el SVG sale sin restricción de
extensión.

## Qué hay dentro

23 plantillas repartidas en cuatro familias:

| Familia | Plantillas | Formatos |
|---|---|---|
| Redes sociales | precio, dato, tarifa, faq, checklist, pasos, comparativa, testimonio, aviso, ficha, frase, carrusel | 1:1, 4:5, 9:16, 16:9 |
| Foto de perfil | símbolo, con anillo, a sangre, monograma | 1080×1080 |
| Portadas | claim, servicios, contacto | Facebook, LinkedIn, X, YouTube |
| Impresos | tarjeta cara A y cara B, cartel, flyer de tarifas | tarjeta, A5, A4, roll-up |

Cada una se puede pintar en tres tonos —azul, crema y blanco—, así que salen
algo más de doscientas combinaciones.

## Por qué las piezas son SVG y no HTML

Se dibujan como SVG construido a mano por tres motivos que mandan sobre la
comodidad de maquetar en HTML:

1. el SVG se descarga tal cual como vectorial y vale para imprenta;
2. se rasteriza a PNG, JPG o WEBP a cualquier resolución sin volver a maquetar;
3. al imprimirlo el texto sigue siendo texto, no un mapa de bits.

El precio a pagar es que en SVG el texto **no fluye solo**: hay que medirlo y
romperlo en líneas a mano. De eso se ocupa `3-motor.js`, midiendo con un canvas
fuera de pantalla que usa exactamente la misma tipografía que luego dibuja.

## Dos trampas que costaron caro

- **La tipografía va incrustada en base64 dentro del SVG que se exporta.** Al
  rasterizar, el navegador trata ese SVG como un documento aparte y no ve las
  fuentes de la página: sin incrustarla, el texto sale con otra letra.
- **La unidad tipográfica se calcula sobre el ancho, salvo en apaisado, donde
  manda el alto.** Si no, en 16:9 el cuerpo crece con lo ancho que sea la pieza
  y el contenido se come el pie.

## Cómo regenerarlo

Las fuentes están troceadas en `fuentes/` y se montan en un único archivo:

```sh
python3 docs/piezas/fuentes/build.py
```

La tipografía y el icono los coge solo, del paquete que ya usa la web y de
`public/favicon.svg`.

El orden de montaje importa: `3-motor.js` define la clase `Lienzo`,
`5a-guias.js` y `5-plantillas2.js` le añaden métodos, y `6-app.js` da por hecho
que `PLANTILLAS` ya está entera.

## Si cambia la marca

Los trazados del logo (`TESELA`, `FRANJA`, `LETRA_R`, `LETRA_M`) están copiados
de `public/marca/`. Si el logo cambia allí, hay que traerlos también aquí —
no se leen del repositorio en tiempo de ejecución, porque la página tiene que
funcionar suelta.

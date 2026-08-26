# Generador de piezas

La herramienta que usa el cliente para sacar sus propias piezas: elige
plantilla y formato, edita el texto y descarga el archivo.

Se publica en dos sitios, con el mismo contenido montado desde las mismas
fuentes:

| Dónde | Archivo | Para quién |
|---|---|---|
| Artefacto de Claude | `piezas-rm.html` | nosotros, mientras se itera — [enlace](https://claude.ai/code/artifact/e8148cc6-5161-4c42-80e1-04aa6909f6e5) |
| La propia web, en `/marca/piezas/` | `public/marca/piezas/index.html` | el cliente, sin cuenta de nada |

La versión de la web va con `noindex`: es una herramienta de trabajo, no una
página de captación, y no debe competir en el buscador con los trámites.

### La clave de acceso

La versión de la web lleva delante una cortina (`fuentes/7-cerrojo.html`).
**Clave actual: `rmgestion2026`.**

Para cambiarla, calcula la huella nueva y sustitúyela en `HUELLA`:

```sh
python3 -c "
h=0x811c9dc5
for c in 'rm-piezas·' + 'LA-CLAVE-NUEVA'.strip().lower():
    h ^= ord(c); h = (h*0x01000193) & 0xFFFFFFFF
print(format(h,'08x'))"
```

Se guarda la huella y no la clave para que no esté escrita en claro, pero
conviene no engañarse: **esto es una cortina, no una cerradura.** La página es
un archivo estático, así que la clave viaja dentro y cualquiera que mire el
código fuente puede saltársela. Sirve para que la herramienta no quede a la
vista de quien pase por ahí. Si algún día hay que proteger algo de verdad,
tiene que hacerlo el servidor —Vercel Pro, Cloudflare Access—, no esta página.

La cortina va **solo** en la versión de la web: el artefacto ya es privado de
la cuenta de Claude y ahí una clave solo estorbaría.

### Las descargas tienen dos vías

Dentro del visor de artefactos de Claude un enlace de descarga está capado, y
hay que pedirle al anfitrión que guarde el archivo (`window.claude.downloads`);
además el visor solo admite una lista cerrada de extensiones, en la que el PDF
no está. Alojada en un servidor normal no hay ninguna de las dos limitaciones y
basta con un `<a download>`. `entregar()` elige la vía según dónde se esté
ejecutando, así que el mismo archivo sirve para los dos sitios.

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
cd docs/piezas/fuentes
# la tipografía sale del paquete que ya usa la web
python3 -c "import base64;open('font.b64','w').write(base64.b64encode(open('../../../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2','rb').read()).decode())"
python3 build.py && mv piezas-rm.html ..
```

El orden de montaje importa: `3-motor.js` define la clase `Lienzo`,
`5a-guias.js` y `5-plantillas2.js` le añaden métodos, y `6-app.js` da por hecho
que `PLANTILLAS` ya está entera.

## Si cambia la marca

Los trazados del logo (`TESELA`, `FRANJA`, `LETRA_R`, `LETRA_M`) están copiados
de `public/marca/`. Si el logo cambia allí, hay que traerlos también aquí —
no se leen del repositorio en tiempo de ejecución, porque la página tiene que
funcionar suelta.

# El logotipo

La marca es una **tesela con el monograma RM**. Lo que la distingue no son las
letras —cualquiera mete sus iniciales en un cuadrado— sino la **silueta**: la
esquina inferior derecha se abre en un arco de radio 38 y una franja naranja lo
recorre. Eso es lo que se reconoce a 16 px, donde las letras ya no se leen, y
por eso el favicon puede prescindir del nombre.

## Dónde vive

| Sitio | Qué es |
| --- | --- |
| `src/components/layout/Logo.astro` | El componente que usan la cabecera y el pie. |
| `public/favicon.svg` | El mismo símbolo, sin nombre. |
| `public/marca/` | El kit para el cliente: ocho SVG listos para usar. |

## Las versiones

**Símbolo solo** — `rm-simbolo.svg`. Para avatares, favicon, sellos y
cualquier sitio cuadrado. Es la versión que más se va a usar.

**Horizontal** — `rm-horizontal.svg`. Símbolo y nombre en una línea. Es la de
la cabecera y la firma de correo.

**Apilado** — `rm-apilado.svg`. Símbolo arriba, nombre debajo y centrado. Para
espacios estrechos y verticales.

Cada una tiene su **negativo** (`-negativo.svg`) para fondos oscuros: la tesela
pasa a blanco y las letras a azul. La franja naranja no cambia nunca.

**Una tinta** — `rm-simbolo-una-tinta.svg` y `rm-simbolo-negro.svg`. Para
sellos de caucho, bordado, fax y todo lo que no admite color: la franja se
resuelve en calado, no desaparece.

## Reglas

- **El naranja va solo en la franja.** Ni en las letras, ni en el nombre. Es lo
  que evita que el logo tenga dos focos peleándose.
- **Área de respeto: 12 unidades de las 100 del símbolo**, o sea un 12 % de su
  lado, libre por los cuatro costados.
- **Tamaño mínimo: 16 px** para el símbolo, **90 px de ancho** para el
  horizontal. Por debajo de eso, símbolo solo.
- **No se recolorea, no se rota, no se estira, no se le añaden sombras** y no se
  cambia la proporción entre símbolo y nombre.

## Cómo se regeneran los trazados

Las letras del símbolo **no son texto**: son trazados. Un logotipo no puede
depender de que una webfont haya cargado, y en un SVG suelto no hay webfont
ninguna. Salen de la Plus Jakarta Sans en peso 800 —la misma familia que
compone el nombre que va al lado— a cuerpo 50,38 sobre una caja de 100, con la
R y la M **solapadas 0,06 em**. Ese solape es el que liga las dos letras; a
partir de 0,12 em la pata de la R se pierde y el monograma empieza a leerse
«FM».

El corte de aire entre las dos lo abre `paint-order="stroke"` en la M: pinta un
contorno de 4,5 del color de la tesela **antes** del relleno, así que separa sin
adelgazar ninguna de las dos letras.

Si algún día cambia la tipografía o el peso, hay que volver a extraerlos:

```bash
pip install fonttools brotli
```

```python
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.misc.transform import Transform
from fontTools.pens.boundsPen import BoundsPen

FUENTE = 'node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2'
f = instantiateVariableFont(TTFont(FUENTE), {'wght': 800}, inplace=True)
upm, gs, cmap = f['head'].unitsPerEm, f.getGlyphSet(), f.getBestCmap()

def medir(letra):
    bp = BoundsPen(gs); gs[cmap[ord(letra)]].draw(bp)
    x0, _, x1, y1 = bp.bounds
    return x0 / upm, (x1 - x0) / upm

TINTA, INK0, BASE, SOLAPE = 66.0, 15.0, 66.0, 0.06   # tinta de 66 sobre caja de 100
(lsb_r, w_r), (lsb_m, w_m) = medir('R'), medir('M')
fs = TINTA / (w_r + w_m - SOLAPE)                     # ≈ 50,38
for letra, x in (('R', INK0 - lsb_r * fs), ('M', INK0 + (w_r - SOLAPE - lsb_m) * fs)):
    pen = SVGPathPen(gs, ntos=lambda v: f'{v:.2f}')
    gs[cmap[ord(letra)]].draw(TransformPen(pen, Transform(fs / upm, 0, 0, -fs / upm, x, BASE)))
    print(letra, pen.getCommands())
```

Ojo con la escala: `fs` son píxeles por **em**, y el trazado va en **unidades
de fuente**, así que la transformación lleva `fs / upm`, no `fs`.

## La geometría de la tesela

```
Tesela   M24 0H76A24 24 0 0 1 100 24V62A38 38 0 0 1 62 100H24A24 24 0 0 1 0 76V24A24 24 0 0 1 24 0Z
Franja   M100 62A38 38 0 0 1 62 100L62 86A24 24 0 0 0 86 62Z
```

Tres esquinas con radio 24 y la inferior derecha con radio 38. La franja **no
es un adorno pegado encima**: es la forma que queda entre dos arcos
concéntricos —el de 38 y el de 24, con el mismo centro en (62, 62)—, así que
sigue la curva exactamente y nunca se sale de la silueta.

"""Monta el generador de piezas en un único archivo.

Salen dos versiones del mismo contenido:

  ../piezas-rm.html                  cuerpo suelto, para publicar como artefacto
                                     (el runtime le pone doctype, head y body)
  public/marca/piezas/index.html     documento completo, para servirlo desde la
                                     web como una página más

El orden de los trozos importa: 3-motor.js define la clase Lienzo, 5a-guias.js
y 5-plantillas2.js le añaden métodos, y 6-app.js da por hecho que PLANTILLAS ya
está entera.
"""
import base64, pathlib

AQUI = pathlib.Path(__file__).resolve().parent
RAIZ = AQUI.parents[2]
FUENTE = RAIZ / 'node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2'

b64 = base64.b64encode(FUENTE.read_bytes()).decode()
partes = ['3-motor.js', '5a-guias.js', '4-plantillas.js', '5-plantillas2.js', '6-app.js']

cabeza = (AQUI / '1-head.html').read_text().replace('__FONT_B64__', b64)
resto = (AQUI / '2-markup.html').read_text()
resto += ('<script>\nconst FUENTE_B64 = "' + b64 + '";\n'
          + '\n'.join((AQUI / f).read_text() for f in partes) + '\n</' + 'script>\n')

# El artefacto va sin envoltorio: el runtime le pone doctype, head y body.
(AQUI.parent / 'piezas-rm.html').write_text(cabeza + resto)

suelta = RAIZ / 'public/marca/piezas'
suelta.mkdir(parents=True, exist_ok=True)
(suelta / 'index.html').write_text(
    '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n'
    # Es una herramienta de trabajo, no una página de captación: que no compita
    # en el buscador con los trámites.
    '<meta name="robots" content="noindex, nofollow">\n'
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">\n'
    + cabeza + '</head>\n<body>\n' + resto + '</body>\n</html>\n')

print('artefacto  docs/piezas/piezas-rm.html      ', round(len(cabeza + resto) / 1024), 'KB')
print('web        public/marca/piezas/index.html')

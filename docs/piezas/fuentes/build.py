import pathlib
d = pathlib.Path('.')
fuente = (d/'font.b64').read_text().strip()
partes = ['1-head.html','2-markup.html']
js = [(d/f).read_text() for f in ['3-motor.js','5a-guias.js','4-plantillas.js','5-plantillas2.js','6-app.js']]
html = (d/'1-head.html').read_text().replace('__FONT_B64__', fuente)
html += (d/'2-markup.html').read_text()
html += '<script>\nconst FUENTE_B64 = "' + fuente + '";\n' + '\n'.join(js) + '\n</' + 'script>\n'
(d/'piezas-rm.html').write_text(html)
print('piezas-rm.html', round(len(html)/1024), 'KB')

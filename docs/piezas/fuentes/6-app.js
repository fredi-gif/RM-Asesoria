/* ==========================================================================
   APLICACIÓN
   ========================================================================== */
const FAMILIAS = [
  ['social',  'Redes sociales'],
  ['perfil',  'Foto de perfil'],
  ['portada', 'Portadas'],
  ['impreso', 'Impresos'],
];
const ESCALAS = [[1,'1×'],[2,'2×'],[3,'3×']];
const LLAVE = 'rm-piezas-v1';

const porId = id => PLANTILLAS.find(p => p.id === id);
const clonar = o => JSON.parse(JSON.stringify(o));

const E = {
  plantilla:'precio', formato:'cuadrado', tono:'azul', escala:1,
  vals:{}, datos:{ whatsapp:'681 879 306', web:'rmgestion.es' },
};
PLANTILLAS.forEach(p => { E.vals[p.id] = clonar(p.def); });

/* --- Persistencia --------------------------------------------------------
   Se guarda en el navegador de quien edita. Puede fallar (ventana privada,
   cookies bloqueadas), así que nunca puede tumbar la página.               */
function guardarLocal(){
  try{ localStorage.setItem(LLAVE, JSON.stringify({ vals:E.vals, datos:E.datos,
    plantilla:E.plantilla, formato:E.formato, tono:E.tono })); }catch(e){}
}
function cargarLocal(){
  try{
    const g = JSON.parse(localStorage.getItem(LLAVE) || 'null');
    if(!g) return;
    aplicarGuardado(g);
  }catch(e){}
}
function aplicarGuardado(g){
  if(g.datos) Object.assign(E.datos, g.datos);
  if(g.vals) for(const id in g.vals) if(E.vals[id]) Object.assign(E.vals[id], g.vals[id]);
  if(g.plantilla && porId(g.plantilla)) E.plantilla = g.plantilla;
  if(g.formato && FORMATOS[g.formato]) E.formato = g.formato;
  if(g.tono && TONOS[g.tono]) E.tono = g.tono;
  const p = porId(E.plantilla);
  if(!p.formatos.includes(E.formato)) E.formato = p.formatos[0];
}

/* --- Construcción de una pieza ------------------------------------------- */
function construir(idPlantilla, idFormato, tono, exportando){
  const p = porId(idPlantilla);
  const fmt = FORMATOS[p.formatos.includes(idFormato) ? idFormato : p.formatos[0]];
  const L = new Lienzo(fmt, tono, E.datos);
  p.render(L, E.vals[p.id]);
  return { L, svg:L.svg(exportando) };
}

/* --- Pintado ------------------------------------------------------------- */
const $ = s => document.querySelector(s);
const cPieza = $('#pieza'), cRail = $('#rail'), cCampos = $('#campos'), cAviso = $('#aviso');

function pintarPieza(){
  const { L, svg } = construir(E.plantilla, E.formato, E.tono, false);
  cPieza.innerHTML = svg;
  const s = cPieza.querySelector('svg');
  /* El SVG se deja escalar por CSS: así la pieza se ve entera sea cual sea
     su tamaño real, sin tocar el viewBox. */
  s.removeAttribute('width'); s.removeAttribute('height');
  const cabe = Math.min(1, 620 / L.W, (window.innerHeight - 220) / L.H);
  s.style.width = Math.round(L.W * Math.max(cabe, 0.15)) + 'px';
  s.style.height = 'auto';
  cPieza.setAttribute('aria-label', 'Vista previa: ' + porId(E.plantilla).nom
    + ', ' + L.W + ' por ' + L.H + ' píxeles');
  const f = FORMATOS[E.formato];
  $('#medida').textContent = L.W + ' × ' + L.H + ' px'
    + (f.ppp ? ' · ' + f.ppp + ' ppp' : '') + ' · ' + f.desc;
}

function miniatura(p){
  const fmt = p.formatos.includes(E.formato) ? E.formato : p.formatos[0];
  const { L, svg } = construir(p.id, fmt, E.tono, true);
  const k = Math.min(100 / L.W, 76 / L.H);
  return svg.replace('<svg ', `<svg width="${Math.round(L.W * k)}" height="${Math.round(L.H * k)}" `);
}
function pintarRail(){
  cRail.innerHTML = FAMILIAS.map(([fam, titulo]) => {
    const lista = PLANTILLAS.filter(p => p.fam === fam);
    if(!lista.length) return '';
    return `<div class="grupo"><div class="grupo-tit">${titulo}</div><div class="miniaturas">`
      + lista.map(p => `<button class="mini" data-p="${p.id}"`
        + ` aria-pressed="${p.id === E.plantilla}">`
        + `<span class="lienzo" data-mini="${p.id}">${miniatura(p)}</span>`
        + `<span class="nom">${esc(p.nom)}</span></button>`).join('')
      + `</div></div>`;
  }).join('');
}
function refrescarMiniActiva(){
  const c = cRail.querySelector(`[data-mini="${E.plantilla}"]`);
  if(c) c.innerHTML = miniatura(porId(E.plantilla));
}

function pintarFormatos(){
  const p = porId(E.plantilla);
  $('#formatos').innerHTML = p.formatos.map(f => {
    const d = FORMATOS[f];
    return `<button data-f="${f}" aria-pressed="${f === E.formato}"`
      + ` title="${esc(d.et + ' · ' + d.desc)}">${esc(d.nom)}</button>`;
  }).join('');
}

/* --- Campos -------------------------------------------------------------- */
function pintarCampos(){
  const p = porId(E.plantilla), v = E.vals[p.id];
  $('#tit-plantilla').textContent = p.nom;
  $('#sub-plantilla').textContent = FAMILIAS.find(f => f[0] === p.fam)[1];

  let html = `<div class="campo"><label>Tono</label><div class="tonos" id="tonos">`
    + Object.entries(TONOS).map(([k, t]) => `<button class="tono" data-t="${k}"`
      + ` aria-pressed="${k === E.tono}"><i style="background:${t.fondo}"></i>`
      + `${t.nom}</button>`).join('') + `</div></div>`;

  for(const [k, et, tipo] of p.campos){
    html += `<div class="campo"><label for="c-${k}">${esc(et)}</label>`;
    if(tipo === 'texto'){
      html += `<input id="c-${k}" data-k="${k}" value="${esc(v[k] || '')}">`;
    } else if(tipo === 'area'){
      const filas = Math.min(5, Math.max(2, Math.ceil((v[k] || '').length / 34)));
      html += `<textarea id="c-${k}" data-k="${k}" rows="${filas}">${esc(v[k] || '')}</textarea>`;
    } else if(tipo === 'lista'){
      html += `<div class="filas" data-lista="${k}">`
        + (v[k] || []).map((it, i) => `<div class="fila">`
          + `<input data-k="${k}" data-i="${i}" value="${esc(it)}" aria-label="${esc(et)} ${i + 1}">`
          + `<button class="quitar" data-quitar="${k}" data-i="${i}" aria-label="Quitar">×</button>`
          + `</div>`).join('')
        + `</div><button class="anadir" data-anadir="${k}">Añadir línea</button>`;
    } else if(tipo === 'pares'){
      html += `<div class="filas" data-lista="${k}">`
        + (v[k] || []).map((par, i) => `<div class="fila">`
          + `<input data-k="${k}" data-i="${i}" data-j="0" value="${esc(par[0])}" aria-label="Concepto ${i + 1}">`
          + `<input class="corto" data-k="${k}" data-i="${i}" data-j="1" value="${esc(par[1])}" aria-label="Valor ${i + 1}">`
          + `<button class="quitar" data-quitar="${k}" data-i="${i}" aria-label="Quitar">×</button>`
          + `</div>`).join('')
        + `</div><button class="anadir" data-anadir="${k}" data-par="1">Añadir línea</button>`;
    }
    html += `</div>`;
  }

  html += `<div class="campo"><label>Contacto de todas las piezas</label>`
    + `<input data-d="whatsapp" value="${esc(E.datos.whatsapp)}" aria-label="WhatsApp">`
    + `<input data-d="web" value="${esc(E.datos.web)}" aria-label="Web">`
    + `<p class="pista">Se usa en el pie de todas las plantillas. Cámbialo aquí una vez y cambia en todas.</p></div>`;

  cCampos.innerHTML = html;
}

/* --- Reacciones ---------------------------------------------------------- */
let temporizador;
function editado(){
  clearTimeout(temporizador);
  temporizador = setTimeout(() => { refrescarMiniActiva(); guardarLocal(); }, 260);
  pintarPieza();
}

cCampos.addEventListener('input', e => {
  const el = e.target, v = E.vals[E.plantilla];
  if(el.dataset.d){ E.datos[el.dataset.d] = el.value; pintarRail(); return editado(); }
  const k = el.dataset.k;
  if(!k) return;
  if(el.dataset.i != null){
    const i = +el.dataset.i;
    if(el.dataset.j != null) v[k][i][+el.dataset.j] = el.value;
    else v[k][i] = el.value;
  } else v[k] = el.value;
  editado();
});
cCampos.addEventListener('click', e => {
  const b = e.target.closest('button'); if(!b) return;
  const v = E.vals[E.plantilla];
  if(b.dataset.t){ E.tono = b.dataset.t; pintarCampos(); pintarRail(); pintarPieza(); guardarLocal(); return; }
  if(b.dataset.anadir){
    const k = b.dataset.anadir;
    v[k] = v[k] || [];
    v[k].push(b.dataset.par ? ['',''] : '');
    pintarCampos(); pintarPieza(); return;
  }
  if(b.dataset.quitar){
    v[b.dataset.quitar].splice(+b.dataset.i, 1);
    pintarCampos(); editado(); return;
  }
});
cRail.addEventListener('click', e => {
  const b = e.target.closest('.mini'); if(!b) return;
  E.plantilla = b.dataset.p;
  const p = porId(E.plantilla);
  if(!p.formatos.includes(E.formato)) E.formato = p.formatos[0];
  cRail.querySelectorAll('.mini').forEach(m =>
    m.setAttribute('aria-pressed', String(m.dataset.p === E.plantilla)));
  pintarFormatos(); pintarCampos(); pintarPieza(); guardarLocal();
  cCampos.parentElement.scrollTop = 0;
});
$('#formatos').addEventListener('click', e => {
  const b = e.target.closest('button'); if(!b) return;
  E.formato = b.dataset.f;
  pintarFormatos(); pintarRail(); pintarPieza(); guardarLocal();
});
window.addEventListener('resize', () => pintarPieza());

/* ==========================================================================
   EXPORTACIÓN
   El SVG que se exporta lleva la tipografía incrustada en base64. Sin eso,
   al rasterizarlo el navegador lo trata como un documento aparte, no ve las
   fuentes de la página y el texto sale con otra letra.
   ========================================================================== */
function svgExportable(){
  return construir(E.plantilla, E.formato, E.tono, true);
}
function nombreArchivo(ext){
  return ['rm', E.plantilla, E.formato.toLowerCase(), E.tono].join('-') + '.' + ext;
}
function rasterizar(svg, W, H, mime, calidad){
  return new Promise((cumple, falla) => {
    const url = URL.createObjectURL(new Blob([svg], { type:'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = Math.round(W * E.escala); c.height = Math.round(H * E.escala);
      const x = c.getContext('2d');
      /* JPG no tiene transparencia: si no se rellena antes, lo que quede sin
         pintar sale negro. */
      x.fillStyle = TONOS[E.tono].fondo; x.fillRect(0, 0, c.width, c.height);
      x.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob(b => b ? cumple(b) : falla(new Error('no se pudo generar la imagen')), mime, calidad);
    };
    img.onerror = () => { URL.revokeObjectURL(url); falla(new Error('no se pudo leer el SVG')); };
    img.src = url;
  });
}

function aviso(txt, mal){
  cAviso.textContent = txt;
  cAviso.classList.toggle('mal', !!mal);
}
const MENSAJES = {
  declined:'Descarga cancelada.',
  rate_limited:'Espera un momento y vuelve a intentarlo.',
  too_large:'El archivo pasa de 16 MB. Baja la resolución.',
  extension_not_enabled:'Este formato no está habilitado en tu visor. Descárgalo en PNG.',
  rejected_extension:'Este formato no está habilitado en tu visor. Descárgalo en PNG.',
};
async function entregar(nombre, datos){
  if(!window.claude || !window.claude.downloads){
    aviso('Las descargas no están disponibles en esta vista.', true); return false;
  }
  try{
    await window.claude.downloads.save({ filename:nombre, data:datos });
    aviso('Guardado como ' + nombre + '.');
    return true;
  }catch(err){
    aviso(MENSAJES[err && err.code] || 'No se pudo guardar el archivo.', true);
    return false;
  }
}

async function bajar(tipo){
  const botones = document.querySelectorAll('.fmt');
  botones.forEach(b => b.disabled = true);
  try{
    if(tipo === 'pdf') return await imprimir();
    const { L, svg } = svgExportable();
    if(tipo === 'svg'){
      aviso('Preparando el vectorial…');
      return await entregar(nombreArchivo('svg'), svg);
    }
    const mime = { png:'image/png', jpg:'image/jpeg', webp:'image/webp' }[tipo];
    aviso('Rasterizando a ' + Math.round(L.W * E.escala) + ' × '
      + Math.round(L.H * E.escala) + ' px…');
    const blob = await rasterizar(svg, L.W, L.H, mime, tipo === 'png' ? undefined : 0.92);
    await entregar(nombreArchivo(tipo === 'jpg' ? 'jpg' : tipo), blob);
  }catch(err){
    aviso('No se pudo generar el archivo: ' + err.message, true);
  }finally{
    botones.forEach(b => b.disabled = false);
  }
}

async function copiar(){
  const botones = document.querySelectorAll('.fmt');
  botones.forEach(b => b.disabled = true);
  try{
    const { L, svg } = svgExportable();
    const blob = await rasterizar(svg, L.W, L.H, 'image/png');
    await navigator.clipboard.write([new ClipboardItem({ 'image/png':blob })]);
    aviso('Copiado. Ya puedes pegarlo donde quieras.');
  }catch(err){
    aviso('Tu navegador no deja copiar imágenes desde aquí. Descárgala en PNG.', true);
  }finally{
    botones.forEach(b => b.disabled = false);
  }
}

/* PDF por impresión. Es la vía que da un PDF con el texto VECTORIAL, que es
   lo que quiere una imprenta; un PDF con la imagen dentro pesaría más y se
   vería peor. La página de impresión se dimensiona al tamaño exacto de la
   pieza para que salga sin márgenes ni reencuadres. */
let estilaPrint;
async function imprimir(){
  const { L, svg } = svgExportable();
  const f = FORMATOS[E.formato];
  const medida = f.ppp
    ? (L.W / f.ppp * 25.4).toFixed(1) + 'mm ' + (L.H / f.ppp * 25.4).toFixed(1) + 'mm'
    : L.W + 'px ' + L.H + 'px';
  if(!estilaPrint){ estilaPrint = document.createElement('style'); document.head.append(estilaPrint); }
  estilaPrint.textContent = '@page{size:' + medida + ';margin:0}';
  const antes = cPieza.innerHTML;
  cPieza.innerHTML = svg;               /* sin las guías de recorte */
  const s = cPieza.querySelector('svg');
  s.removeAttribute('width'); s.removeAttribute('height');
  aviso('Se abre el diálogo de impresión: elige «Guardar como PDF».');
  try{ window.print(); }
  catch(e){ aviso('Tu visor no permite imprimir. Descarga el SVG y ábrelo para imprimir.', true); }
  setTimeout(() => { cPieza.innerHTML = antes; pintarPieza(); }, 400);
}

document.querySelector('.formatos').addEventListener('click', e => {
  const b = e.target.closest('[data-bajar]'); if(!b) return;
  if(b.dataset.bajar === 'copiar') copiar(); else bajar(b.dataset.bajar);
});

/* --- Resolución ---------------------------------------------------------- */
$('#escalas').innerHTML = ESCALAS.map(([v, et]) =>
  `<button data-e="${v}" aria-pressed="${v === E.escala}">${et}</button>`).join('');
$('#escalas').addEventListener('click', e => {
  const b = e.target.closest('button'); if(!b) return;
  E.escala = +b.dataset.e;
  $('#escalas').querySelectorAll('button').forEach(x =>
    x.setAttribute('aria-pressed', String(+x.dataset.e === E.escala)));
  const L = FORMATOS[E.formato];
  aviso('Las imágenes saldrán a ' + Math.round(L.w * E.escala) + ' × '
    + Math.round(L.h * E.escala) + ' px.');
});

/* --- Guardar y recuperar los textos -------------------------------------- */
$('#guardar-textos').addEventListener('click', () =>
  entregar('rm-piezas-textos.json', JSON.stringify({ vals:E.vals, datos:E.datos }, null, 2)));
$('#cargar-textos').addEventListener('click', () => $('#fichero').click());
$('#fichero').addEventListener('change', async e => {
  const f = e.target.files[0]; if(!f) return;
  try{
    aplicarGuardado(JSON.parse(await f.text()));
    pintarFormatos(); pintarCampos(); pintarRail(); pintarPieza(); guardarLocal();
    aviso('Textos cargados.');
  }catch(err){ aviso('Ese archivo no es un guardado válido.', true); }
  e.target.value = '';
});
$('#reiniciar').addEventListener('click', () => {
  E.vals[E.plantilla] = clonar(porId(E.plantilla).def);
  pintarCampos(); refrescarMiniActiva(); pintarPieza(); guardarLocal();
  aviso('Restaurado el texto original de esta plantilla.');
});

/* --- Arranque ------------------------------------------------------------
   Se espera a que la tipografía esté cargada: las roturas de línea se
   calculan midiendo con ella, y si se mide con la de reserva el texto se
   parte donde no toca. */
$('#marca-mini').innerHTML =
  `<svg width="30" height="30" viewBox="0 0 100 100" aria-hidden="true">`
  + `<path d="${TESELA}" fill="${MARCA.azul}"/><path d="${FRANJA}" fill="${MARCA.naranja}"/>`
  + `<path d="${LETRA_R}" fill="#fff"/><path d="${LETRA_M}" fill="#fff" stroke="${MARCA.azul}"`
  + ` stroke-width="4.5" paint-order="stroke"/></svg>`;

cargarLocal();
function arrancar(){
  pintarFormatos(); pintarCampos(); pintarRail(); pintarPieza();
  aviso('Todo listo. Elige una plantilla y edita el texto.');
}
if(document.fonts && document.fonts.load){
  Promise.all([document.fonts.load("800 100px 'PJS'"), document.fonts.load("500 100px 'PJS'")])
    .then(arrancar).catch(arrancar);
} else arrancar();

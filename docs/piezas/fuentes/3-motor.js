/* ==========================================================================
   MOTOR
   Cada pieza se dibuja como un SVG construido a mano. Se hace así, y no con
   HTML, por tres razones que mandan sobre la comodidad: el SVG se descarga
   tal cual como vectorial para imprenta, se rasteriza a PNG/JPG/WEBP a
   cualquier resolución sin volver a maquetar, y al imprimirlo el texto sigue
   siendo texto. El precio a pagar es que en SVG el texto NO fluye solo: hay
   que medirlo y romperlo en líneas nosotros. De eso va la primera mitad.
   ========================================================================== */

const MARCA = {
  azul:'#0a1f44', azulHondo:'#060f24', naranja:'#f97316',
  blanco:'#ffffff', crema:'#f2f6fb',
  claroSuave:'#8fa6cc',   /* texto secundario sobre azul */
  oscuroSuave:'#53637f',  /* texto secundario sobre claro */
};

/* Geometría del logo. Son los mismos trazados que public/marca/ en el
   repositorio: si el logo cambia allí, hay que traerlos aquí. */
const TESELA = 'M24 0H76A24 24 0 0 1 100 24V62A38 38 0 0 1 62 100H24A24 24 0 0 1 0 76V24A24 24 0 0 1 24 0Z';
const FRANJA = 'M100 62A38 38 0 0 1 62 100L62 86A24 24 0 0 0 86 62Z';
const LETRA_R = 'M15.00 66.00V28.47H29.36Q33.24 28.47 36.24 29.83Q39.23 31.19 40.95 33.86Q42.66 36.53 42.66 40.46Q42.66 44.29 40.90 46.98Q39.13 49.68 36.16 51.04L44.73 66.00H35.96L26.69 49.42L31.73 52.40H22.81V66.00ZM22.81 45.60H29.41Q31.07 45.60 32.28 44.94Q33.49 44.29 34.17 43.13Q34.85 41.97 34.85 40.46Q34.85 38.89 34.17 37.74Q33.49 36.58 32.28 35.92Q31.07 35.27 29.41 35.27H22.81Z';
const LETRA_M = 'M41.70 66.00V28.47H49.26L63.32 47.11H59.79L73.44 28.47H81.00V66.00H73.19V37.08L76.31 37.79L61.85 56.43H60.85L46.89 37.79L49.51 37.08V66.00Z';

const CAP = 0.745;            /* altura de mayúscula de Plus Jakarta Sans */
const esc = s => String(s ?? '')
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const n = v => Math.round(v * 100) / 100;

/* --- Medición ------------------------------------------------------------
   Un canvas fuera de pantalla mide con la MISMA fuente que luego dibuja el
   SVG, así que las roturas de línea coinciden con lo que se ve.            */
const _medidor = document.createElement('canvas').getContext('2d');
function ancho(txt, peso, tam, track = 0){
  _medidor.font = peso + ' ' + tam + "px 'PJS', sans-serif";
  const a = _medidor.measureText(txt).width;
  return a + (track * tam * Math.max(0, txt.length - 1));
}
/* Alto real de la tinta de un texto, de la cima al pie del trazo. Hace falta
   para colocar signos sueltos (una comilla grande, un símbolo) que no llegan
   ni a la altura de mayúscula ni a la línea base. */
function mancha(txt, peso, tam){
  _medidor.font = peso + ' ' + tam + "px 'PJS', sans-serif";
  const m = _medidor.measureText(txt);
  const sube = m.actualBoundingBoxAscent || tam * CAP;
  const baja = m.actualBoundingBoxDescent || 0;
  return { alto:sube, bajo:baja, total:sube + baja };
}
function romper(txt, peso, tam, maxAncho, track = 0){
  const lineas = [];
  for(const parrafo of String(txt ?? '').split('\n')){
    if(!parrafo.trim()){ lineas.push(''); continue; }
    let linea = '';
    for(const palabra of parrafo.trim().split(/\s+/)){
      const prueba = linea ? linea + ' ' + palabra : palabra;
      if(!linea || ancho(prueba, peso, tam, track) <= maxAncho) linea = prueba;
      else { lineas.push(linea); linea = palabra; }
    }
    if(linea) lineas.push(linea);
  }
  return lineas;
}
/* Reduce el cuerpo hasta que el texto quepa en las líneas permitidas. Es lo
   que evita que un titular largo se salga de la pieza: la plantilla no se
   rompe, se ajusta. */
function encajar(txt, peso, tamIdeal, maxAncho, maxLineas, minTam){
  let tam = tamIdeal;
  let lineas = romper(txt, peso, tam, maxAncho);
  while(lineas.length > maxLineas && tam > minTam){
    tam = Math.max(minTam, tam - Math.max(1, tamIdeal * 0.035));
    lineas = romper(txt, peso, tam, maxAncho);
  }
  return { tam, lineas };
}

/* --- Tonos ---------------------------------------------------------------
   El naranja nunca es fondo: la regla de marca lo reserva para acción y
   jerarquía. Por eso los tres tonos juegan con azul, crema y blanco, y el
   naranja entra siempre como acento sobre ellos.                           */
const TONOS = {
  azul:   { nom:'Azul',   fondo:MARCA.azul,   tinta:MARCA.blanco, suave:MARCA.claroSuave,
            acento:MARCA.naranja, contra:MARCA.blanco, tesela:MARCA.blanco, letras:MARCA.azul,
            linea:'rgba(255,255,255,.18)', chip:'rgba(255,255,255,.08)' },
  claro:  { nom:'Crema',  fondo:MARCA.crema,  tinta:MARCA.azul,   suave:MARCA.oscuroSuave,
            acento:MARCA.naranja, contra:MARCA.azul,  tesela:MARCA.azul,  letras:MARCA.blanco,
            linea:'rgba(10,31,68,.14)', chip:'rgba(10,31,68,.05)' },
  blanco: { nom:'Blanco', fondo:MARCA.blanco, tinta:MARCA.azul,   suave:MARCA.oscuroSuave,
            acento:MARCA.naranja, contra:MARCA.azul,  tesela:MARCA.azul,  letras:MARCA.blanco,
            linea:'rgba(10,31,68,.12)', chip:'rgba(10,31,68,.04)' },
};

/* --- Formatos ------------------------------------------------------------
   Medidas reales de exportación. Los impresos van a 300 ppp con 3 mm de
   sangre por lado, que es lo que pide cualquier imprenta.                  */
const FORMATOS = {
  cuadrado: { w:1080, h:1080, nom:'1:1',  et:'Cuadrado',  desc:'Feed de Instagram y Facebook' },
  vertical: { w:1080, h:1350, nom:'4:5',  et:'Vertical',  desc:'El que más pantalla ocupa en el feed' },
  historia: { w:1080, h:1920, nom:'9:16', et:'Historia',  desc:'Stories y reels' },
  apaisado: { w:1920, h:1080, nom:'16:9', et:'Apaisado',  desc:'YouTube, presentaciones, web' },

  perfil:   { w:1080, h:1080, nom:'Perfil', et:'Avatar',  desc:'Se recorta en círculo' },

  portadaFb:{ w:1640, h:624,  nom:'Facebook', et:'820×312', desc:'Portada de página' },
  portadaLi:{ w:1584, h:396,  nom:'LinkedIn', et:'1584×396', desc:'Portada de empresa' },
  portadaX: { w:1500, h:500,  nom:'X',        et:'1500×500', desc:'Cabecera de perfil' },
  portadaYt:{ w:2560, h:1440, nom:'YouTube',  et:'2560×1440', desc:'Arte de canal' },

  tarjeta:  { w:1075, h:720,  nom:'Tarjeta', et:'85×55 mm', desc:'Con 3 mm de sangre · 300 ppp', ppp:300, sangre:35 },
  a5:       { w:1784, h:2516, nom:'A5',      et:'148×210 mm', desc:'Flyer · con sangre · 300 ppp', ppp:300, sangre:35 },
  a4:       { w:2516, h:3543, nom:'A4',      et:'210×297 mm', desc:'Cartel · con sangre · 300 ppp', ppp:300, sangre:35 },
  rollup:   { w:1772, h:4252, nom:'Roll-up', et:'85×200 cm', desc:'150 ppp a tamaño real', ppp:150, sangre:0 },
};

/* ==========================================================================
   LIENZO
   Un flujo vertical sencillo: cada bloque se dibuja donde está el cursor y
   lo empuja hacia abajo. El pie se ancla al fondo, no al flujo.
   ========================================================================== */
class Lienzo{
  constructor(fmt, tono, datos){
    this.W = fmt.w; this.H = fmt.h; this.fmt = fmt;
    this.t = TONOS[tono] || TONOS.azul;
    this.d = datos;
    const menor = Math.min(this.W, this.H);
    this.sangre = fmt.sangre || 0;
    this.pad = Math.round(menor * 0.082) + this.sangre;
    /* Unidad tipográfica: el texto escala con el ANCHO, así que una historia
       y un cuadrado de 1080 tienen el mismo cuerpo aunque midan distinto. En
       un formato apaisado manda el ALTO: si no, el cuerpo crece con lo ancho
       que sea la pieza y el contenido se come el pie. */
    const proporcion = this.W / this.H;
    this.ancha = proporcion > 1.35;
    this.u = (this.ancha ? this.H : this.W) / 1080;
    this.capa0 = [];   /* fondo y decoración */
    this.capa1 = [];   /* contenido */
    this.capaGuia = []; /* guías de recorte: se ven al editar, no se exportan */
    this.y = this.pad;
    /* En apaisado la columna de texto se limita: una línea de 1744 px de
       ancho no hay quien la lea. El hueco que queda a la derecha es donde
       vive la esquina de marca. */
    this.max = Math.min(this.W - this.pad * 2, this.ancha ? 1150 * this.u : Infinity);
    this.der = this.pad + this.max;
    /* Caja de seguridad: donde el contenido está a salvo del recorte. Por
       defecto es el lienzo menos el margen; los formatos anchos traen la suya. */
    this.caja = fmt.caja
      ? { ...fmt.caja }
      : { x:this.pad, y:this.pad, w:this.max, h:this.H - this.pad * 2, u:this.u };
    this.capa0.push(`<rect width="${this.W}" height="${this.H}" fill="${this.t.fondo}"/>`);
  }

  /* -- primitivas -- */
  txt(x, base, s, o = {}){
    const { peso = 600, tam = 32, fill = this.t.tinta, ancla = 'start', track = 0, op } = o;
    return `<text x="${n(x)}" y="${n(base)}" font-family="PJS" font-weight="${peso}"`
      + ` font-size="${n(tam)}" fill="${fill}"`
      + (ancla !== 'start' ? ` text-anchor="${ancla}"` : '')
      + (track ? ` letter-spacing="${n(track * tam)}"` : '')
      + (op != null ? ` opacity="${op}"` : '')
      + `>${esc(s)}</text>`;
  }
  /* Dibuja un bloque de líneas desde `arriba` (borde superior de la
     mayúscula) y devuelve la altura que ha ocupado. */
  bloque(lineas, arriba, o = {}){
    const { tam = 32, interlinea = 1.22, x = this.pad, ancla = 'start' } = o;
    lineas.forEach((l, i) => {
      if(l) this.capa1.push(this.txt(x, arriba + CAP * tam + i * interlinea * tam, l, o));
    });
    return (lineas.length - 1) * interlinea * tam + tam;
  }

  /* -- bloques de contenido -- */
  antetitulo(s){
    if(!s) return this;
    const tam = 22 * this.u;
    this.capa1.push(this.txt(this.pad, this.y + CAP * tam, s.toUpperCase(),
      { peso:800, tam, fill:this.t.acento, track:0.13 }));
    this.y += tam + 26 * this.u;
    return this;
  }
  titular(s, ideal = 82, maxLineas = 3){
    if(!s) return this;
    const { tam, lineas } = encajar(s, 800, ideal * this.u, this.max, maxLineas, 30 * this.u);
    this.y += this.bloque(lineas, this.y, { tam, peso:800, interlinea:1.13, track:-0.02 });
    this.y += 22 * this.u;
    return this;
  }
  cifra(s, sufijo, ideal = 250){
    if(!s) return this;
    let tam = ideal * this.u;
    const suf = sufijo || '';
    const anchoSuf = suf ? ancho(suf, 800, tam * 0.36) + tam * 0.05 : 0;
    while(ancho(s, 800, tam, -0.035) + anchoSuf > this.max && tam > 60 * this.u) tam *= 0.96;
    const base = this.y + CAP * tam;
    this.capa1.push(this.txt(this.pad, base, s, { peso:800, tam, track:-0.035 }));
    if(suf){
      const x = this.pad + ancho(s, 800, tam, -0.035) + tam * 0.04;
      this.capa1.push(this.txt(x, base, suf, { peso:800, tam:tam * 0.36, fill:this.t.acento }));
    }
    this.y += tam + 24 * this.u;
    return this;
  }
  cuerpo(s, ideal = 34, o = {}){
    if(!s) return this;
    const tam = ideal * this.u;
    const anchoMax = o.ancho || Math.min(this.max, 760 * this.u);
    const peso = o.peso ?? 500;
    const lineas = romper(s, peso, tam, anchoMax);
    this.y += this.bloque(lineas, this.y, { tam, peso, interlinea:1.42,
      fill:o.fill || this.t.suave });
    this.y += 22 * this.u;
    return this;
  }
  destacado(s, ideal = 40){
    return this.cuerpo(s, ideal, { peso:700, fill:this.t.tinta });
  }
  regla(anchoRel = 0.16){
    this.y += 8 * this.u;
    this.capa1.push(`<rect x="${this.pad}" y="${n(this.y)}" width="${n(this.max * anchoRel)}"`
      + ` height="${n(6 * this.u)}" fill="${this.t.acento}"/>`);
    this.y += 6 * this.u + 30 * this.u;
    return this;
  }
  espacio(px){ this.y += px * this.u; return this; }

  /* Lista con marca de verificación. El check va dibujado como trazado: el
     carácter ✓ no existe en el subconjunto latino de la tipografía. */
  lista(items, ideal = 32){
    const tam = ideal * this.u;
    const salto = tam * 1.95;
    items.filter(Boolean).forEach((it, i) => {
      const cy = this.y + i * salto + CAP * tam * 0.55;
      const r = tam * 0.52;
      this.capa1.push(
        `<circle cx="${n(this.pad + r)}" cy="${n(cy)}" r="${n(r)}" fill="${this.t.acento}"/>`,
        `<path d="M${n(this.pad + r - r * 0.42)} ${n(cy)}l${n(r * 0.3)} ${n(r * 0.32)}`
        + `l${n(r * 0.55)} ${n(-r * 0.62)}" fill="none" stroke="${this.t.fondo}"`
        + ` stroke-width="${n(r * 0.3)}" stroke-linecap="round" stroke-linejoin="round"/>`);
      const lineas = romper(it, 600, tam, this.max - r * 2 - tam * 0.7);
      this.bloque(lineas, this.y + i * salto, { tam, peso:600, interlinea:1.3,
        x:this.pad + r * 2 + tam * 0.7, fill:this.t.tinta });
    });
    this.y += items.filter(Boolean).length * salto + 10 * this.u;
    return this;
  }
  /* Filas «concepto ......... precio», separadas por hilo. */
  precios(filas, ideal = 34){
    const tam = ideal * this.u;
    const alto = tam * 2.15;
    filas.filter(f => f && f[0]).forEach((f, i) => {
      const base = this.y + i * alto + CAP * tam + tam * 0.42;
      this.capa1.push(this.txt(this.pad, base, f[0], { peso:700, tam, fill:this.t.tinta }));
      this.capa1.push(this.txt(this.der, base, f[1],
        { peso:800, tam, fill:this.t.acento, ancla:'end' }));
      this.capa1.push(`<rect x="${this.pad}" y="${n(this.y + i * alto + alto - 2)}"`
        + ` width="${n(this.max)}" height="2" fill="${this.t.linea}"/>`);
    });
    this.y += filas.filter(f => f && f[0]).length * alto + 14 * this.u;
    return this;
  }
  /* Pasos numerados. El número va en naranja porque es jerarquía, no adorno:
     dice en qué orden pasan las cosas. */
  pasos(items, ideal = 32){
    const tam = ideal * this.u;
    const dia = tam * 1.85;
    let cursor = this.y;
    items.filter(Boolean).forEach((it, i) => {
      this.capa1.push(
        `<circle cx="${n(this.pad + dia / 2)}" cy="${n(cursor + dia / 2)}" r="${n(dia / 2)}"`
        + ` fill="${this.t.acento}"/>`,
        this.txt(this.pad + dia / 2, cursor + dia / 2 + CAP * tam * 0.95 / 2, String(i + 1),
          { peso:800, tam:tam * 0.95, fill:MARCA.azul, ancla:'middle' }));
      const x = this.pad + dia + tam * 0.8;
      const lineas = romper(it, 600, tam, this.max - dia - tam * 0.8);
      const alto = this.bloque(lineas, cursor + (dia - tam) / 2 + tam * 0.06,
        { tam, peso:600, interlinea:1.3, x, fill:this.t.tinta });
      cursor += Math.max(dia, alto) + tam * 0.85;
    });
    this.y = cursor + 10 * this.u;
    return this;
  }

  /* -- marca -- */
  simbolo(x, y, px, invertido){
    const tesela = invertido ? this.t.letras : this.t.tesela;
    const letras = invertido ? this.t.tesela : this.t.letras;
    const k = px / 100;
    return `<g transform="translate(${n(x)} ${n(y)}) scale(${n(k)})">`
      + `<path d="${TESELA}" fill="${tesela}"/>`
      + `<path d="${FRANJA}" fill="${MARCA.naranja}"/>`
      + `<path d="${LETRA_R}" fill="${letras}"/>`
      + `<path d="${LETRA_M}" fill="${letras}" stroke="${tesela}" stroke-width="4.5"`
      + ` paint-order="stroke"/></g>`;
  }
  /* La esquina curvada del logo, ampliada a escala de cartel. Es el elemento
     que hace que dos piezas de distinto color se lean como la misma marca. */
  esquina(escala = 1){
    const menor = Math.min(this.W, this.H);
    const r = menor * 0.25 * escala;
    const banda = menor * 0.088 * escala;
    const cx = this.W - r, cy = this.H - r, ri = r - banda;
    this.capa0.push(
      `<path d="M${n(this.W)} ${n(cy)}A${n(r)} ${n(r)} 0 0 1 ${n(cx)} ${n(this.H)}`
      + `L${n(this.W)} ${n(this.H)}Z" fill="${this.t.contra}"/>`,
      `<path d="M${n(this.W)} ${n(cy)}A${n(r)} ${n(r)} 0 0 1 ${n(cx)} ${n(this.H)}`
      + `L${n(cx)} ${n(this.H - banda)}A${n(ri)} ${n(ri)} 0 0 0 ${n(this.W - banda)} ${n(cy)}Z"`
      + ` fill="${MARCA.naranja}"/>`);
    this.anchoPie = this.W - this.pad - r * 0.82;
    return this;
  }
  /* Pie de contacto anclado al fondo. Devuelve su borde superior para que el
     contenido sepa dónde tiene que parar. */
  pie(o = {}){
    const d = this.d, u = this.u;
    const px = (o.px || 66) * u;
    const tam = 27 * u;
    const base = this.H - this.pad - (o.baja || 0);
    const x = this.pad;
    this.capa1.push(this.simbolo(x, base - px, px));
    const tx = x + px + 22 * u;
    if(d.whatsapp) this.capa1.push(this.txt(tx, base - px + CAP * tam + px * 0.09,
      'WhatsApp ' + d.whatsapp, { peso:800, tam, fill:this.t.tinta }));
    if(d.web) this.capa1.push(this.txt(tx, base - px + CAP * tam + px * 0.09 + tam * 1.35,
      d.web, { peso:600, tam:tam * 0.82, fill:this.t.suave }));
    return base - px - 34 * u;
  }

  svg(paraExportar){
    const fuente = paraExportar
      ? `<defs><style>@font-face{font-family:'PJS';src:url(data:font/woff2;base64,${FUENTE_B64}) format('woff2');font-weight:200 800;}</style></defs>`
      : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.W}" height="${this.H}"`
      + ` viewBox="0 0 ${this.W} ${this.H}">${fuente}`
      + this.capa0.join('') + this.capa1.join('')
      + (paraExportar ? '' : this.capaGuia.join('')) + `</svg>`;
  }
}

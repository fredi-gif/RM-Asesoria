/* --- Flujo vertical ajustable --------------------------------------------
   Una historia mide 1920 y un cuadrado 1080 con el mismo texto dentro. Sin
   esto el contenido se apelmaza arriba y deja un agujero. Se marca el tramo
   de contenido y al cerrarlo se desplaza en bloque dentro del hueco libre. */
Lienzo.prototype.abrirFlujo = function(){
  this._ini = this.capa1.length; this._y0 = this.y; return this;
};
Lienzo.prototype.cerrarFlujo = function(tope, modo = 'centro'){
  if(this._ini == null) return this;
  const alto = this.y - this._y0;
  const hueco = (tope ?? this.H - this.pad) - this._y0;
  let dy = 0;
  if(modo === 'centro') dy = Math.max(0, (hueco - alto) / 2);
  else if(modo === 'abajo') dy = Math.max(0, hueco - alto);
  if(dy > 1){
    const trozo = this.capa1.splice(this._ini);
    this.capa1.push(`<g transform="translate(0 ${n(dy)})">` + trozo.join('') + `</g>`);
  }
  this._ini = null; return this;
};
/* Dos columnas enfrentadas. La de la derecha lleva el hilo naranja porque es
   la que queremos que gane la comparación. */
Lienzo.prototype.dosColumnas = function(izq, der, ideal = 28){
  const tam = ideal * this.u;
  const gap = 46 * this.u;
  const anchoCol = (this.max - gap) / 2;
  const cols = [izq, der];
  let maxAlto = 0;
  cols.forEach((c, ci) => {
    const x = this.pad + ci * (anchoCol + gap);
    const color = ci === 1 ? this.t.acento : this.t.suave;
    this.capa1.push(`<rect x="${n(x)}" y="${n(this.y)}" width="${n(anchoCol)}"`
      + ` height="${n(5 * this.u)}" fill="${color}"/>`);
    let cy = this.y + 5 * this.u + 22 * this.u;
    const tit = romper(c.titulo || '', 800, tam * 1.15, anchoCol);
    cy += this.bloque(tit, cy, { tam:tam * 1.15, peso:800, x, interlinea:1.18,
      fill:ci === 1 ? this.t.tinta : this.t.suave });
    cy += 20 * this.u;
    (c.items || []).filter(Boolean).forEach(it => {
      const ls = romper(it, 500, tam, anchoCol);
      cy += this.bloque(ls, cy, { tam, peso:500, x, interlinea:1.35,
        fill:ci === 1 ? this.t.tinta : this.t.suave });
      cy += 15 * this.u;
    });
    maxAlto = Math.max(maxAlto, cy - this.y);
  });
  this.y += maxAlto + 16 * this.u;
  return this;
};

/* ==========================================================================
   PLANTILLAS
   Cada una declara qué campos edita el cliente y cómo se dibuja. Los textos
   por defecto salen de los datos reales de la web: precios, plazos y
   preguntas frecuentes que ya están publicados.
   ========================================================================== */
const SOCIAL = ['cuadrado','vertical','historia','apaisado'];
const PLANTILLAS = [

/* ---------- 1 · Precio ---------- */
{ id:'precio', fam:'social', nom:'Precio', formatos:SOCIAL,
  campos:[
    ['antetitulo','Antetítulo','texto'],
    ['cifra','Cifra','texto'], ['sufijo','Símbolo','texto'],
    ['frase','Frase','area'],
    ['bullets','Lo que incluye','lista'],
    ['nota','Letra pequeña','area'],
  ],
  def:{ antetitulo:'Transferencia de vehículo', cifra:'145', sufijo:'€',
    frase:'Tasas de la DGT y gestión incluidas.',
    bullets:['Permiso provisional el mismo día','Sin cita previa y sin desplazarte','Presentada en 24-48 h'],
    nota:'+ Impuesto de Transmisiones, según tu comunidad autónoma' },
  render(L, v){
    L.esquina(); L.topePie = L.pie();
    L.abrirFlujo().antetitulo(v.antetitulo).cifra(v.cifra, v.sufijo).destacado(v.frase, 42);
    L.cerrarFlujo(null, 'arriba');
    /* La lista y la letra pequeña se anclan abajo, pero nunca por encima de
       donde acaba la cabecera: si el cliente añade líneas, empujan hacia
       abajo en vez de solaparse. */
    const puntos = v.bullets.filter(Boolean);
    const altoNota = v.nota ? 66 * L.u : 0;
    const altoLista = puntos.length * 32 * 1.95 * L.u;
    L.y = Math.max(L.y + 26 * L.u, L.topePie - altoNota - altoLista);
    if(puntos.length) L.lista(puntos);
    if(v.nota){
      L.y = Math.max(L.y, L.topePie - altoNota + 10 * L.u);
      L.cuerpo(v.nota, 20, { ancho:L.anchoPie - L.pad });
    }
  } },

/* ---------- 2 · Dato ---------- */
{ id:'dato', fam:'social', nom:'Dato', formatos:SOCIAL,
  campos:[
    ['antetitulo','Antetítulo','texto'],
    ['cifra','El dato','texto'],
    ['frase','Qué significa','area'],
    ['cuerpo','Explicación','area'],
  ],
  def:{ antetitulo:'Acabas de comprar un coche', cifra:'30 días',
    frase:'es lo que te da la ley para ponerlo a tu nombre.',
    cuerpo:'Cuentan desde la fecha del contrato. Pasado el plazo, la DGT puede sancionar — y hasta que no se transfiere, las multas siguen siendo del vendedor.' },
  render(L, v){
    L.esquina(); L.topePie = L.pie();
    L.abrirFlujo().antetitulo(v.antetitulo).cifra(v.cifra, '', 190)
      .destacado(v.frase, 46).espacio(14).cuerpo(v.cuerpo, 28);
    L.cerrarFlujo(L.topePie, 'centro');
  } },

/* ---------- 3 · Tarifa ---------- */
{ id:'tarifa', fam:'social', nom:'Tarifa', formatos:SOCIAL,
  campos:[
    ['titular','Titular','area'],
    ['filas','Precios','pares'],
    ['nota','Letra pequeña','area'],
  ],
  def:{ titular:'Todo el papeleo de tu coche, online',
    filas:[['Transferencia','desde 145 €'],['Notificación de venta','desde 94 €'],
      ['Informe de la DGT','15 €'],['Matriculación','desde 197 €'],
      ['Duplicado del permiso','106 €']],
    nota:'Precios con IVA y tasas de la DGT incluidas. Los impuestos de cada operación van aparte.' },
  render(L, v){
    L.esquina(); L.topePie = L.pie();
    L.abrirFlujo().titular(v.titular, 62, 2).espacio(10).precios(v.filas);
    L.cerrarFlujo(null, 'arriba');
    if(v.nota){
      L.y = Math.max(L.y + 16 * L.u, L.topePie - 66 * L.u);
      L.cuerpo(v.nota, 20, { ancho:L.anchoPie - L.pad });
    }
  } },

/* ---------- 4 · Pregunta frecuente ---------- */
{ id:'faq', fam:'social', nom:'Pregunta', formatos:SOCIAL,
  campos:[
    ['antetitulo','Antetítulo','texto'],
    ['titular','La pregunta','area'],
    ['cuerpo','La respuesta','area'],
  ],
  def:{ antetitulo:'Pregunta frecuente', titular:'¿Quién paga la transferencia?',
    cuerpo:'Por norma general el comprador, que es quien asume las tasas de la DGT y el Impuesto de Transmisiones. Es un acuerdo entre las partes y puede pactarse de otra forma en el contrato.' },
  render(L, v){
    L.esquina(); L.topePie = L.pie();
    L.abrirFlujo().antetitulo(v.antetitulo).titular(v.titular, 76, 3).regla()
      .cuerpo(v.cuerpo, 30);
    L.cerrarFlujo(L.topePie, 'centro');
  } },

/* ---------- 5 · Documentos ---------- */
{ id:'checklist', fam:'social', nom:'Documentos', formatos:SOCIAL,
  campos:[
    ['antetitulo','Antetítulo','texto'],
    ['titular','Titular','area'],
    ['bullets','La lista','lista'],
  ],
  def:{ antetitulo:'Transferencia', titular:'Lo que necesitamos de ti',
    bullets:['DNI o NIE del comprador y del vendedor','Permiso de circulación',
      'Ficha técnica con la ITV en vigor','Contrato de compraventa firmado',
      'Justificante del impuesto de circulación'] },
  render(L, v){
    L.esquina(); L.topePie = L.pie();
    L.abrirFlujo().antetitulo(v.antetitulo).titular(v.titular, 66, 2).espacio(6)
      .lista(v.bullets, 30);
    L.cerrarFlujo(L.topePie, 'centro');
  } },

/* ---------- 6 · Cómo funciona ---------- */
{ id:'pasos', fam:'social', nom:'Pasos', formatos:SOCIAL,
  campos:[
    ['antetitulo','Antetítulo','texto'],
    ['titular','Titular','area'],
    ['bullets','Los pasos, en orden','lista'],
  ],
  def:{ antetitulo:'Cómo funciona', titular:'Tres pasos y ya está',
    bullets:['Nos cuentas el caso por WhatsApp y te decimos qué trámite necesitas y cuánto cuesta.',
      'Nos mandas fotos de la documentación desde el móvil. No hace falta escanear nada.',
      'Presentamos el expediente y recibes el permiso provisional el mismo día.'] },
  render(L, v){
    L.esquina(); L.topePie = L.pie();
    L.abrirFlujo().antetitulo(v.antetitulo).titular(v.titular, 66, 2).espacio(10)
      .pasos(v.bullets, 29);
    L.cerrarFlujo(L.topePie, 'centro');
  } },

/* ---------- 7 · Comparativa ---------- */
{ id:'comparativa', fam:'social', nom:'Comparativa', formatos:SOCIAL,
  campos:[
    ['titular','Titular','area'],
    ['tituloA','Columna izquierda','texto'], ['itemsA','Puntos de la izquierda','lista'],
    ['tituloB','Columna derecha','texto'], ['itemsB','Puntos de la derecha','lista'],
  ],
  def:{ titular:'Por tu cuenta o con nosotros',
    tituloA:'Por tu cuenta',
    itemsA:['Pedir cita en Tráfico y esperar semanas','Desplazarte a la jefatura','Liquidar el ITP en tu comunidad','Y volver si falta un papel'],
    tituloB:'Con RM Gestión',
    itemsB:['Todo por WhatsApp, sin cita','Sin moverte de casa','El ITP lo liquidamos nosotros','Permiso provisional el mismo día'] },
  render(L, v){
    L.esquina(); L.topePie = L.pie();
    L.abrirFlujo().titular(v.titular, 62, 2).espacio(16)
      .dosColumnas({ titulo:v.tituloA, items:v.itemsA }, { titulo:v.tituloB, items:v.itemsB }, 30);
    L.cerrarFlujo(L.topePie, 'centro');
  } },

/* ---------- 8 · Testimonio ---------- */
{ id:'testimonio', fam:'social', nom:'Reseña', formatos:SOCIAL,
  campos:[
    ['cuerpo','La reseña','area'],
    ['firma','Quién lo dice','texto'],
    ['detalle','Detalle','texto'],
  ],
  def:{ cuerpo:'Vendí el coche un viernes y el lunes ya estaba a nombre del comprador. No pisé Tráfico ni una vez.',
    firma:'Marta G.', detalle:'Transferencia · Alicante' },
  render(L, v){
    L.esquina(); L.topePie = L.pie();
    L.abrirFlujo();
    /* La comilla se coloca midiendo su mancha real: el glifo « no llega a la
       línea base, así que calcular su hueco «a ojo» hacía que el texto se le
       montara encima. */
    const tamC = 168 * L.u;
    const tinta = mancha('«', 800, tamC);
    L.capa1.push(L.txt(L.pad - tamC * 0.05, L.y + tinta.alto, '«',
      { peso:800, tam:tamC, fill:L.t.acento }));
    L.y += tinta.alto + 26 * L.u;
    const { tam, lineas } = encajar(v.cuerpo, 800, 60 * L.u, L.max, 6, 30 * L.u);
    L.y += L.bloque(lineas, L.y, { tam, peso:800, interlinea:1.2, track:-0.015 });
    L.y += 34 * L.u;
    const tf = 30 * L.u;
    L.capa1.push(L.txt(L.pad, L.y + CAP * tf, v.firma, { peso:800, tam:tf, fill:L.t.acento }));
    if(v.detalle) L.capa1.push(L.txt(L.pad, L.y + CAP * tf + tf * 1.45, v.detalle,
      { peso:500, tam:tf * 0.82, fill:L.t.suave }));
    L.y += tf * 2.4;
    L.cerrarFlujo(L.topePie, 'centro');
  } },

/* ---------- 9 · Aviso ---------- */
{ id:'aviso', fam:'social', nom:'Aviso', formatos:SOCIAL,
  campos:[
    ['etiqueta','Etiqueta','texto'],
    ['titular','Titular','area'],
    ['cuerpo','Cuerpo','area'],
  ],
  def:{ etiqueta:'Nuevo', titular:'Ya liquidamos el ITP de cualquier comunidad autónoma',
    cuerpo:'Da igual dónde residas: calculamos el valor fiscal del vehículo, aplicamos el tipo que te toca y presentamos la autoliquidación. Tú recibes el justificante sellado.' },
  render(L, v){
    L.esquina(); L.topePie = L.pie();
    L.abrirFlujo();
    if(v.etiqueta){
      const te = 24 * L.u;
      const anchoEt = ancho(v.etiqueta.toUpperCase(), 800, te, 0.12) + te * 1.5;
      L.capa1.push(`<rect x="${n(L.pad)}" y="${n(L.y)}" width="${n(anchoEt)}"`
        + ` height="${n(te * 2.1)}" rx="${n(te * 1.05)}" fill="${L.t.acento}"/>`);
      L.capa1.push(L.txt(L.pad + anchoEt / 2, L.y + te * 1.05 + CAP * te / 2,
        v.etiqueta.toUpperCase(), { peso:800, tam:te, fill:MARCA.azul, ancla:'middle', track:0.12 }));
      L.y += te * 2.1 + 34 * L.u;
    }
    L.titular(v.titular, 68, 4).espacio(6).cuerpo(v.cuerpo, 29);
    L.cerrarFlujo(L.topePie, 'centro');
  } },

/* ---------- 10 · Ficha de trámite ---------- */
{ id:'ficha', fam:'social', nom:'Trámite', formatos:SOCIAL,
  campos:[
    ['antetitulo','Antetítulo','texto'],
    ['titular','Nombre del trámite','area'],
    ['precio','Precio','texto'], ['plazo','Plazo','texto'],
    ['bullets','Incluye','lista'],
  ],
  def:{ antetitulo:'Trámite', titular:'Matriculación de vehículo nuevo',
    precio:'desde 197 €', plazo:'24-48 h',
    bullets:['Impuesto de matriculación (modelo 576)','Tasa de la DGT','Placas de matrícula'] },
  render(L, v){
    L.esquina(); L.topePie = L.pie();
    L.abrirFlujo().antetitulo(v.antetitulo).titular(v.titular, 74, 3).espacio(4);
    /* Precio y plazo enfrentados: son los dos datos que decide la compra. */
    const tam = 34 * L.u;
    const alto = tam * 3.1;
    L.capa1.push(`<rect x="${n(L.pad)}" y="${n(L.y)}" width="${n(L.max)}" height="${n(alto)}"`
      + ` rx="${n(18 * L.u)}" fill="${L.t.chip}"/>`);
    const bx = L.y + alto / 2;
    [['Precio', v.precio, L.pad + tam * 0.9, 'start'],
     ['Plazo', v.plazo, L.der - tam * 0.9, 'end']].forEach(([et, val, x, an]) => {
      L.capa1.push(L.txt(x, bx - tam * 0.28, et.toUpperCase(),
        { peso:800, tam:tam * 0.52, fill:L.t.suave, ancla:an, track:0.12 }));
      L.capa1.push(L.txt(x, bx + tam * 0.95, val,
        { peso:800, tam:tam * 1.15, fill:L.t.acento, ancla:an }));
    });
    L.y += alto + 40 * L.u;
    L.capa1.push(L.txt(L.pad, L.y + CAP * 22 * L.u, 'INCLUYE',
      { peso:800, tam:22 * L.u, fill:L.t.suave, track:0.13 }));
    L.y += 22 * L.u + 26 * L.u;
    L.lista(v.bullets, 28);
    L.cerrarFlujo(L.topePie, 'centro');
  } },

/* ---------- 11 · Frase ---------- */
{ id:'frase', fam:'social', nom:'Frase', formatos:SOCIAL,
  campos:[
    ['titular','La frase','area'],
    ['pie','Debajo','texto'],
  ],
  def:{ titular:'Todo el papeleo de tu coche, sin colas', pie:'Gestoría online especializada en vehículos' },
  render(L, v){
    L.esquina(0.8); L.topePie = L.pie();
    L.abrirFlujo();
    const { tam, lineas } = encajar(v.titular, 800, 108 * L.u, L.max, 5, 44 * L.u);
    L.y += L.bloque(lineas, L.y, { tam, peso:800, interlinea:1.1, track:-0.025 });
    L.y += 30 * L.u;
    if(v.pie) L.cuerpo(v.pie, 30, { peso:600 });
    L.cerrarFlujo(L.topePie, 'centro');
  } },

/* ---------- 12 · Portada de carrusel ---------- */
{ id:'carrusel', fam:'social', nom:'Carrusel', formatos:SOCIAL,
  campos:[
    ['antetitulo','Antetítulo','texto'],
    ['titular','Titular','area'],
    ['cuerpo','Entradilla','area'],
    ['pie','Invitación a deslizar','texto'],
  ],
  def:{ antetitulo:'Guía rápida', titular:'Cinco cosas que nadie te cuenta al vender el coche',
    cuerpo:'Lo que de verdad te libra de las multas del comprador.', pie:'Desliza' },
  render(L, v){
    L.esquina(); L.topePie = L.pie();
    L.abrirFlujo().antetitulo(v.antetitulo).titular(v.titular, 84, 4).espacio(4)
      .cuerpo(v.cuerpo, 30);
    if(v.pie){
      L.espacio(14);
      const tp = 28 * L.u;
      L.capa1.push(L.txt(L.pad, L.y + CAP * tp, v.pie.toUpperCase(),
        { peso:800, tam:tp, fill:L.t.acento, track:0.14 }));
      const fx = L.pad + ancho(v.pie.toUpperCase(), 800, tp, 0.14) + tp * 0.8;
      const fy = L.y + CAP * tp * 0.62;
      L.capa1.push(`<path d="M${n(fx)} ${n(fy)}h${n(tp * 1.1)}m${n(-tp * 0.42)} ${n(-tp * 0.42)}`
        + `l${n(tp * 0.42)} ${n(tp * 0.42)}l${n(-tp * 0.42)} ${n(tp * 0.42)}" fill="none"`
        + ` stroke="${L.t.acento}" stroke-width="${n(tp * 0.16)}" stroke-linecap="round"`
        + ` stroke-linejoin="round"/>`);
      L.y += tp * 1.7;
    }
    L.cerrarFlujo(L.topePie, 'centro');
  } },
];

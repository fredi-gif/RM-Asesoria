/* --- Cajas de seguridad ---------------------------------------------------
   Las portadas se recortan distinto en cada red y el arte de canal de YouTube
   solo garantiza un rectángulo central diminuto. Cada formato ancho declara
   la caja donde el contenido está a salvo, y las plantillas maquetan dentro
   de ella, no dentro del lienzo entero.                                     */
FORMATOS.portadaFb.caja = { x:104, y:40,  w:1432, h:544, u:544 / 624 };
FORMATOS.portadaLi.caja = { x:120, y:34,  w:1344, h:328, u:328 / 624 };
FORMATOS.portadaX.caja  = { x:110, y:44,  w:1280, h:412, u:412 / 624 };
FORMATOS.portadaYt.caja = { x:507, y:508, w:1546, h:423, u:423 / 624 };
const PORTADAS = ['portadaFb','portadaLi','portadaX','portadaYt'];

/* La marca en horizontal: tesela + «RM Gestión». Se usa en portadas e
   impresos, donde hay ancho de sobra y el nombre debe leerse. */
Lienzo.prototype.marcaHorizontal = function(x, y, alto, o = {}){
  const tam = alto * 0.80;
  const hueco = alto * 0.30;
  const g = this.simbolo(x, y, alto);
  const t = this.txt(x + alto + hueco, y + (alto - tam) / 2 + CAP * tam,
    o.nombre || 'RM Gestión', { peso:800, tam, fill:o.fill || this.t.tinta, track:-0.02 });
  this.anchoMarca = alto + hueco + ancho(o.nombre || 'RM Gestión', 800, tam, -0.02);
  return g + t;
};
/* Guía que se ve al editar pero NO se exporta: dice dónde recorta la red o
   dónde corta la guillotina. */
Lienzo.prototype.guia = function(d, etiqueta){
  this.capaGuia.push(d);
  if(etiqueta){
    const tg = 20 * this.u;
    this.capaGuia.push(this.txt(this.W / 2, this.H - tg * 0.9, etiqueta,
      { peso:700, tam:tg, fill:this.t.suave, ancla:'middle', op:0.75 }));
  }
  return this;
};

/* Cambia el marco de trabajo a la caja de seguridad: a partir de aquí los
   bloques normales (antetítulo, titular, cuerpo) maquetan dentro de ella. */
Lienzo.prototype.enCaja = function(){
  const c = this.caja;
  this.pad = c.x; this.max = c.w; this.der = c.x + c.w; this.u = c.u; this.y = c.y;
  return this;
};

PLANTILLAS.push(

/* ================= PERFIL ================= */
/* El recorte circular de las redes se come las esquinas: un cuadrado de lado
   L solo cabe entero dentro de un círculo de diámetro L·√2, así que la marca
   nunca puede pasar del 70 % del lienzo si queremos conservar la franja. */
{ id:'perfil-simbolo', fam:'perfil', nom:'Símbolo', formatos:['perfil'],
  campos:[], def:{},
  render(L){
    const lado = L.W * 0.68, x = (L.W - lado) / 2;
    L.capa1.push(L.simbolo(x, x, lado));
    L.guiaCirculo();
  } },

{ id:'perfil-anillo', fam:'perfil', nom:'Con anillo', formatos:['perfil'],
  campos:[], def:{},
  render(L){
    /* El anillo aprovecha el propio recorte de la red: en vez de sufrirlo,
       lo convierte en parte de la marca. */
    const grosor = L.W * 0.035;
    L.capa1.push(`<circle cx="${L.W / 2}" cy="${L.H / 2}" r="${n(L.W * 0.455)}"`
      + ` fill="none" stroke="${MARCA.naranja}" stroke-width="${n(grosor)}"/>`);
    const lado = L.W * 0.55, x = (L.W - lado) / 2;
    L.capa1.push(L.simbolo(x, x, lado));
    L.guiaCirculo();
  } },

{ id:'perfil-sangre', fam:'perfil', nom:'A sangre', formatos:['perfil'],
  campos:[], def:{},
  render(L){
    /* Sin margen: para donde NO hay recorte circular — favicon, marca de agua,
       icono de aplicación. */
    L.capa1.push(L.simbolo(0, 0, L.W));
  } },

{ id:'perfil-monograma', fam:'perfil', nom:'Monograma', formatos:['perfil'],
  campos:[], def:{},
  render(L){
    /* Las letras solas, caladas sobre el fondo, con la franja como firma. */
    const k = L.W * 0.0105;
    L.capa1.push(`<g transform="translate(${n(L.W / 2 - 48 * k)} ${n(L.H / 2 - 47 * k)}) scale(${n(k)})">`
      + `<path d="${LETRA_R}" fill="${L.t.tinta}"/>`
      + `<path d="${LETRA_M}" fill="${L.t.tinta}" stroke="${L.t.fondo}" stroke-width="4.5"`
      + ` paint-order="stroke"/></g>`);
    /* La franja va sobre la diagonal, dentro del círculo: si se empuja a la
       esquina como en el logo, el recorte se la lleva. */
    const r = L.W * 0.16, banda = L.W * 0.058;
    const cx = L.W * 0.67, cy = L.H * 0.67;
    L.capa1.push(`<path d="M${n(cx + r)} ${n(cy)}A${n(r)} ${n(r)} 0 0 1 ${n(cx)} ${n(cy + r)}`
      + `L${n(cx)} ${n(cy + r - banda)}A${n(r - banda)} ${n(r - banda)} 0 0 0`
      + ` ${n(cx + r - banda)} ${n(cy)}Z" fill="${MARCA.naranja}"/>`);
    L.guiaCirculo();
  } },

/* ================= PORTADAS ================= */
{ id:'portada-claim', fam:'portada', nom:'Claim', formatos:PORTADAS,
  campos:[
    ['titular','Claim','area'],
    ['cuerpo','Debajo','texto'],
    ['contacto','Contacto','texto'],
  ],
  def:{ titular:'Todo el papeleo de tu coche, sin colas',
    cuerpo:'Transferencias · Matriculaciones · Bajas · Duplicados',
    contacto:'WhatsApp 681 879 306' },
  render(L, v){
    const c = L.caja;
    L.enCaja(); L.esquina(1.25); L.abrirFlujo();
    const altoM = c.h * 0.22;
    L.capa1.push(L.marcaHorizontal(c.x, L.y, altoM));
    L.y += altoM + 42 * L.u;
    L.titular(v.titular, 80, c.h > 380 ? 2 : 1);
    if(v.cuerpo) L.cuerpo(v.cuerpo, 31, { peso:700, ancho:c.w * 0.92 });
    if(v.contacto){
      const tc = 33 * L.u;
      L.capa1.push(L.txt(c.x, L.y + CAP * tc, v.contacto, { peso:800, tam:tc, fill:L.t.acento }));
      L.y += tc * 1.4;
    }
    L.cerrarFlujo(c.y + c.h, 'centro');
    L.guiaCaja();
  } },

{ id:'portada-servicios', fam:'portada', nom:'Servicios', formatos:PORTADAS,
  campos:[
    ['titular','Titular','area'],
    ['bullets','Servicios','lista'],
    ['contacto','Contacto','texto'],
  ],
  def:{ titular:'Gestoría de vehículos, online',
    bullets:['Transferencias desde 145 €','Matriculaciones desde 197 €','Bajas y duplicados','ITP e impuesto de matriculación'],
    contacto:'rmgestion.es · WhatsApp 681 879 306' },
  render(L, v){
    const c = L.caja;
    L.enCaja(); L.esquina(1.25);
    /* Dos mitades: identidad a la izquierda, oferta a la derecha. Cada una se
       centra por su cuenta dentro de la caja, así ninguna arrastra a la otra. */
    const anchoIzq = c.w * 0.46, anchoDer = c.w * 0.44;
    const xDer = c.x + c.w - anchoDer;
    L.max = anchoIzq; L.der = c.x + anchoIzq;
    L.abrirFlujo();
    const altoM = c.h * 0.21;
    L.capa1.push(L.marcaHorizontal(c.x, L.y, altoM));
    L.y += altoM + 34 * L.u;
    L.titular(v.titular, 62, 3);
    if(v.contacto){
      const tc = 27 * L.u;
      L.capa1.push(L.txt(c.x, L.y + CAP * tc, v.contacto, { peso:700, tam:tc, fill:L.t.acento }));
      L.y += tc * 1.4;
    }
    L.cerrarFlujo(c.y + c.h, 'centro');

    const items = (v.bullets || []).filter(Boolean);
    const ti = 30 * L.u, salto = ti * 2.0;
    const alto = items.length * salto - ti * 0.6;
    let yy = c.y + (c.h - alto) / 2;
    items.forEach((it, i) => {
      const ls = romper(it, 600, ti, anchoDer);
      L.bloque(ls, yy + i * salto, { tam:ti, peso:600, x:xDer, interlinea:1.3, fill:L.t.tinta });
      if(i < items.length - 1) L.capa1.push(`<rect x="${n(xDer)}"`
        + ` y="${n(yy + i * salto + salto - ti * 0.62)}" width="${n(anchoDer)}"`
        + ` height="2" fill="${L.t.linea}"/>`);
    });
    L.guiaCaja();
  } },

{ id:'portada-contacto', fam:'portada', nom:'Contacto', formatos:PORTADAS,
  campos:[
    ['titular','Titular','area'],
    ['contacto','Teléfono / WhatsApp','texto'],
    ['cuerpo','Debajo','texto'],
  ],
  def:{ titular:'Cuéntanos tu caso', contacto:'681 879 306',
    cuerpo:'Te decimos qué trámite necesitas y cuánto cuesta antes de que contrates nada.' },
  render(L, v){
    const c = L.caja;
    L.enCaja(); L.esquina(1.25); L.abrirFlujo();
    const cx = c.x + c.w / 2;
    const altoM = c.h * 0.21;
    const anchoM = altoM * 1.30 + ancho('RM Gestión', 800, altoM * 0.8, -0.02);
    L.capa1.push(L.marcaHorizontal(cx - anchoM / 2, L.y, altoM));
    L.y += altoM + 34 * L.u;
    const t1 = encajar(v.titular, 800, 52 * L.u, c.w * 0.9, 1, 24 * L.u);
    L.y += L.bloque(t1.lineas, L.y, { tam:t1.tam, peso:800, x:cx, ancla:'middle', track:-0.02 });
    L.y += 12 * L.u;
    const tn = 92 * L.u;
    L.capa1.push(L.txt(cx, L.y + CAP * tn, v.contacto,
      { peso:800, tam:tn, fill:L.t.acento, ancla:'middle', track:-0.02 }));
    L.y += tn + 18 * L.u;
    if(v.cuerpo && c.h > 360){
      const lb = romper(v.cuerpo, 500, 28 * L.u, c.w * 0.66);
      L.y += L.bloque(lb, L.y, { tam:28 * L.u, peso:500, interlinea:1.4, x:cx,
        ancla:'middle', fill:L.t.suave });
    }
    L.cerrarFlujo(c.y + c.h, 'centro');
    L.guiaCaja();
  } },

/* ================= IMPRESOS ================= */
{ id:'tarjeta-anverso', fam:'impreso', nom:'Tarjeta · cara A', formatos:['tarjeta'],
  campos:[['titular','Debajo del logo','texto'],['cuerpo','Actividad','texto']],
  def:{ titular:'Gestoría administrativa', cuerpo:'Trámites de vehículos' },
  render(L, v){
    L.esquina(0.62);
    const altoM = L.H * 0.20;
    L.capa1.push(L.marcaHorizontal(L.pad, L.H * 0.30, altoM));
    const t = 30 * L.u;
    let y = L.H * 0.30 + altoM + L.H * 0.09;
    if(v.titular){ L.capa1.push(L.txt(L.pad, y + CAP * t, v.titular,
      { peso:700, tam:t, fill:L.t.tinta })); y += t * 1.5; }
    if(v.cuerpo) L.capa1.push(L.txt(L.pad, y + CAP * t, v.cuerpo,
      { peso:500, tam:t * 0.9, fill:L.t.suave }));
    L.guiaCorte();
  } },

{ id:'tarjeta-reverso', fam:'impreso', nom:'Tarjeta · cara B', formatos:['tarjeta'],
  campos:[
    ['nombre','Nombre','texto'], ['cargo','Cargo','texto'],
    ['filas','Datos de contacto','pares'],
  ],
  def:{ nombre:'RM Gestión', cargo:'Gestoría administrativa',
    filas:[['WhatsApp','681 879 306'],['Teléfono','+34 681 879 306'],
      ['Correo','rmgestionadministrativa@gmail.com'],['Web','rmgestion.es']] },
  render(L, v){
    L.esquina(0.62);
    const px = L.H * 0.17;
    L.capa1.push(L.simbolo(L.pad, L.pad + L.H * 0.02, px));
    let y = L.pad + L.H * 0.02 + px + L.H * 0.07;
    const tn = 34 * L.u;
    if(v.nombre){ L.capa1.push(L.txt(L.pad, y + CAP * tn, v.nombre,
      { peso:800, tam:tn, fill:L.t.tinta, track:-0.02 })); y += tn * 1.28; }
    if(v.cargo){ L.capa1.push(L.txt(L.pad, y + CAP * tn * 0.62, v.cargo,
      { peso:600, tam:tn * 0.62, fill:L.t.suave })); y += tn * 1.05; }
    y += L.H * 0.03;
    const td = 24 * L.u, salto = td * 1.62;
    (v.filas || []).filter(f => f && f[1]).forEach((f, i) => {
      L.capa1.push(L.txt(L.pad, y + i * salto + CAP * td, f[0],
        { peso:800, tam:td * 0.78, fill:L.t.acento, track:0.06 }));
      L.capa1.push(L.txt(L.pad + 150 * L.u, y + i * salto + CAP * td, f[1],
        { peso:600, tam:td, fill:L.t.tinta }));
    });
    L.guiaCorte();
  } },

{ id:'cartel', fam:'impreso', nom:'Cartel', formatos:['a5','a4','rollup'],
  campos:[
    ['antetitulo','Antetítulo','texto'],
    ['titular','Claim','area'],
    ['bullets','Servicios','lista'],
    ['contacto','Contacto','texto'],
    ['nota','Letra pequeña','area'],
  ],
  def:{ antetitulo:'Gestoría online de vehículos',
    titular:'Todo el papeleo de tu coche, sin colas',
    bullets:['Transferencias desde 145 €','Matriculaciones desde 197 €',
      'Bajas y duplicados','ITP e impuesto de matriculación','Informes de la DGT'],
    contacto:'WhatsApp 681 879 306',
    nota:'Precios con IVA y tasas de la DGT incluidas. Los impuestos de cada operación van aparte.' },
  render(L, v){
    L.esquina(0.55);
    const altoM = L.H * 0.055;
    L.capa1.push(L.marcaHorizontal(L.pad, L.pad, altoM));
    L.y = L.pad + altoM + L.H * 0.07;
    /* En un roll-up la parte baja queda a la altura de las rodillas y muchas
       veces detrás de una mesa: el contenido se queda en los dos tercios de
       arriba y el contacto sube con él. */
    const tope = L.fmt === FORMATOS.rollup ? L.H * 0.72 : L.H - L.pad - L.H * 0.10;
    L.abrirFlujo().antetitulo(v.antetitulo).titular(v.titular, 96, 4).espacio(20)
      .lista(v.bullets, 38);
    if(v.contacto){
      L.espacio(20);
      const tc = 52 * L.u;
      L.capa1.push(L.txt(L.pad, L.y + CAP * tc, v.contacto,
        { peso:800, tam:tc, fill:L.t.acento }));
      L.y += tc * 1.5;
    }
    L.cerrarFlujo(tope, 'centro');
    if(v.nota){
      L.y = L.H - L.pad - 46 * L.u;
      L.cuerpo(v.nota, 20, { ancho:L.W * 0.55 });
    }
    L.guiaCorte();
  } },

{ id:'flyer-tarifa', fam:'impreso', nom:'Flyer de tarifas', formatos:['a5','a4'],
  campos:[
    ['titular','Titular','area'],
    ['filas','Tarifa','pares'],
    ['nota','Letra pequeña','area'],
    ['contacto','Contacto','texto'],
  ],
  def:{ titular:'Tarifa de trámites',
    filas:[['Transferencia','desde 145 €'],['Notificación de venta','desde 94 €'],
      ['Entrega a compraventa','88 €'],['Matriculación','desde 197 €'],
      ['Importación','desde 252 €'],['Alta de vehículo','desde 94 €'],
      ['Baja de vehículo','desde 94 €'],['Duplicado del permiso','106 €'],
      ['Levantamiento de reserva','desde 103 €'],['Informe de la DGT','15 €'],
      ['Liquidación del ITP','18 €'],['Etiqueta medioambiental','5 €']],
    nota:'Precios con IVA y tasas de la DGT incluidas. Los impuestos de cada operación van aparte.',
    contacto:'WhatsApp 681 879 306 · rmgestion.es' },
  render(L, v){
    L.esquina(0.5);
    const altoM = L.H * 0.048;
    L.capa1.push(L.marcaHorizontal(L.pad, L.pad, altoM));
    L.y = L.pad + altoM + L.H * 0.055;
    L.titular(v.titular, 76, 2).espacio(10);
    /* El cuerpo de la tabla se calcula para que la tarifa entera quepa en la
       página, por larga que sea: es el dato, no puede recortarse. */
    const filas = (v.filas || []).filter(f => f && f[0]);
    const libre = L.H - L.pad - 130 * L.u - L.y;
    const tam = Math.min(38 * L.u, libre / Math.max(1, filas.length) / 2.15);
    L.precios(filas, tam / L.u);
    L.y = L.H - L.pad - 96 * L.u;
    if(v.nota) L.cuerpo(v.nota, 19, { ancho:L.W * 0.58 });
    if(v.contacto) L.capa1.push(L.txt(L.pad, L.H - L.pad - 8 * L.u, v.contacto,
      { peso:800, tam:30 * L.u, fill:L.t.acento }));
    L.guiaCorte();
  } },
);

/* Rectángulo de la caja de seguridad, para que se vea al editar hasta dónde
   se puede llegar en una portada. */
Lienzo.prototype.guiaCaja = function(){
  const c = this.caja;
  return this.guia(`<rect x="${n(c.x)}" y="${n(c.y)}" width="${n(c.w)}" height="${n(c.h)}"`
    + ` fill="none" stroke="${this.t.suave}" stroke-width="3" stroke-dasharray="14 10"`
    + ` opacity=".45"/>`, 'Zona segura · fuera de aquí cada red recorta distinto');
};
/* Línea de corte de la guillotina: el archivo lleva 3 mm de sangre por lado
   y la imprenta corta por dentro. */
Lienzo.prototype.guiaCorte = function(){
  const s = this.sangre;
  if(!s) return this;
  return this.guia(`<rect x="${n(s)}" y="${n(s)}" width="${n(this.W - s * 2)}"`
    + ` height="${n(this.H - s * 2)}" fill="none" stroke="${this.t.acento}"`
    + ` stroke-width="3" stroke-dasharray="14 10" opacity=".6"/>`,
    'Línea de corte · el archivo lleva 3 mm de sangre alrededor');
};
/* El círculo de recorte de las redes sociales. */
Lienzo.prototype.guiaCirculo = function(){
  return this.guia(`<circle cx="${this.W / 2}" cy="${this.H / 2}" r="${this.W / 2 - 2}"`
    + ` fill="none" stroke="${this.t.suave}" stroke-width="3" stroke-dasharray="16 12"`
    + ` opacity=".5"/>`, 'La circunferencia es el recorte de las redes · no se exporta');
};

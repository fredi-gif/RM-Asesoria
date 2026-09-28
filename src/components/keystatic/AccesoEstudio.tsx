import { useEffect, useMemo } from 'react';
import type { BasicFormField } from '@keystatic/core';

/**
 * Campo «de paso» para llevar el menú lateral del panel al estudio de marca.
 *
 * El menú de Keystatic sólo admite colecciones y singletons, no enlaces a una
 * URL cualquiera. Las piezas y las tarjetas se editan en `/marca` —formulario,
 * vista previa en vivo y descargas en una misma pantalla—, así que el grupo
 * «Imagen de marca» del menú apunta a dos singletons cuyo único campo es este:
 * al abrirlo, redirige al estudio en la misma rama en la que se esté
 * trabajando. No guarda nada.
 */
export function accesoEstudio(tipo: 'piezas' | 'tarjetas'): BasicFormField<null> {
  return {
    kind: 'form',
    Input: () => <Redireccion tipo={tipo} />,
    defaultValue: () => null,
    parse: () => null,
    serialize: () => ({ value: undefined }),
    validate: (value) => value,
    reader: { parse: () => null },
  };
}

function Redireccion({ tipo }: { tipo: 'piezas' | 'tarjetas' }) {
  const destino = useMemo(() => {
    // En GitHub el panel vive en /keystatic/branch/<rama>/…; en local, en /keystatic/….
    const rama = window.location.pathname.match(/^\/keystatic\/branch\/([^/]+)\//)?.[1];
    return `/marca/${tipo}${rama ? `?rama=${encodeURIComponent(decodeURIComponent(rama))}` : ''}`;
  }, [tipo]);

  // `replace` y no `assign`: si no, «Atrás» desde el estudio volvería aquí y
  // redirigiría otra vez.
  useEffect(() => window.location.replace(destino), [destino]);

  return (
    <p style={{ fontSize: 14, lineHeight: 1.5 }}>
      Abriendo el estudio de imagen de marca… Si no se abre solo,{' '}
      <a href={destino} style={{ color: 'inherit', fontWeight: 600 }}>
        pulsa aquí
      </a>
      .
    </p>
  );
}

import { defineMarkdocConfig, component } from '@astrojs/markdoc/config';

/**
 * Etiquetas propias disponibles en el contenido markdoc.
 *
 * Cada una tiene que estar declarada dos veces y con el mismo nombre: aquí,
 * que es lo que la pinta al construir la web, y en el `components` del campo
 * markdoc de `keystatic.config.ts`, que es lo que la ofrece como bloque en el
 * editor. Si falta la de Keystatic, el panel no sabe qué hacer con la etiqueta
 * al abrir la página; si falta esta, no se renderiza al publicar.
 */
export default defineMarkdocConfig({
  tags: {
    DatosTitular: {
      render: component('./src/components/legal/DatosTitular.astro'),
    },
  },
});

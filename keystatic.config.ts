import { config, fields, collection, singleton } from '@keystatic/core';
import { block } from '@keystatic/core/content-components';

import { BrandMark } from './src/components/keystatic/BrandMark';
import { PIES, PLANTILLAS, QRS, TEMAS_MARCA } from './src/lib/marca/opciones';

/**
 * Iconos disponibles para los trámites.
 * Debe mantenerse en sintonía con `PATHS` en `src/components/ui/Icon.astro`.
 */
const ICONOS = [
  { label: 'Coche', value: 'coche' },
  { label: 'Traspaso / transferencia', value: 'traspaso' },
  { label: 'Documento', value: 'documento' },
  { label: 'Firma', value: 'firma' },
  { label: 'Lupa / consulta', value: 'lupa' },
  { label: 'Matrícula', value: 'matricula' },
  { label: 'Alta', value: 'alta' },
  { label: 'Baja', value: 'baja' },
  { label: 'Duplicado', value: 'duplicado' },
  { label: 'Ajustes / reforma', value: 'ajustes' },
  { label: 'Candado / reserva de dominio', value: 'candado' },
  { label: 'Hoja / medioambiental', value: 'hoja' },
  { label: 'Placas', value: 'placas' },
  { label: 'Entrega a compraventa', value: 'entrega' },
  { label: 'Finalización / bandera', value: 'finalizacion' },
  { label: 'Campana / notificación', value: 'campana' },
  { label: 'Globo / importación', value: 'globo' },
  { label: 'Carta de pago', value: 'carta-pago' },
  { label: 'ITP / impreso sellado', value: 'itp' },
  { label: 'Impuesto de matriculación (CO₂)', value: 'iedmt' },
  { label: 'IVTM / ayuntamiento', value: 'ivtm' },
] as const;

/**
 * Grupos del desplegable de trámites del menú.
 * Debe mantenerse en sintonía con `GRUPOS` en `src/lib/tramites.ts`.
 */
const GRUPOS = [
  { label: 'Compraventas', value: 'compraventas' },
  { label: 'Impuestos', value: 'impuestos' },
  { label: 'Reserva de dominio', value: 'reserva-de-dominio' },
  { label: 'Otros', value: 'otros' },
] as const;

/**
 * Ilustraciones de documento disponibles.
 * Debe mantenerse en sintonía con `ILUSTRACIONES` en
 * `src/components/tramite/DocIlustracion.astro`.
 */
const ILUSTRACIONES = [
  { label: 'Permiso de circulación', value: 'permiso-circulacion' },
  { label: 'Ficha técnica / tarjeta ITV', value: 'ficha-tecnica' },
  { label: 'Ficha técnica electrónica (eITV)', value: 'ficha-tecnica-electronica' },
  { label: 'DNI o documento de identidad', value: 'dni' },
  { label: 'NIE con pasaporte', value: 'nie' },
  { label: 'CIF de empresa', value: 'cif' },
  { label: 'Carta de pago de la financiera', value: 'carta-financiera' },
  { label: 'Contrato firmado', value: 'contrato' },
  { label: 'Factura', value: 'factura' },
  { label: 'Denuncia', value: 'denuncia' },
  { label: 'Certificado con sello', value: 'certificado' },
  { label: 'Justificante de pago', value: 'justificante' },
  { label: 'Matrícula', value: 'matricula' },
  { label: 'Escritura o poderes', value: 'escritura' },
  { label: 'Certificado de conformidad (COC)', value: 'coc' },
  { label: 'Seguro', value: 'seguro' },
  { label: 'Datos (no es un papel)', value: 'datos' },
  { label: 'Documento genérico', value: 'generico' },
] as const;

/**
 * Ilustraciones de los pasos del proceso.
 * Debe mantenerse en sintonía con `ILUSTRACIONES` en
 * `src/components/proceso/PasoIlustracion.astro`.
 */
const ILUSTRACIONES_PASO = [
  { label: 'Formulario rellenado', value: 'formulario' },
  { label: 'Subir documentación', value: 'documentos' },
  { label: 'Revisión con lupa', value: 'revision' },
  { label: 'Gestión ante la administración', value: 'gestion' },
  { label: 'Pago de tasas e impuestos', value: 'pago' },
  { label: 'Firma', value: 'firma' },
  { label: 'Envío de documentación', value: 'envio' },
  { label: 'Soporte / conversación', value: 'soporte' },
] as const;

/**
 * Iconos para la franja de ventajas de la cabecera de la home.
 * Debe mantenerse en sintonía con `PATHS` en `src/components/ui/Icon.astro`.
 */
const ICONOS_VENTAJA = [
  { label: 'Pantalla / online', value: 'pantalla' },
  { label: 'Candado / pago seguro', value: 'candado' },
  { label: 'Escudo', value: 'escudo' },
  { label: 'Check en círculo', value: 'check-circle' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Reloj', value: 'reloj' },
  { label: 'Euro', value: 'euro' },
  { label: 'Documento', value: 'documento' },
  { label: 'Firma', value: 'firma' },
] as const;

export default config({
  // En local (`astro dev`), Keystatic escribe directamente en disco.
  // En producción (Vercel) no hay acceso de escritura al filesystem del repo,
  // así que se lee/escribe contra la API de GitHub. Requiere las variables de
  // entorno KEYSTATIC_GITHUB_CLIENT_ID, KEYSTATIC_GITHUB_CLIENT_SECRET y
  // KEYSTATIC_SECRET configuradas en el proyecto de Vercel.
  storage: import.meta.env.PROD
    ? { kind: 'github', repo: { owner: 'fredi-gif', name: 'RM-Asesoria' } }
    : { kind: 'local' },

  ui: {
    brand: { mark: BrandMark, name: 'RM Gestión' },
    navigation: {
      Contenido: ['tramites', 'paginas'],
      'Páginas fijas': ['home', 'comoFunciona', 'contacto', 'faqs'],
      Sitio: ['navegacion', 'configuracion', 'error404'],
      'Imagen de marca': ['piezas', 'tarjetas'],
    },
  },

  collections: {
    tramites: collection({
      label: 'Trámites',
      path: 'src/content/tramites/*/',
      slugField: 'title',
      format: { contentField: 'contenido' },
      entryLayout: 'content',
      columns: ['title', 'orden', 'estado'],
      previewUrl: '/tramites/{slug}',
      // La plantilla vive fuera de `src/content/tramites` a propósito: el loader
      // de `src/content.config.ts` recoge `**/index.mdoc` de esa carpeta y la
      // publicaría como un trámite más.
      template: 'src/content/_plantillas/tramite',
      schema: {
        title: fields.slug({
          name: {
            label: 'Título (H1 de la página)',
            description: 'Ej.: «Transferencia de vehículo online»',
          },
          slug: {
            label: 'URL',
            description: 'La página quedará en /tramites/{slug}',
          },
        }),

        shortTitle: fields.text({
          label: 'Título corto',
          description: 'Para el menú y las tarjetas del listado. Ej.: «Transferencia»',
          validation: { length: { min: 2, max: 40 } },
        }),

        summary: fields.text({
          label: 'Resumen',
          description:
            'Una o dos frases. Se usa en la tarjeta del listado y como meta description por defecto.',
          multiline: true,
          validation: { length: { min: 20, max: 220 } },
        }),

        imagen: fields.image({
          label: 'Imagen de la tarjeta',
          description:
            'Opcional. Si la subes, sustituye a la ilustración en la rejilla de la portada.',
          directory: 'src/assets/tramites',
          publicPath: '/src/assets/tramites/',
        }),

        icon: fields.select({
          label: 'Icono',
          options: ICONOS as unknown as { label: string; value: string }[],
          defaultValue: 'documento',
        }),

        grupo: fields.select({
          label: 'Grupo del menú',
          description:
            'Bloque en el que sale el trámite dentro del desplegable «Trámites». No cambia el orden de la portada.',
          options: GRUPOS as unknown as { label: string; value: string }[],
          defaultValue: 'otros',
        }),

        destacado: fields.checkbox({
          label: 'Destacado',
          description: 'Los destacados aparecen los primeros del listado.',
          defaultValue: false,
        }),

        orden: fields.integer({
          label: 'Orden',
          description: 'Menor número, más arriba. Empate: orden alfabético.',
          defaultValue: 100,
        }),

        estado: fields.select({
          label: 'Estado del contenido',
          description:
            'Solo se publican los trámites en «Revisado». Los borradores no salen en la web: no aparecen en la portada, ni en el menú, ni en las preguntas frecuentes, y su página no se genera.',
          options: [
            { label: 'Borrador — no se publica', value: 'borrador' },
            { label: 'Revisado — publicado', value: 'revisado' },
          ],
          defaultValue: 'borrador',
        }),

        hero: fields.object(
          {
            claim: fields.text({
              label: 'Claim',
              description: 'Si se deja vacío se usa el título.',
            }),
            subtitulo: fields.text({ label: 'Subtítulo', multiline: true }),
            plazo: fields.text({
              label: 'Plazo de tramitación',
              description: 'Ej.: «24-48 h». Se muestra como etiqueta.',
            }),
          },
          { label: 'Cabecera' },
        ),

        precio: fields.object(
          {
            honorarios: fields.number({
              label: 'Honorarios (€, IVA incluido)',
              description:
                'Nuestro servicio con el IVA ya sumado, no la base imponible. Ej.: para una base de 57,27 € pon 69,30.',
              validation: { isRequired: true },
            }),
            honorariosProfesional: fields.number({
              label: 'Honorarios para profesionales (€, IVA incluido)',
              description:
                'Tarifa que se muestra cuando en la home se elige el perfil «Profesionales» (gestorías, compraventas, flotas). Déjalo vacío si este trámite cuesta lo mismo para todos.',
            }),
            tasaDgt: fields.number({
              label: 'Tasa DGT (€)',
              description:
                'La tasa es un tributo y no lleva IVA: ponla tal cual. Déjalo vacío si el trámite no tiene tasa.',
            }),
            notas: fields.array(fields.text({ label: 'Nota' }), {
              label: 'Conceptos variables',
              description:
                'Importes que no podemos cerrar de antemano. Ej.: «ITP: según CCAA e importe de la compraventa».',
              itemLabel: (props) => props.value,
            }),
            mostrarDesde: fields.checkbox({
              label: 'Mostrar el total como «desde»',
              defaultValue: true,
            }),
          },
          { label: 'Precio' },
        ),

        pasos: fields.array(
          fields.object({
            titulo: fields.text({ label: 'Título del paso' }),
            descripcion: fields.text({ label: 'Descripción', multiline: true }),
          }),
          {
            label: 'Pasos del proceso',
            itemLabel: (props) => props.fields.titulo.value || 'Paso',
          },
        ),

        documentacion: fields.array(
          fields.object({
            documento: fields.text({ label: 'Documento' }),
            ayuda: fields.text({
              label: 'Aclaración',
              description:
                'Opcional. Aquí es donde van los matices del tipo «solo si el vendedor es una empresa», en lugar de partir la lista en grupos.',
              multiline: true,
            }),
            ilustracion: fields.select({
              label: 'Ilustración',
              options: ILUSTRACIONES as unknown as { label: string; value: string }[],
              defaultValue: 'generico',
            }),
          }),
          {
            label: 'Documentación necesaria',
            description:
              'Una lista única con todo lo que hay que reunir. Se muestra como rejilla con la ilustración de cada documento.',
            itemLabel: (props) => props.fields.documento.value || 'Documento',
          },
        ),

        faqs: fields.array(
          fields.object({
            pregunta: fields.text({ label: 'Pregunta' }),
            respuesta: fields.text({ label: 'Respuesta', multiline: true }),
          }),
          {
            label: 'Preguntas frecuentes',
            description: 'Se publican también como datos estructurados FAQ para Google.',
            itemLabel: (props) => props.fields.pregunta.value || 'Pregunta',
          },
        ),

        ctaLabel: fields.text({
          label: 'Texto del botón',
          description:
            'Concreto y en imperativo, no genérico. Ej.: «Transferir vehículo», «Notificar la venta».',
        }),

        whatsappMensaje: fields.text({
          label: 'Mensaje prellenado de WhatsApp',
          description: 'Lo que aparecerá escrito al abrir el chat desde esta página.',
        }),

        seo: fields.object(
          {
            metaTitle: fields.text({
              label: 'Título SEO',
              description: 'Máx. 60 caracteres. Si se deja vacío se usa el título.',
            }),
            metaDescription: fields.text({
              label: 'Meta description',
              description: 'Máx. 155 caracteres. Si se deja vacío se usa el resumen.',
              multiline: true,
            }),
          },
          { label: 'SEO' },
        ),

        contenidoPregunta: fields.text({
          label: 'Pregunta que abre las FAQ',
          description:
            'La explicación de abajo se publica como la primera pregunta frecuente, desplegada por defecto. Ej.: «¿Qué es una transferencia y cuándo hay que hacerla?».',
        }),

        contenido: fields.markdoc({
          label: 'Explicación del trámite',
          description:
            'Respuesta a la pregunta de arriba. Aparece como primer elemento del bloque de preguntas frecuentes.',
        }),
      },
    }),

    paginas: collection({
      label: 'Páginas',
      path: 'src/content/paginas/*/',
      slugField: 'title',
      format: { contentField: 'contenido' },
      entryLayout: 'content',
      previewUrl: '/{slug}',
      schema: {
        title: fields.slug({
          name: { label: 'Título' },
          slug: {
            label: 'URL',
            description: 'La página quedará en /{slug}. Para enlazarla, añádela al menú en «Menú y pie».',
          },
        }),
        descripcion: fields.text({ label: 'Descripción breve', multiline: true }),
        contenido: fields.markdoc({
          label: 'Contenido',
          components: {
            /**
             * Inserta la ficha del titular —razón social, CIF, domicilio,
             * email y datos registrales— leyéndola de «Datos de la empresa».
             *
             * Es un bloque y no texto escrito a mano para que el aviso legal
             * no se quede desfasado cuando cambien los datos de la empresa: se
             * rellenan una vez en su pantalla y esta página los recoge.
             */
            DatosTitular: block({
              label: 'Datos del titular',
              description:
                'Ficha con los datos de la empresa, tal como estén en «Datos de la empresa».',
              schema: {},
            }),
          },
        }),

        seo: fields.object(
          {
            metaTitle: fields.text({ label: 'Título SEO' }),
            metaDescription: fields.text({ label: 'Meta description', multiline: true }),
          },
          {
            label: 'SEO',
            description: 'Si lo dejas vacío se usan el título y la descripción de arriba.',
          },
        ),
      },
    }),
    /**
     * Piezas para redes sociales. No se publican en la web: el botón «Vista
     * previa» abre `/marca/piezas/<slug>`, que las genera en todos los formatos
     * de Instagram, WhatsApp, LinkedIn, Facebook y YouTube con descarga en PNG,
     * JPG, SVG y PDF. Las plantillas viven en `src/lib/marca/plantillas.tsx`.
     */
    piezas: collection({
      label: 'Imágenes para redes',
      path: 'src/content/marca/piezas/*',
      slugField: 'nombre',
      format: { data: 'json' },
      previewUrl: '/marca/piezas/{slug}?rama={branch}',
      schema: {
        nombre: fields.slug({
          name: {
            label: 'Nombre de la pieza',
            description:
              'Solo para encontrarla en el panel y nombrar los ficheros. No aparece en la imagen.',
          },
        }),
        plantilla: fields.conditional(
          fields.select({
            label: 'Plantilla',
            description:
              'Titular: un mensaje con botón. Lista: titular y puntos con check. Trámite: la ficha de un trámite con su precio. Marca: logo y claim, pensada para portadas y banners. Guarda y pulsa «Vista previa» (arriba a la derecha) para verla en todos los formatos y descargarla.',
            options: PLANTILLAS as unknown as { label: string; value: string }[],
            defaultValue: 'titular',
          }),
          {
            titular: fields.object({
              antetitulo: fields.text({
                label: 'Antetítulo',
                description: 'Opcional. Una etiqueta corta encima del titular. Ej.: «Novedad», «Consejo».',
              }),
              titular: fields.text({
                label: 'Titular',
                multiline: true,
                description:
                  'Envuelve una o dos palabras entre **dobles asteriscos** para subrayarlas en naranja, como en la home.',
              }),
              texto: fields.text({ label: 'Texto', multiline: true, description: 'Opcional. Una o dos frases.' }),
            }),
            lista: fields.object({
              antetitulo: fields.text({ label: 'Antetítulo' }),
              titular: fields.text({
                label: 'Titular',
                multiline: true,
                description: 'Admite **dobles asteriscos** para el subrayado naranja.',
              }),
              puntos: fields.array(fields.text({ label: 'Punto' }), {
                label: 'Puntos',
                description: 'Hasta cinco en los formatos cuadrados y horizontales; siete en las historias.',
                itemLabel: (props) => props.value || 'Punto',
              }),
            }),
            tramite: fields.object({
              tramite: fields.relationship({ label: 'Trámite', collection: 'tramites' }),
              titular: fields.text({
                label: 'Titular',
                multiline: true,
                description: 'Vacío = el claim del trámite. Admite **dobles asteriscos**.',
              }),
              texto: fields.text({ label: 'Texto', multiline: true, description: 'Vacío = el resumen del trámite.' }),
              antetitulo: fields.text({ label: 'Antetítulo', description: 'Vacío = «Trámite online».' }),
              mostrarPrecio: fields.checkbox({
                label: 'Mostrar el precio',
                description: 'Honorarios de particular más la tasa de la DGT, igual que en la ficha de la web.',
                defaultValue: true,
              }),
              mostrarPlazo: fields.checkbox({ label: 'Mostrar el plazo', defaultValue: true }),
            }),
            marca: fields.object({
              titular: fields.text({
                label: 'Claim',
                multiline: true,
                description: 'Vacío = el claim de la home.',
              }),
              texto: fields.text({ label: 'Texto', multiline: true }),
            }),
          },
        ),
        tema: fields.select({
          label: 'Fondo',
          description: 'Los mismos dos temas que la cabecera de la home.',
          options: TEMAS_MARCA as unknown as { label: string; value: string }[],
          defaultValue: 'atardecer',
        }),
        boton: fields.text({
          label: 'Texto del botón',
          description:
            'Vacío = sin botón. Si menciona WhatsApp, lleva el icono de WhatsApp. No se pinta en portadas ni banners.',
          defaultValue: 'Escríbenos por WhatsApp',
        }),
        pie: fields.select({
          label: 'Datos de contacto al pie',
          description: 'Salen de «Datos de la empresa».',
          options: PIES as unknown as { label: string; value: string }[],
          defaultValue: 'ambos',
        }),
        silueta: fields.checkbox({
          label: 'Silueta de la marca',
          description: 'La esquina en arco del logo, a gran tamaño, asomando por abajo a la derecha.',
          defaultValue: true,
        }),
      },
    }),

    /**
     * Tarjetas de visita, una por persona. Igual que las piezas, no se
     * publican: «Vista previa» abre `/marca/tarjetas/<slug>` con el PDF para
     * imprenta (85 × 55 mm, con 3 mm de sangrado) y las caras sueltas.
     */
    tarjetas: collection({
      label: 'Tarjetas de visita',
      path: 'src/content/marca/tarjetas/*',
      slugField: 'nombre',
      format: { data: 'json' },
      previewUrl: '/marca/tarjetas/{slug}?rama={branch}',
      schema: {
        nombre: fields.slug({ name: { label: 'Nombre y apellidos' } }),
        cargo: fields.text({ label: 'Cargo', description: 'Ej.: «Gestora administrativa».' }),
        telefono: fields.text({
          label: 'Teléfono',
          description: 'Vacío = el teléfono de «Datos de la empresa».',
        }),
        email: fields.text({ label: 'Email', description: 'Vacío = el email de «Datos de la empresa».' }),
        whatsapp: fields.checkbox({ label: 'Mostrar el WhatsApp de la empresa', defaultValue: true }),
        web: fields.checkbox({ label: 'Mostrar la web', defaultValue: true }),
        qr: fields.select({
          label: 'Código QR',
          options: QRS as unknown as { label: string; value: string }[],
          defaultValue: 'whatsapp',
        }),
        tema: fields.select({
          label: 'Fondo del anverso',
          description: 'El reverso, con los datos, va siempre en crema para que se lea bien impreso.',
          options: TEMAS_MARCA as unknown as { label: string; value: string }[],
          defaultValue: 'atardecer',
        }),
      },
    }),
  },

  singletons: {
    configuracion: singleton({
      label: 'Datos de la empresa',
      path: 'src/content/configuracion/',
      format: { data: 'json' },
      schema: {
        name: fields.text({ label: 'Nombre comercial' }),
        description: fields.text({ label: 'Descripción del negocio', multiline: true }),
        whatsapp: fields.text({
          label: 'WhatsApp',
          description: 'Formato internacional sin «+» ni espacios. Ej.: 34600000000',
        }),
        email: fields.text({ label: 'Email' }),
        telefono: fields.text({ label: 'Teléfono (para mostrar)' }),
        horario: fields.text({ label: 'Horario de atención' }),
        legal: fields.object(
          {
            razonSocial: fields.text({ label: 'Razón social' }),
            cif: fields.text({ label: 'CIF' }),
            direccion: fields.text({ label: 'Domicilio social' }),
            registro: fields.text({ label: 'Registro mercantil' }),
          },
          { label: 'Datos registrales' },
        ),
      },
    }),

    navegacion: singleton({
      label: 'Menú y pie',
      path: 'src/content/navegacion/',
      format: { data: 'json' },
      schema: {
        menu: fields.array(
          fields.object({
            etiqueta: fields.text({ label: 'Texto del enlace' }),
            enlace: fields.text({
              label: 'Destino',
              description: 'Ruta interna como /contacto, un ancla como /#tramites o una URL completa.',
            }),
          }),
          {
            label: 'Menú principal',
            description:
              'El desplegable de «Trámites» se genera solo desde la colección y no hay que ponerlo aquí.',
            itemLabel: (props) => props.fields.etiqueta.value || 'Enlace',
          },
        ),

        pie: fields.array(
          fields.object({
            etiqueta: fields.text({ label: 'Texto del enlace' }),
            enlace: fields.text({
              label: 'Destino',
              description: 'Ruta interna como /contacto, un ancla como /#tramites o una URL completa.',
            }),
          }),
          {
            label: 'Pie · columna «La web»',
            itemLabel: (props) => props.fields.etiqueta.value || 'Enlace',
          },
        ),

        legales: fields.array(
          fields.object({
            etiqueta: fields.text({ label: 'Texto del enlace' }),
            enlace: fields.text({
              label: 'Destino',
              description: 'Ruta interna como /contacto, un ancla como /#tramites o una URL completa.',
            }),
          }),
          {
            label: 'Pie · columna «Legal»',
            itemLabel: (props) => props.fields.etiqueta.value || 'Enlace',
          },
        ),
      },
    }),

    error404: singleton({
      label: 'Página de error 404',
      path: 'src/content/error404/',
      format: { data: 'json' },
      previewUrl: '/404',
      schema: {
        antetitulo: fields.text({ label: 'Antetítulo' }),
        titulo: fields.text({ label: 'Título' }),
        texto: fields.text({ label: 'Texto', multiline: true }),
        botonPrincipal: fields.text({ label: 'Botón principal' }),
        botonSecundario: fields.text({ label: 'Botón secundario' }),
      },
    }),

    home: singleton({
      label: 'Home',
      previewUrl: '/',
      path: 'src/content/home/',
      format: { data: 'json' },
      schema: {
        tema: fields.select({
          label: 'Tema de la cabecera',
          description:
            'Cambia el color y la textura del bloque superior de la home. En los dos, la barra de navegación va integrada —sin fondo propio— sobre el hero, y se vuelve sólida al bajar.',
          options: [
            { label: 'Atardecer — azul de marca calentado hacia el naranja', value: 'atardecer' },
            { label: 'Crema — papel cálido, texto en azul', value: 'crema' },
          ],
          defaultValue: 'atardecer',
        }),

        hero: fields.object(
          {
            claim: fields.text({
              label: 'Claim',
              description:
                'Envuelve entre **dobles asteriscos** las palabras que quieras subrayar en naranja.',
              multiline: true,
            }),
            subclaim: fields.text({ label: 'Subclaim', multiline: true }),
            ventajas: fields.array(
              fields.object({
                icono: fields.select({
                  label: 'Icono',
                  options: ICONOS_VENTAJA as unknown as { label: string; value: string }[],
                  defaultValue: 'check-circle',
                }),
                texto: fields.text({ label: 'Texto' }),
              }),
              {
                label: 'Franja de ventajas',
                description:
                  'Lo que vale para todos los trámites, no para uno concreto. Cuatro entradas es lo que cuadra con la franja; con más, se parten en varias filas.',
                itemLabel: (props) => props.fields.texto.value || 'Ventaja',
              },
            ),
          },
          { label: 'Cabecera' },
        ),

        tramites: fields.object(
          {
            tituloDestacados: fields.text({ label: 'Título de la primera fila' }),
            tituloTodos: fields.text({ label: 'Título del resto del listado' }),
          },
          {
            label: 'Listado de trámites',
            description:
              'La primera fila la componen los trámites marcados como «destacados» en la colección.',
          },
        ),

        comoFunciona: fields.object(
          {
            titulo: fields.text({ label: 'Título de la sección' }),
            subtitulo: fields.text({
              label: 'Subtítulo',
              description: 'Opcional. Si lo dejas vacío se muestra solo el título.',
              multiline: true,
            }),
            pasos: fields.array(
              fields.object({
                titulo: fields.text({ label: 'Título' }),
                descripcion: fields.text({ label: 'Descripción', multiline: true }),
                detalle: fields.text({
                  label: 'Explicación detallada',
                  description:
                    'Solo se ve en la página «Cómo funciona», no en la home. Deja una línea en blanco entre párrafos.',
                  multiline: true,
                }),
                ilustracion: fields.select({
                  label: 'Ilustración',
                  description: 'Se usa en la página «Cómo funciona».',
                  options: ILUSTRACIONES_PASO,
                  defaultValue: 'formulario',
                }),
              }),
              {
                label: 'Pasos',
                itemLabel: (props) => props.fields.titulo.value || 'Paso',
              },
            ),
          },
          { label: 'Cómo funciona' },
        ),

        logos: fields.array(
          fields.object({
            imagen: fields.image({
              label: 'Logo',
              directory: 'src/assets/logos',
              publicPath: '/src/assets/logos/',
            }),
            alt: fields.text({
              label: 'Texto alternativo',
              description: 'Nombre del organismo o empresa. Lo leen los lectores de pantalla.',
            }),
            ancho: fields.integer({
              label: 'Ancho en píxeles',
              description:
                'Opcional. Solo hace falta para logos en PNG o JPG; los SVG se ajustan solos.',
            }),
          }),
          {
            label: 'Logos institucionales',
            description:
              'Se muestran en una rejilla al final de la home, justo antes del pie. Cinco entradas es lo que cuadra con la fila; con más, se parten en varias.',
            itemLabel: (props) => props.fields.alt.value || 'Logo',
          },
        ),

        seo: fields.object(
          {
            metaTitle: fields.text({ label: 'Título SEO' }),
            metaDescription: fields.text({ label: 'Meta description', multiline: true }),
          },
          { label: 'SEO' },
        ),
      },
    }),

    comoFunciona: singleton({
      label: 'Cómo funciona',
      previewUrl: '/como-funciona',
      path: 'src/content/como-funciona/',
      format: { data: 'json' },
      schema: {
        hero: fields.object(
          {
            titulo: fields.text({ label: 'Título (H1 de la página)' }),
            entradilla: fields.text({ label: 'Entradilla', multiline: true }),
          },
          { label: 'Cabecera' },
        ),

        cierre: fields.object(
          {
            titulo: fields.text({ label: 'Título' }),
            texto: fields.text({ label: 'Texto', multiline: true }),
            whatsappMensaje: fields.text({ label: 'Mensaje prellenado de WhatsApp' }),
          },
          {
            label: 'Bloque de cierre',
            description: 'La franja azul con el botón de WhatsApp al final de la página.',
          },
        ),

        seo: fields.object(
          {
            metaTitle: fields.text({ label: 'Título SEO' }),
            metaDescription: fields.text({ label: 'Meta description', multiline: true }),
          },
          { label: 'SEO' },
        ),
      },
    }),

    contacto: singleton({
      label: 'Contacto',
      previewUrl: '/contacto',
      path: 'src/content/contacto/',
      format: { data: 'json' },
      schema: {
        hero: fields.object(
          {
            titulo: fields.text({ label: 'Título (H1 de la página)' }),
            entradilla: fields.text({ label: 'Entradilla', multiline: true }),
          },
          {
            label: 'Cabecera',
            description:
              'El teléfono, el email y el horario que aparecen en la página salen de Configuración, no de aquí.',
          },
        ),

        seo: fields.object(
          {
            metaTitle: fields.text({ label: 'Título SEO' }),
            metaDescription: fields.text({ label: 'Meta description', multiline: true }),
          },
          { label: 'SEO' },
        ),
      },
    }),

    faqs: singleton({
      label: 'Preguntas frecuentes',
      previewUrl: '/faqs',
      path: 'src/content/faqs/',
      format: { data: 'json' },
      schema: {
        hero: fields.object(
          {
            titulo: fields.text({ label: 'Título (H1 de la página)' }),
            entradilla: fields.text({ label: 'Entradilla', multiline: true }),
          },
          { label: 'Cabecera' },
        ),

        generales: fields.array(
          fields.object({
            pregunta: fields.text({ label: 'Pregunta' }),
            respuesta: fields.text({ label: 'Respuesta', multiline: true }),
          }),
          {
            label: 'Preguntas generales',
            description:
              'Solo las dudas que no son de un trámite concreto. Las de cada trámite se recogen solas desde su ficha, no hay que copiarlas aquí.',
            itemLabel: (props) => props.fields.pregunta.value || 'Pregunta',
          },
        ),

        seo: fields.object(
          {
            metaTitle: fields.text({ label: 'Título SEO' }),
            metaDescription: fields.text({ label: 'Meta description', multiline: true }),
          },
          { label: 'SEO' },
        ),
      },
    }),
  },
});

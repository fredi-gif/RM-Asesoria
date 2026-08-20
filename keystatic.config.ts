import { config, fields, collection, singleton } from '@keystatic/core';

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
] as const;

/**
 * Ilustraciones de documento disponibles.
 * Debe mantenerse en sintonía con `ILUSTRACIONES` en
 * `src/components/tramite/DocIlustracion.astro`.
 */
const ILUSTRACIONES = [
  { label: 'Permiso de circulación', value: 'permiso-circulacion' },
  { label: 'Ficha técnica / tarjeta ITV', value: 'ficha-tecnica' },
  { label: 'DNI, NIE o pasaporte', value: 'dni' },
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
    brand: { name: 'RM Gestión' },
    navigation: {
      Contenido: ['tramites'],
      Páginas: ['home', 'comoFunciona', 'contacto', 'faqs', 'paginas'],
      Configuración: ['configuracion'],
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

        icon: fields.select({
          label: 'Icono',
          options: ICONOS as unknown as { label: string; value: string }[],
          defaultValue: 'documento',
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
            '«Borrador» marca el trámite como pendiente de validar. Se sigue publicando, pero avisa en desarrollo.',
          options: [
            { label: 'Borrador — pendiente de revisar', value: 'borrador' },
            { label: 'Revisado', value: 'revisado' },
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
      label: 'Páginas legales',
      path: 'src/content/paginas/*/',
      slugField: 'title',
      format: { contentField: 'contenido' },
      entryLayout: 'content',
      schema: {
        title: fields.slug({ name: { label: 'Título' } }),
        descripcion: fields.text({ label: 'Meta description', multiline: true }),
        actualizado: fields.date({ label: 'Última actualización' }),
        contenido: fields.markdoc({ label: 'Contenido' }),
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

    home: singleton({
      label: 'Home',
      path: 'src/content/home/',
      format: { data: 'json' },
      schema: {
        hero: fields.object(
          {
            claim: fields.text({
              label: 'Claim',
              description:
                'Envuelve entre **dobles asteriscos** las palabras que quieras subrayar en naranja.',
              multiline: true,
            }),
            subclaim: fields.text({ label: 'Subclaim', multiline: true }),
            ctaPrimario: fields.text({ label: 'Texto del botón' }),
            whatsappMensaje: fields.text({ label: 'Mensaje prellenado de WhatsApp' }),
          },
          { label: 'Cabecera' },
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
      label: 'Página «Cómo funciona»',
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
      label: 'Página «Contacto»',
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
      label: 'Página «Preguntas frecuentes»',
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

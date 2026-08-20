import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
// Astro 7 deprecó el reexport `z` de `astro:content`; se importa de zod directamente.
import { z } from 'zod';

/**
 * Los schemas de aquí son el espejo en zod de `keystatic.config.ts`.
 * Si cambias un campo allí, cámbialo aquí — es lo que da tipado y lo que
 * hace fallar el build si el contenido queda inconsistente.
 *
 * Keystatic guarda cada entrada como `<slug>/index.mdoc`, así que el
 * `generateId` recorta el `/index` para que el id sea el slug limpio.
 */
const stripIndex = ({ entry }: { entry: string }) => entry.replace(/\/index\.mdoc$/, '');

const tramites = defineCollection({
  loader: glob({
    base: './src/content/tramites',
    pattern: '**/index.mdoc',
    generateId: stripIndex,
  }),
  schema: z.object({
    title: z.string(),
    shortTitle: z.string(),
    summary: z.string(),
    icon: z.string(),
    /** Ruta del fichero subido desde el panel. Sustituye a la ilustración. */
    imagen: z.string().nullable().default(null),
    destacado: z.boolean().default(false),
    orden: z.number().default(100),
    estado: z.enum(['borrador', 'revisado']).default('borrador'),

    hero: z.object({
      claim: z.string().nullable().default(null),
      subtitulo: z.string().nullable().default(null),
      plazo: z.string().nullable().default(null),
    }),

    precio: z.object({
      honorarios: z.number(),
      tasaDgt: z.number().nullable().default(null),
      notas: z.array(z.string()).default([]),
      mostrarDesde: z.boolean().default(true),
    }),

    pasos: z
      .array(
        z.object({
          titulo: z.string(),
          descripcion: z.string(),
        }),
      )
      .default([]),

    documentacion: z
      .array(
        z.object({
          documento: z.string(),
          ayuda: z.string().nullable().default(null),
          ilustracion: z.string().default('generico'),
        }),
      )
      .default([]),

    faqs: z
      .array(
        z.object({
          pregunta: z.string(),
          respuesta: z.string(),
        }),
      )
      .default([]),

    ctaLabel: z.string().nullable().default(null),
    whatsappMensaje: z.string().nullable().default(null),
    contenidoPregunta: z.string().nullable().default(null),

    seo: z.object({
      metaTitle: z.string().nullable().default(null),
      metaDescription: z.string().nullable().default(null),
    }),
  }),
});

const paginas = defineCollection({
  loader: glob({
    base: './src/content/paginas',
    pattern: '**/index.mdoc',
    generateId: stripIndex,
  }),
  schema: z.object({
    title: z.string(),
    descripcion: z.string().nullable().default(null),
    // Keystatic guarda la fecha sin comillas, así que YAML ya la entrega como Date.
    actualizado: z.coerce.date().nullable().default(null),

    // Opcional entero: las páginas que ya existían no lo traen en el fichero.
    seo: z
      .object({
        metaTitle: z.string().nullable().default(null),
        metaDescription: z.string().nullable().default(null),
      })
      .default({ metaTitle: null, metaDescription: null }),
  }),
});

export const collections = { tramites, paginas };

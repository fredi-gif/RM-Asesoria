# RM Gestión — web de trámites de vehículos

Web de captación para una gestoría de trámites de vehículos online. Astro + Keystatic + Tailwind.

```bash
pnpm install
pnpm dev        # http://localhost:4321  ·  panel en /keystatic
pnpm check      # tipos
pnpm build      # build de producción
```

## Cómo está organizado

| Ruta | Qué es |
| --- | --- |
| `/` | Home: cabecera, rejilla de trámites y «Tramitar con RM Gestión». Ancla: `#tramites`, `#tramitar` |
| `/tramites` | Índice completo |
| `/tramites/[slug]` | Página de trámite. Anclas: `#pasos`, `#documentacion`, `#precio`, `#faq` |
| `/aviso-legal`, `/privacidad`, `/cookies` | Legales |
| `/styleguide` | Guía de estilo interna. `noindex` y fuera del sitemap |
| `/keystatic` | Panel de contenidos |

## Los archivos que se tocan a menudo

| Archivo | Para qué |
| --- | --- |
| `src/styles/tokens.css` | **Toda la paleta y la tipografía.** Recolorear la marca es editar solo este archivo |
| `src/config/site.ts` | URL del sitio y valores de respaldo de los datos de empresa |
| `src/content/configuracion/index.json` | Datos de empresa (editable desde Keystatic) |
| `src/components/layout/Logo.astro` | Logo provisional |
| `keystatic.config.ts` | Modelo de contenido |
| `src/content.config.ts` | Espejo en zod del modelo, para tipado y validación en build |

## Contenido

Cada trámite es una carpeta en `src/content/tramites/<slug>/index.mdoc`. El frontmatter lleva precio, pasos, documentación agrupada y FAQs; el cuerpo es el bloque «Qué es y cuándo lo necesitas».

Todos los trámites están marcados con `estado: borrador`. En `pnpm dev` aparece un aviso amarillo en la página mientras siga en ese estado. Al validar el contenido con el cliente, cambiar a `estado: revisado`.

Para añadir un trámite nuevo no hace falta tocar código: se crea desde `/keystatic` y aparece solo en la home, en el menú, en el footer y en el sitemap.

El catálogo **no se agrupa por categorías** en ningún sitio: es una rejilla única en la home, en `/tramites` y en el desplegable del menú. El orden lo dan `destacado` (primero), luego `orden` y, en caso de empate, el alfabético.

La documentación va como **lista plana**, no agrupada por casos: el usuario ve de una vez todo lo que tiene que reunir. Los matices («solo si vende una empresa», «solo si fue por robo») van en el campo `ayuda` de cada documento, no en la estructura.

El bloque de preguntas frecuentes se abre con la **explicación del trámite**: el campo `contenidoPregunta` es el enunciado y el cuerpo del `.mdoc` es la respuesta, desplegada por defecto.

### Iconos e ilustraciones

Tres catálogos, gobernados por dos campos de Keystatic:

| Catálogo | Componente | Campo que lo elige |
| --- | --- | --- |
| Iconos de trámite | `src/components/ui/Icon.astro` | `icon` (select `ICONOS`) |
| Ilustraciones de trámite | `src/components/tramite/TramiteIlustracion.astro` | `icon`, el mismo |
| Ilustraciones de documento | `src/components/tramite/DocIlustracion.astro` | `ilustracion` (select `ILUSTRACIONES`) |

El campo **`icon` gobierna dos cosas a la vez**: el icono pequeño (menú, footer, flechas) y la ilustración grande de la tarjeta del listado. Están indexados por el mismo nombre, así que un trámite nuevo que reutilice un icono existente ya trae ilustración sin dibujar nada.

Si añades un nombre nuevo, hay que darlo de alta en los **tres** sitios: el mapa `PATHS` de `Icon.astro`, el mapa `ILUSTRACIONES` de `TramiteIlustracion.astro` y el `select` de `keystatic.config.ts`.

Los tres se ven completos en `/styleguide`. Las ilustraciones de documento son representaciones estilizadas para que el usuario reconozca qué papel buscar, no reproducciones del documento oficial.

## Conversión

El CTA está centralizado en `src/components/tramite/WhatsAppCTA.astro`, que compone el enlace `wa.me` con el mensaje prellenado de cada trámite (campo `whatsappMensaje`).

El texto del botón sale del campo `ctaLabel` y debe ser **concreto y en imperativo** («Transferir vehículo», «Notificar la venta»), no genérico. El genérico solo se usa en la navegación del header, que no pertenece a ningún trámite.

Cuando el CTA pase a ser el formulario de captación inteligente, se cambia ese componente y toda la web queda migrada de una vez.

## Notas técnicas

- **TypeScript fijado en 6.x.** `astro check` usa una API programática que TypeScript 7 todavía no expone. Al actualizar, comprobar antes que `pnpm check` sigue funcionando.
- **Fondos de sección.** Usa siempre la prop `tone` de `Section.astro`, no una clase `bg-*` suelta: ambas empatan en especificidad y quién gana lo decide el orden del CSS, no el del atributo.
- **Sin cookies ni analítica.** No hay banner de consentimiento porque no se instala ninguna cookie. Al añadir analítica habrá que montar el banner (rechazar por defecto) y actualizar `/cookies`.

## Despliegue

Vercel detecta Astro automáticamente. Para que el cliente pueda editar en producción hay que pasar Keystatic a GitHub mode:

1. Subir el repo a GitHub y conectarlo a Vercel.
2. En `keystatic.config.ts`, cambiar el `storage` por:
   ```ts
   storage: { kind: 'github', repo: { owner: 'ORG', name: 'REPO' } }
   ```
3. Entrar en `/keystatic`, iniciar sesión con GitHub y seguir el asistente que crea la GitHub App. Genera un `.env` con las credenciales.
4. Copiar esas variables al proyecto de Vercel:
   ```
   KEYSTATIC_GITHUB_CLIENT_ID
   KEYSTATIC_GITHUB_CLIENT_SECRET
   KEYSTATIC_SECRET
   PUBLIC_KEYSTATIC_GITHUB_APP_SLUG
   ```

A partir de ahí, cada cambio guardado en `/keystatic` genera un commit y Vercel redespliega solo.

## Pendiente

- Logo real en SVG y los hex definitivos de azul y naranja.
- Nombre comercial, dominio, WhatsApp Business, email, CIF y domicilio social.
- **Validar precios, tasas y documentación de los 12 trámites.** El contenido actual es un borrador de trabajo.
- Revisión de las tres páginas legales por un asesor; llevan los huecos marcados entre corchetes.

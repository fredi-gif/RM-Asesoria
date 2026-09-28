/**
 * El editor del estudio de imagen de marca: formulario a la izquierda y, a la
 * derecha, todas las piezas generadas con lo que hay escrito, sin guardar.
 *
 * Las imágenes las genera el servidor (Satori no cabe en el navegador): cada
 * cambio se codifica en la URL de la imagen (`?borrador=…`, ver
 * `lib/marca/entradas.ts`) y el navegador la vuelve a pedir. Por eso lo que
 * se descarga es siempre lo que se ve. Guardar escribe el JSON de la entrada
 * donde lo escribiría el panel (ver `lib/marca/escribir.ts`).
 *
 * Los campos, etiquetas y ayudas son los de `keystatic.config.ts`. Si cambia
 * el esquema allí, hay que cambiarlo aquí y en `lib/marca/entradas.ts`.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';

import { CARAS, EXTENSIONES, FORMATOS, REDES, TARJETA, type Formato, type Red } from '../../lib/marca/formatos';
import { PIES, PLANTILLAS, QRS, TEMAS_MARCA, type Plantilla } from '../../lib/marca/opciones';
import {
  codificarBorrador,
  normalizar,
  valoresPlantilla,
  type EntradaPieza,
  type EntradaTarjeta,
  type PlantillaGuardada,
  type Tipo,
  type ValoresPlantilla,
} from '../../lib/marca/entradas';

interface Props {
  tipo: Tipo;
  slug: string | null;
  rama: string | null;
  inicial: EntradaPieza | EntradaTarjeta;
  tramites: { value: string; label: string }[];
  empresa: { telefono: string; email: string };
  /** En local se guarda en disco; en producción, en GitHub. Sólo cambia el texto del aviso. */
  local: boolean;
}

type Aviso = { tipo: 'ok' | 'error'; texto: string; enlace?: { href: string; texto: string } };

const NOMBRES = {
  piezas: { lista: 'Imágenes para redes', una: 'pieza', nueva: 'Nueva pieza' },
  tarjetas: { lista: 'Tarjetas de visita', una: 'tarjeta', nueva: 'Nueva tarjeta' },
} as const;

const DESCRIPCION_PLANTILLA: Record<Plantilla, string> = {
  titular: 'Un mensaje con botón.',
  lista: 'Titular y puntos con check.',
  tramite: 'La ficha de un trámite con su precio.',
  marca: 'Logo y claim. Para portadas y banners.',
};

const MUESTRA_TEMA: Record<string, string> = {
  atardecer: 'linear-gradient(150deg, #0a1f44 0%, #132b4f 45%, #3b2a3f 78%, #5a2f2a 100%)',
  crema: '#fcf9f3',
};

const ETIQUETA_EXT: Record<string, string> = { png: 'PNG', jpg: 'JPG', svg: 'SVG', pdf: 'PDF' };

const consulta = (pares: Record<string, string | null | false | undefined>) => {
  const q = Object.entries(pares)
    .filter(([, v]) => v !== null && v !== false && v !== undefined)
    .map(([k, v]) => (v === '' ? k : `${k}=${encodeURIComponent(v as string)}`))
    .join('&');
  return q ? `?${q}` : '';
};

/**
 * El token del panel caduca a las pocas horas. Keystatic lo renueva con su
 * endpoint de refresco; aquí se usa el mismo, una sola vez a la vez.
 */
let refresco: Promise<boolean> | null = null;
function refrescarSesion(): Promise<boolean> {
  refresco ??= fetch('/api/keystatic/github/refresh-token', { method: 'POST' })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => setTimeout(() => (refresco = null), 10_000));
  return refresco;
}

function useRetrasado<T>(valor: T, ms: number): T {
  const [retrasado, setRetrasado] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setRetrasado(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return retrasado;
}

export default function Estudio(props: Props) {
  const { tipo, rama, local } = props;
  const nombres = NOMBRES[tipo];

  const [entrada, setEntrada] = useState(props.inicial);
  const [slug, setSlug] = useState(props.slug);
  const [sha, setSha] = useState<string | null>(null);
  const firma = useCallback((e: unknown) => JSON.stringify(normalizar(tipo, e)), [tipo]);
  const [guardada, setGuardada] = useState<string | null>(() => (props.slug ? firma(props.inicial) : null));
  const [ocupado, setOcupado] = useState<'guardando' | 'eliminando' | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [intento, setIntento] = useState(0);
  const nombreRef = useRef<HTMLInputElement>(null);

  const sucio = firma(entrada) !== guardada;
  const borrador = useRetrasado(useMemo(() => codificarBorrador(normalizar(tipo, entrada)), [tipo, entrada]), 450);

  const base = `/marca/${tipo}/${slug ?? 'nueva'}`;
  const url = (id: string, ext: string, descargar = false) =>
    `${base}/${id}.${ext}${consulta({ rama, borrador, descargar: descargar && '', r: intento ? String(intento) : null })}`;
  const urlLista = `/marca/${tipo}${consulta({ rama })}`;

  // Avisar antes de salir con cambios sin guardar.
  useEffect(() => {
    if (!sucio) return;
    const aviso = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', aviso);
    return () => window.removeEventListener('beforeunload', aviso);
  }, [sucio]);

  const peticion = useCallback(
    async (metodo: 'POST' | 'DELETE', cuerpo: unknown, reintentar = true): Promise<Record<string, unknown>> => {
      const r = await fetch(`/api/marca/${tipo}`, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      });
      if (r.status === 401 && reintentar && (await refrescarSesion())) return peticion(metodo, cuerpo, false);
      const datos = (await r.json().catch(() => ({}))) as Record<string, unknown>;
      if (r.status === 401) throw new Error('sin-sesion');
      if (!r.ok) throw new Error(typeof datos.error === 'string' ? datos.error : `Error ${r.status}`);
      return datos;
    },
    [tipo],
  );

  const errorDe = (error: unknown): Aviso =>
    error instanceof Error && error.message === 'sin-sesion'
      ? {
          tipo: 'error',
          texto: 'La sesión del panel ha caducado. Entra de nuevo en el panel (en otra pestaña, para no perder los cambios) y vuelve a guardar.',
          enlace: { href: '/keystatic', texto: 'Abrir el panel' },
        }
      : { tipo: 'error', texto: error instanceof Error ? error.message : 'No se ha podido guardar.' };

  const guardar = useCallback(async () => {
    if (ocupado) return;
    if (!entrada.nombre.trim()) {
      setAviso({ tipo: 'error', texto: `Ponle un nombre a la ${nombres.una} antes de guardar.` });
      nombreRef.current?.focus();
      return;
    }
    setOcupado('guardando');
    setAviso(null);
    try {
      const limpia = normalizar(tipo, entrada);
      const r = await peticion('POST', { rama, slug, sha, entrada: limpia });
      const nuevoSlug = String(r.slug);
      setSha(typeof r.sha === 'string' ? r.sha : null);
      setGuardada(firma(limpia));
      if (nuevoSlug !== slug) {
        setSlug(nuevoSlug);
        window.history.replaceState(null, '', `/marca/${tipo}/${nuevoSlug}${consulta({ rama })}`);
      }
      setAviso({
        tipo: 'ok',
        texto: local
          ? 'Guardado.'
          : `Guardado en GitHub${rama ? ` (rama ${rama})` : ''}. También lo verás en el panel.`,
      });
    } catch (error) {
      setAviso(errorDe(error));
    } finally {
      setOcupado(null);
    }
  }, [ocupado, entrada, nombres.una, tipo, peticion, rama, slug, sha, firma, local]);

  // Cmd/Ctrl + S guarda, como en el panel.
  useEffect(() => {
    const atajo = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void guardar();
      }
    };
    window.addEventListener('keydown', atajo);
    return () => window.removeEventListener('keydown', atajo);
  }, [guardar]);

  const eliminar = async () => {
    if (!slug) return;
    if (!window.confirm(`¿Borrar «${entrada.nombre || slug}»? No se puede deshacer desde aquí.`)) return;
    setOcupado('eliminando');
    try {
      await peticion('DELETE', { rama, slug });
      setGuardada(firma(entrada)); // para que no salte el aviso de cambios sin guardar
      window.location.assign(urlLista);
    } catch (error) {
      setAviso(errorDe(error));
      setOcupado(null);
    }
  };

  const duplicar = () => {
    setEntrada((e) => ({ ...e, nombre: `${e.nombre} (copia)`.trim() }));
    setSlug(null);
    setSha(null);
    setGuardada(null);
    setAviso({ tipo: 'ok', texto: `Es una copia sin guardar. Cámbiale lo que quieras y guárdala como ${nombres.una} nueva.` });
    window.history.replaceState(null, '', `/marca/${tipo}/nueva${consulta({ rama })}`);
  };

  // Si una imagen falla por la sesión, se renueva una vez y se vuelven a pedir.
  const alFallarImagen = useCallback(async () => {
    if (intento > 0) return;
    if (await refrescarSesion()) setIntento((n) => n + 1);
  }, [intento]);

  const cambiar = <K extends string>(clave: K, valor: unknown) => setEntrada((e) => ({ ...e, [clave]: valor }));

  return (
    <div className="mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-[minmax(360px,440px)_1fr]">
      {/* ------------------------------------------------------------------ */}
      {/* Formulario */}
      <aside className="border-line bg-white lg:sticky lg:top-[61px] lg:h-[calc(100vh-61px)] lg:overflow-y-auto lg:border-r">
        <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-line bg-white px-5 py-4">
          <a href={urlLista} className="font-display text-sm font-semibold text-ink-muted hover:text-brand-900">
            ← {nombres.lista}
          </a>
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-col">
              <h1 className="truncate font-display text-xl font-bold text-brand-900">
                {entrada.nombre || nombres.nueva}
              </h1>
              <span className={`text-sm ${sucio ? 'text-warning' : 'text-ink-subtle'}`}>
                {ocupado === 'guardando'
                  ? 'Guardando…'
                  : ocupado === 'eliminando'
                    ? 'Borrando…'
                    : sucio
                      ? slug
                        ? 'Cambios sin guardar'
                        : 'Sin guardar todavía'
                      : 'Todo guardado'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => void guardar()}
              disabled={!!ocupado || !sucio}
              title="Guardar (Ctrl + S)"
              className="shrink-0 rounded-md bg-accent-500 px-5 py-2.5 font-display font-semibold text-white hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {ocupado === 'guardando' ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
          {aviso && (
            <p
              role={aviso.tipo === 'error' ? 'alert' : 'status'}
              className={`rounded-md px-3 py-2 text-sm ${
                aviso.tipo === 'error' ? 'bg-red-50 text-danger' : 'bg-green-50 text-success'
              }`}
            >
              {aviso.texto}{' '}
              {aviso.enlace && (
                <a href={aviso.enlace.href} target="_blank" rel="noreferrer" className="font-semibold underline">
                  {aviso.enlace.texto}
                </a>
              )}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-6 px-5 py-6">
          {tipo === 'piezas' ? (
            <FormularioPieza
              entrada={entrada as EntradaPieza}
              setEntrada={setEntrada as (f: (e: EntradaPieza) => EntradaPieza) => void}
              cambiar={cambiar}
              tramites={props.tramites}
              nombreRef={nombreRef}
            />
          ) : (
            <FormularioTarjeta
              entrada={entrada as EntradaTarjeta}
              cambiar={cambiar}
              empresa={props.empresa}
              nombreRef={nombreRef}
            />
          )}

          {slug && (
            <div className="flex flex-wrap gap-2 border-t border-line pt-6">
              <button type="button" onClick={duplicar} disabled={!!ocupado} className={BOTON_SECUNDARIO}>
                Duplicar
              </button>
              <button
                type="button"
                onClick={() => void eliminar()}
                disabled={!!ocupado}
                className="rounded-md border border-line px-3 py-1.5 font-display text-sm font-semibold text-danger hover:border-red-200 hover:bg-red-50"
              >
                {ocupado === 'eliminando' ? 'Borrando…' : 'Borrar'}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* Vista previa y descargas */}
      <main className="flex min-w-0 flex-col gap-10 px-4 py-8 sm:px-8">
        {tipo === 'piezas' ? (
          <VistaPiezas url={url} alFallar={alFallarImagen} />
        ) : (
          <VistaTarjeta url={url} alFallar={alFallarImagen} />
        )}
      </main>

      {/* En el móvil el botón de guardar se queda arriba del todo: uno flotante. */}
      {sucio && (
        <button
          type="button"
          onClick={() => void guardar()}
          disabled={!!ocupado}
          className="fixed right-4 bottom-4 z-40 rounded-full bg-accent-500 px-5 py-3 font-display font-semibold text-white shadow-lg hover:bg-accent-600 lg:hidden"
        >
          {ocupado === 'guardando' ? 'Guardando…' : 'Guardar'}
        </button>
      )}
    </div>
  );
}

const BOTON_SECUNDARIO =
  'rounded-md border border-line px-3 py-1.5 font-display text-sm font-semibold text-brand-900 hover:border-brand-100 hover:bg-brand-50 disabled:opacity-50';

// ---------------------------------------------------------------------------
// Formularios

function FormularioPieza({
  entrada,
  setEntrada,
  cambiar,
  tramites,
  nombreRef,
}: {
  entrada: EntradaPieza;
  setEntrada: (f: (e: EntradaPieza) => EntradaPieza) => void;
  cambiar: (clave: string, valor: unknown) => void;
  tramites: Props['tramites'];
  nombreRef: React.RefObject<HTMLInputElement | null>;
}) {
  // Lo escrito en cada plantilla se recuerda al cambiar de una a otra, y el
  // antetítulo, el titular y el texto pasan de una a la siguiente.
  const memoria = useRef<Partial<Record<Plantilla, unknown>>>({});
  const plantilla = entrada.plantilla.discriminant;
  const valor = entrada.plantilla.value as ValoresPlantilla[Plantilla];

  const cambiarPlantilla = (nueva: Plantilla) => {
    if (nueva === plantilla) return;
    memoria.current[plantilla] = valor;
    const comun = { antetitulo: '', titular: '', texto: '', ...(valor as object) };
    const siguiente = valoresPlantilla(nueva, memoria.current[nueva] ?? comun);
    setEntrada((e) => ({ ...e, plantilla: { discriminant: nueva, value: siguiente } as PlantillaGuardada }));
  };
  const cambiarValor = (clave: string, v: unknown) =>
    setEntrada((e) => ({
      ...e,
      plantilla: { ...e.plantilla, value: { ...e.plantilla.value, [clave]: v } } as PlantillaGuardada,
    }));
  const v = valor as Partial<ValoresPlantilla['tramite'] & ValoresPlantilla['lista']>;

  return (
    <>
      <Campo
        etiqueta="Nombre de la pieza"
        ayuda="Solo para encontrarla en la lista y nombrar los ficheros. No aparece en la imagen."
      >
        {(id) => (
          <input
            id={id}
            ref={nombreRef}
            className={ENTRADA}
            value={entrada.nombre}
            onChange={(e) => cambiar('nombre', e.target.value)}
            placeholder="Ej.: Transferencia online"
          />
        )}
      </Campo>

      <Grupo etiqueta="Plantilla">
        <div className="grid grid-cols-2 gap-2">
          {PLANTILLAS.map((p) => (
            <Opcion
              key={p.value}
              nombre="plantilla"
              marcada={plantilla === p.value}
              alElegir={() => cambiarPlantilla(p.value)}
            >
              <span className="font-display text-sm font-semibold text-brand-900">{p.label}</span>
              <span className="text-xs text-ink-muted">{DESCRIPCION_PLANTILLA[p.value]}</span>
            </Opcion>
          ))}
        </div>
      </Grupo>

      <div className="flex flex-col gap-5 rounded-lg bg-surface-alt p-4">
        {plantilla === 'tramite' && (
          <Campo etiqueta="Trámite">
            {(id) => (
              <select
                id={id}
                className={ENTRADA}
                value={v.tramite ?? ''}
                onChange={(e) => cambiarValor('tramite', e.target.value)}
              >
                <option value="">Elige un trámite…</option>
                {tramites.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            )}
          </Campo>
        )}

        {plantilla !== 'marca' && (
          <Campo
            etiqueta="Antetítulo"
            ayuda={
              plantilla === 'tramite'
                ? 'Vacío = «Trámite online».'
                : 'Opcional. Una etiqueta corta encima del titular. Ej.: «Novedad», «Consejo».'
            }
          >
            {(id) => (
              <input
                id={id}
                className={ENTRADA}
                value={v.antetitulo ?? ''}
                onChange={(e) => cambiarValor('antetitulo', e.target.value)}
              />
            )}
          </Campo>
        )}

        <Titular
          etiqueta={plantilla === 'marca' ? 'Claim' : 'Titular'}
          ayuda={
            plantilla === 'marca'
              ? 'Vacío = el claim de la home.'
              : plantilla === 'tramite'
                ? 'Vacío = el claim del trámite.'
                : undefined
          }
          valor={v.titular ?? ''}
          alCambiar={(t) => cambiarValor('titular', t)}
        />

        {plantilla !== 'lista' && (
          <Campo
            etiqueta="Texto"
            ayuda={plantilla === 'tramite' ? 'Vacío = el resumen del trámite.' : 'Opcional. Una o dos frases.'}
          >
            {(id) => (
              <textarea
                id={id}
                rows={3}
                className={ENTRADA}
                value={(valor as { texto?: string }).texto ?? ''}
                onChange={(e) => cambiarValor('texto', e.target.value)}
              />
            )}
          </Campo>
        )}

        {plantilla === 'lista' && <Puntos puntos={v.puntos ?? []} alCambiar={(p) => cambiarValor('puntos', p)} />}

        {plantilla === 'tramite' && (
          <div className="flex flex-col gap-2">
            <Casilla
              etiqueta="Mostrar el precio"
              ayuda="Honorarios de particular más la tasa de la DGT, igual que en la ficha de la web."
              marcada={v.mostrarPrecio !== false}
              alCambiar={(m) => cambiarValor('mostrarPrecio', m)}
            />
            <Casilla
              etiqueta="Mostrar el plazo"
              marcada={v.mostrarPlazo !== false}
              alCambiar={(m) => cambiarValor('mostrarPlazo', m)}
            />
          </div>
        )}
      </div>

      <Tema valor={entrada.tema} alCambiar={(t) => cambiar('tema', t)} ayuda="Los mismos dos temas que la cabecera de la home." />

      <Campo
        etiqueta="Texto del botón"
        ayuda="Vacío = sin botón. Si menciona WhatsApp, lleva el icono de WhatsApp. No se pinta en portadas ni banners."
      >
        {(id) => (
          <input id={id} className={ENTRADA} value={entrada.boton} onChange={(e) => cambiar('boton', e.target.value)} />
        )}
      </Campo>

      <Campo etiqueta="Datos de contacto al pie" ayuda="Salen de «Datos de la empresa» del panel.">
        {(id) => (
          <select id={id} className={ENTRADA} value={entrada.pie} onChange={(e) => cambiar('pie', e.target.value)}>
            {PIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        )}
      </Campo>

      <Casilla
        etiqueta="Silueta de la marca"
        ayuda="La esquina en arco del logo, a gran tamaño, asomando por abajo a la derecha."
        marcada={entrada.silueta}
        alCambiar={(m) => cambiar('silueta', m)}
      />
    </>
  );
}

function FormularioTarjeta({
  entrada,
  cambiar,
  empresa,
  nombreRef,
}: {
  entrada: EntradaTarjeta;
  cambiar: (clave: string, valor: unknown) => void;
  empresa: Props['empresa'];
  nombreRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <>
      <Campo etiqueta="Nombre y apellidos">
        {(id) => (
          <input
            id={id}
            ref={nombreRef}
            className={ENTRADA}
            value={entrada.nombre}
            onChange={(e) => cambiar('nombre', e.target.value)}
          />
        )}
      </Campo>
      <Campo etiqueta="Cargo" ayuda="Ej.: «Gestora administrativa».">
        {(id) => (
          <input id={id} className={ENTRADA} value={entrada.cargo} onChange={(e) => cambiar('cargo', e.target.value)} />
        )}
      </Campo>
      <Campo etiqueta="Teléfono" ayuda="Vacío = el teléfono de «Datos de la empresa».">
        {(id) => (
          <input
            id={id}
            type="tel"
            className={ENTRADA}
            value={entrada.telefono}
            placeholder={empresa.telefono}
            onChange={(e) => cambiar('telefono', e.target.value)}
          />
        )}
      </Campo>
      <Campo etiqueta="Email" ayuda="Vacío = el email de «Datos de la empresa».">
        {(id) => (
          <input
            id={id}
            type="email"
            className={ENTRADA}
            value={entrada.email}
            placeholder={empresa.email}
            onChange={(e) => cambiar('email', e.target.value)}
          />
        )}
      </Campo>
      <div className="flex flex-col gap-2">
        <Casilla etiqueta="Mostrar el WhatsApp de la empresa" marcada={entrada.whatsapp} alCambiar={(m) => cambiar('whatsapp', m)} />
        <Casilla etiqueta="Mostrar la web" marcada={entrada.web} alCambiar={(m) => cambiar('web', m)} />
      </div>
      <Grupo etiqueta="Código QR">
        <div className="grid grid-cols-3 gap-2">
          {QRS.map((q) => (
            <Opcion key={q.value} nombre="qr" marcada={entrada.qr === q.value} alElegir={() => cambiar('qr', q.value)}>
              <span className="font-display text-sm font-semibold text-brand-900">{q.label}</span>
            </Opcion>
          ))}
        </div>
      </Grupo>
      <Tema
        etiqueta="Fondo del anverso"
        ayuda="El reverso, con los datos, va siempre en crema para que se lea bien impreso."
        valor={entrada.tema}
        alCambiar={(t) => cambiar('tema', t)}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Piezas de formulario

const ENTRADA =
  'w-full rounded-md border border-line bg-white px-3 py-2 text-ink placeholder:text-ink-subtle focus:border-brand-600 focus:ring-2 focus:ring-brand-100 focus:outline-none';

function Campo({ etiqueta, ayuda, children }: { etiqueta: string; ayuda?: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-display text-sm font-semibold text-brand-900">
        {etiqueta}
      </label>
      {children(id)}
      {ayuda && <p className="text-xs text-ink-muted">{ayuda}</p>}
    </div>
  );
}

function Grupo({ etiqueta, ayuda, children }: { etiqueta: string; ayuda?: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 font-display text-sm font-semibold text-brand-900">{etiqueta}</legend>
      {children}
      {ayuda && <p className="text-xs text-ink-muted">{ayuda}</p>}
    </fieldset>
  );
}

function Opcion({
  nombre,
  marcada,
  alElegir,
  children,
}: {
  nombre: string;
  marcada: boolean;
  alElegir: () => void;
  children: ReactNode;
}) {
  return (
    <label
      className={`flex cursor-pointer flex-col gap-0.5 rounded-md border p-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-100 ${
        marcada ? 'border-accent-500 bg-accent-50' : 'border-line bg-white hover:border-brand-100'
      }`}
    >
      <input type="radio" name={nombre} checked={marcada} onChange={alElegir} className="sr-only" />
      {children}
    </label>
  );
}

function Casilla({
  etiqueta,
  ayuda,
  marcada,
  alCambiar,
}: {
  etiqueta: string;
  ayuda?: string;
  marcada: boolean;
  alCambiar: (m: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={marcada}
        onChange={(e) => alCambiar(e.target.checked)}
        className="mt-0.5 size-4 accent-accent-500"
      />
      <span className="flex flex-col gap-0.5">
        <span className="font-display text-sm font-semibold text-brand-900">{etiqueta}</span>
        {ayuda && <span className="text-xs text-ink-muted">{ayuda}</span>}
      </span>
    </label>
  );
}

function Tema({
  etiqueta = 'Fondo',
  ayuda,
  valor,
  alCambiar,
}: {
  etiqueta?: string;
  ayuda?: string;
  valor: string;
  alCambiar: (t: string) => void;
}) {
  return (
    <Grupo etiqueta={etiqueta} ayuda={ayuda}>
      <div className="grid grid-cols-2 gap-2">
        {TEMAS_MARCA.map((t) => (
          <Opcion key={t.value} nombre={`tema-${etiqueta}`} marcada={valor === t.value} alElegir={() => alCambiar(t.value)}>
            <span className="flex items-center gap-2">
              <span
                className="size-5 shrink-0 rounded-full border border-line"
                style={{ background: MUESTRA_TEMA[t.value] }}
              />
              <span className="font-display text-sm font-semibold text-brand-900">{t.label.split(' — ')[0]}</span>
            </span>
          </Opcion>
        ))}
      </div>
    </Grupo>
  );
}

/** El titular admite **dobles asteriscos** para el subrayado naranja; el botón los pone sobre lo seleccionado. */
function Titular({
  etiqueta,
  ayuda,
  valor,
  alCambiar,
}: {
  etiqueta: string;
  ayuda?: string;
  valor: string;
  alCambiar: (v: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const resaltar = () => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    if (a === b) return el.focus();
    const seleccion = valor.slice(a, b);
    const limpio = seleccion.replace(/\*\*/g, '');
    const envuelto = seleccion.startsWith('**') && seleccion.endsWith('**') ? limpio : `**${limpio}**`;
    alCambiar(valor.slice(0, a) + envuelto + valor.slice(b));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a, a + envuelto.length);
    });
  };
  return (
    <Campo
      etiqueta={etiqueta}
      ayuda={`${ayuda ? `${ayuda} ` : ''}Selecciona una o dos palabras y pulsa «Resaltar» para subrayarlas en naranja, como en la home (quedan entre **dobles asteriscos**).`}
    >
      {(id) => (
        <div className="flex flex-col gap-1.5">
          <textarea
            id={id}
            ref={ref}
            rows={3}
            className={ENTRADA}
            value={valor}
            onChange={(e) => alCambiar(e.target.value)}
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={resaltar}
            className="self-start rounded-md border border-line px-2.5 py-1 font-display text-xs font-semibold text-brand-900 hover:border-accent-400 hover:bg-accent-50"
          >
            <span className="border-b-2 border-accent-500">Resaltar</span> selección
          </button>
        </div>
      )}
    </Campo>
  );
}

function Puntos({ puntos, alCambiar }: { puntos: string[]; alCambiar: (p: string[]) => void }) {
  const mover = (i: number, d: number) => {
    const p = [...puntos];
    [p[i], p[i + d]] = [p[i + d], p[i]];
    alCambiar(p);
  };
  return (
    <Grupo etiqueta="Puntos" ayuda="Hasta cinco en los formatos cuadrados y horizontales; siete en las historias.">
      <ol className="flex flex-col gap-2">
        {puntos.map((punto, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <span className="w-5 shrink-0 text-right text-xs text-ink-subtle">{i + 1}</span>
            <input
              aria-label={`Punto ${i + 1}`}
              className={ENTRADA}
              value={punto}
              onChange={(e) => alCambiar(puntos.map((p, j) => (j === i ? e.target.value : p)))}
            />
            <button type="button" aria-label="Subir" disabled={i === 0} onClick={() => mover(i, -1)} className={ICONO}>
              ↑
            </button>
            <button
              type="button"
              aria-label="Bajar"
              disabled={i === puntos.length - 1}
              onClick={() => mover(i, 1)}
              className={ICONO}
            >
              ↓
            </button>
            <button
              type="button"
              aria-label="Quitar"
              onClick={() => alCambiar(puntos.filter((_, j) => j !== i))}
              className={`${ICONO} hover:text-danger`}
            >
              ×
            </button>
          </li>
        ))}
      </ol>
      <button type="button" onClick={() => alCambiar([...puntos, ''])} className={`${BOTON_SECUNDARIO} self-start`}>
        + Añadir punto
      </button>
    </Grupo>
  );
}

const ICONO =
  'flex size-8 shrink-0 items-center justify-center rounded-md border border-line text-ink-muted hover:bg-surface-muted disabled:opacity-30';

// ---------------------------------------------------------------------------
// Vista previa

type Url = (id: string, ext: string, descargar?: boolean) => string;

/**
 * Una imagen generada. Mientras llega la nueva se sigue viendo la anterior,
 * un poco apagada, para que la vista no parpadee a cada tecla.
 */
function Imagen({ src, alt, className, style, alFallar }: {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  alFallar: () => void;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [cargada, setCargada] = useState<string | null>(null);
  const [fallida, setFallida] = useState<string | null>(null);
  const fallo = fallida === src;
  const cargando = cargada !== src && !fallo;

  // La imagen del HTML del servidor puede terminar de cargar antes de que
  // React se enganche, y entonces `onLoad` no llega nunca.
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth > 0) setCargada(src);
  }, [src]);

  return (
    <div className="relative flex max-h-full max-w-full items-center justify-center">
      <img
        ref={ref}
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setCargada(src)}
        onError={() => {
          setFallida(src);
          alFallar();
        }}
        className={`${className ?? ''} transition-opacity ${cargando && cargada ? 'opacity-60' : ''}`}
        style={style}
      />
      {cargando && (
        <span className="absolute top-2 right-2 size-4 animate-spin rounded-full border-2 border-brand-100 border-t-accent-500" />
      )}
      {fallo && (
        <span className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs text-danger">
          No se ha podido generar. Revisa que la sesión del panel siga abierta.
        </span>
      )}
    </div>
  );
}

function Descargas({ id, url, exts = EXTENSIONES, principal = 'png' }: {
  id: string;
  url: Url;
  exts?: readonly string[];
  principal?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {exts.map((ext) => (
        <a
          key={ext}
          href={url(id, ext, true)}
          download
          className={
            ext === principal
              ? 'rounded-md bg-accent-500 px-3 py-1.5 font-display text-sm font-semibold text-white hover:bg-accent-600'
              : BOTON_SECUNDARIO
          }
        >
          {ETIQUETA_EXT[ext]}
        </a>
      ))}
    </div>
  );
}

function VistaPiezas({ url, alFallar }: { url: Url; alFallar: () => void }) {
  const [red, setRed] = useState<Red | 'todas'>('todas');
  const grupos = REDES.filter((r) => red === 'todas' || r.id === red).map((r) => ({
    ...r,
    formatos: FORMATOS.filter((f) => f.red === r.id),
  }));

  return (
    <>
      <div className="flex flex-col gap-4">
        <p className="max-w-[70ch] text-ink-muted">
          La vista previa se actualiza sola mientras escribes. Lo que descargas es lo que ves, aunque no lo hayas guardado.
        </p>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Redes">
          {[{ id: 'todas' as const, nombre: 'Todas' }, ...REDES].map((r) => (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={red === r.id}
              onClick={() => setRed(r.id)}
              className={`rounded-full px-4 py-1.5 font-display text-sm font-semibold ${
                red === r.id ? 'bg-brand-900 text-white' : 'bg-white text-brand-900 ring-1 ring-line hover:bg-brand-50'
              }`}
            >
              {r.nombre}
            </button>
          ))}
        </div>
      </div>

      {grupos.map((grupo) => (
        <section key={grupo.id} className="flex flex-col gap-5">
          <h2 className="text-h3">{grupo.nombre}</h2>
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-3">
            {grupo.formatos.map((f) => (
              <TarjetaFormato key={f.id} f={f} grupo={grupo.nombre} url={url} alFallar={alFallar} />
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

function TarjetaFormato({ f, grupo, url, alFallar }: { f: Formato; grupo: string; url: Url; alFallar: () => void }) {
  return (
    <li className="flex flex-col overflow-hidden rounded-lg border border-line bg-white">
      <a
        href={url(f.id, 'png')}
        target="_blank"
        rel="noreferrer"
        title="Abrir en grande"
        className="flex h-64 items-center justify-center bg-surface-muted p-4"
      >
        <Imagen
          src={url(f.id, 'svg')}
          alt={`${grupo} · ${f.nombre}`}
          className={`max-h-56 max-w-full shadow-sm ${f.tipo === 'perfil' ? 'rounded-full' : ''}`}
          style={{ aspectRatio: `${f.ancho}/${f.alto}` }}
          alFallar={alFallar}
        />
      </a>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col gap-0.5">
          <h3 className="font-display text-base font-semibold text-brand-900">{f.nombre}</h3>
          <p className="text-sm text-ink-muted">
            {f.ancho} × {f.alto} px
            {f.nota && <span className="block text-ink-subtle">{f.nota}</span>}
          </p>
        </div>
        <div className="mt-auto">
          <Descargas id={f.id} url={url} />
        </div>
      </div>
    </li>
  );
}

function VistaTarjeta({ url, alFallar }: { url: Url; alFallar: () => void }) {
  return (
    <>
      <div className="flex flex-col gap-4">
        <p className="max-w-[70ch] text-ink-muted">
          Tamaño estándar de {TARJETA.corteMm.ancho} × {TARJETA.corteMm.alto} mm con {TARJETA.sangradoMm} mm de sangrado
          por cada lado. Para la imprenta, descarga el PDF: lleva las dos caras en vectorial y marcada la caja de corte.
        </p>
        <div>
          <a
            href={url('tarjeta', 'pdf', true)}
            download
            className="inline-flex items-center gap-2 rounded-md bg-accent-500 px-5 py-3 font-display font-semibold text-white hover:bg-accent-600"
          >
            Descargar PDF para imprenta (dos caras)
          </a>
        </div>
      </div>
      <ul className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {CARAS.map((cara) => (
          <li key={cara.id} className="flex flex-col overflow-hidden rounded-lg border border-line bg-white">
            <div className="flex items-center justify-center bg-surface-muted p-6 sm:p-10">
              <Imagen
                src={url(cara.id, 'svg')}
                alt={cara.nombre}
                className="w-full rounded-sm shadow-md"
                style={{ aspectRatio: '91/61' }}
                alFallar={alFallar}
              />
            </div>
            <div className="flex flex-col gap-3 p-4">
              <h2 className="font-display text-base font-semibold text-brand-900">{cara.nombre}</h2>
              <Descargas id={cara.id} url={url} principal="" />
            </div>
          </li>
        ))}
      </ul>
      <p className="text-sm text-ink-muted">
        La vista previa incluye el sangrado: lo que queda fuera de los {TARJETA.sangradoMm} mm del borde se corta. PNG y
        JPG salen a 300 ppp.
      </p>
    </>
  );
}

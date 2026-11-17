"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  Loader2,
  MapPin,
  Save,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { CatalogoItem, Categoria, ClienteOpcion, Cotizacion, Plantilla } from "@/lib/types";
import { addDaysISO, money, todayISO } from "@/lib/format";
import { computeTotals, itemFromApplied, itemFromCotizacion, type ItemDraft } from "@/lib/items";
import { tiposEvento } from "@/lib/constants";
import { ConfirmDialog, ErrorBlock, Field, LoadingBlock, PageHeader } from "@/components/ui";
import { ItemsEditor } from "@/components/items-editor";
import { useToast } from "@/components/toast";

interface QuoteFormState {
  clienteId: string;
  codigo: string;
  fechaEmision: string;
  validoHasta: string;
  fechaEvento: string;
  localEvento: string;
  cantidadInvitados: string;
  tipoEvento: string;
  tematica: string;
  paletaColores: string;
  incluyeIgv: boolean;
  notasCortesia: string;
  notasInternas: string;
  estado: "BORRADOR" | "ENVIADA" | "APROBADA" | "RECHAZADA";
}

function initialState(cotizacion?: Cotizacion): QuoteFormState {
  const today = todayISO();
  if (!cotizacion) {
    return {
      clienteId: "",
      codigo: "",
      fechaEmision: today,
      validoHasta: addDaysISO(today, 10),
      fechaEvento: "",
      localEvento: "",
      cantidadInvitados: "100",
      tipoEvento: "",
      tematica: "",
      paletaColores: "",
      incluyeIgv: false,
      notasCortesia: "",
      notasInternas: "",
      estado: "BORRADOR",
    };
  }
  return {
    clienteId: String(cotizacion.clienteId),
    codigo: cotizacion.codigo,
    fechaEmision: cotizacion.fechaEmision?.slice(0, 10) ?? today,
    validoHasta: cotizacion.validoHasta?.slice(0, 10) ?? addDaysISO(today, 10),
    fechaEvento: cotizacion.fechaEvento?.slice(0, 10) ?? "",
    localEvento: cotizacion.localEvento ?? "",
    cantidadInvitados: String(cotizacion.cantidadInvitados ?? 0),
    tipoEvento: cotizacion.tipoEvento ?? "",
    tematica: cotizacion.tematica ?? "",
    paletaColores: cotizacion.paletaColores ?? "",
    incluyeIgv: Boolean(cotizacion.incluyeIgv),
    notasCortesia: cotizacion.notasCortesia ?? "",
    notasInternas: cotizacion.notasInternas ?? "",
    estado: cotizacion.estado,
  };
}

export function CotizacionForm({ cotizacion }: { cotizacion?: Cotizacion }) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(cotizacion);
  const [form, setForm] = useState<QuoteFormState>(() => initialState(cotizacion));
  const [items, setItems] = useState<ItemDraft[]>(() =>
    cotizacion ? cotizacion.detalles.map(itemFromCotizacion) : [],
  );
  const [clientes, setClientes] = useState<ClienteOpcion[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [catalogo, setCatalogo] = useState<CatalogoItem[]>([]);
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [igvPct, setIgvPct] = useState(18);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [pendingApply, setPendingApply] = useState<{ plantilla: Plantilla; guests: number } | null>(null);
  const appliedFromStorage = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [clienteOptions, categoryData, catalogData, templateData, empresa] = await Promise.all([
        api.clientes.opciones(),
        api.categorias.listar(),
        api.catalogo.listar(),
        api.plantillas.listar(),
        api.empresa.obtener(),
      ]);
      setClientes(clienteOptions);
      setCategorias(categoryData);
      setCatalogo(catalogData);
      setPlantillas(templateData);
      setIgvPct(Number(empresa.igvPorcentaje) || 18);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "No se pudieron cargar los datos del cotizador.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const invited = Number(form.cantidadInvitados) || 0;
  const totals = useMemo(
    () => computeTotals(items, form.incluyeIgv, igvPct, invited),
    [items, form.incluyeIgv, igvPct, invited],
  );

  const applyTemplate = useCallback(
    async (plantilla: Plantilla, guests: number) => {
      setApplyingId(plantilla.id);
      try {
        const applied = await api.plantillas.aplicar(plantilla.id, guests);
        setItems(applied.detalles.map(itemFromApplied));
        setForm((current) => ({
          ...current,
          incluyeIgv: Boolean(applied.incluyeIgv),
          tipoEvento: current.tipoEvento || plantilla.tipoEvento,
          cantidadInvitados: guests > 0 ? String(guests) : current.cantidadInvitados,
        }));
        toast.success(`Plantilla “${plantilla.nombre}” aplicada a la propuesta.`);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "No se pudo aplicar la plantilla.");
      } finally {
        setApplyingId(null);
      }
    },
    [toast],
  );

  useEffect(() => {
    if (isEdit || loading || appliedFromStorage.current) return;
    appliedFromStorage.current = true;
    try {
      const raw = window.sessionStorage.getItem("mm:plantilla");
      window.sessionStorage.removeItem("mm:plantilla");
      if (!raw) return;
      const stored = JSON.parse(raw) as { id?: number; invitados?: number };
      const plantilla = plantillas.find((item) => item.id === stored.id);
      if (!plantilla) return;
      const guests = stored.invitados && stored.invitados > 0 ? stored.invitados : 100;
      setForm((current) => ({ ...current, cantidadInvitados: String(guests) }));
      void applyTemplate(plantilla, guests);
    } catch {
      // almacenamiento no disponible: continuar sin plantilla
    }
  }, [applyTemplate, isEdit, loading, plantillas]);

  function update<K extends keyof QuoteFormState>(key: K, value: QuoteFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function requestApply(plantilla: Plantilla, guests: number) {
    if (items.length > 0) {
      setPendingApply({ plantilla, guests });
      return;
    }
    void applyTemplate(plantilla, guests);
  }

  async function save() {
    setFormError("");
    if (!form.clienteId) {
      setFormError("Selecciona un cliente para la cotización.");
      return;
    }
    if (items.length === 0) {
      setFormError("Agrega al menos un ítem a la cotización.");
      return;
    }
    const incomplete = items.find(
      (item) =>
        !item.descripcion.trim() ||
        !item.categoriaNombre.trim() ||
        (!item.esSubitemInformativo && Number(item.unidades) <= 0),
    );
    if (incomplete) {
      setFormError("Completa la categoría, descripción y unidades de todos los ítems.");
      return;
    }
    if (!items.some((item) => !item.esSubitemInformativo)) {
      setFormError("La cotización necesita al menos un ítem con precio.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        clienteId: Number(form.clienteId),
        codigo: form.codigo.trim() || null,
        fechaEmision: form.fechaEmision || null,
        validoHasta: form.validoHasta || null,
        fechaEvento: form.fechaEvento || null,
        localEvento: form.localEvento.trim() || null,
        cantidadInvitados: Number(form.cantidadInvitados) || 0,
        tipoEvento: form.tipoEvento.trim() || null,
        tematica: form.tematica.trim() || null,
        paletaColores: form.paletaColores.trim() || null,
        incluyeIgv: form.incluyeIgv,
        notasCortesia: form.notasCortesia.trim() || null,
        notasInternas: form.notasInternas.trim() || null,
        estado: form.estado,
        detalles: items.map((item, index) => ({
          categoriaNombre: item.categoriaNombre.trim(),
          descripcion: item.descripcion.trim(),
          unidades: Number(item.unidades) || 0,
          precioUnitarioVenta: item.esSubitemInformativo ? 0 : Number(item.precioUnitarioVenta) || 0,
          costoUnitarioInterno: item.esSubitemInformativo ? 0 : Number(item.costoUnitarioInterno) || 0,
          esSubitemInformativo: item.esSubitemInformativo,
          orden: index,
        })),
      };

      const saved = cotizacion
        ? await api.cotizaciones.actualizar(cotizacion.id, payload)
        : await api.cotizaciones.crear(payload);

      toast.success(
        cotizacion
          ? `Cotización ${saved.codigo} actualizada correctamente.`
          : `Cotización ${saved.codigo} creada correctamente.`,
      );
      router.push(`/cotizaciones/${saved.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        const fieldMessage = err.fields ? Object.values(err.fields)[0] : undefined;
        setFormError(fieldMessage ?? err.message);
        toast.error(fieldMessage ?? err.message);
      } else {
        setFormError("Ocurrió un error inesperado al guardar.");
        toast.error("Ocurrió un error inesperado al guardar.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="card">
        <LoadingBlock rows={8} />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="card">
        <ErrorBlock message={loadError} onRetry={load} />
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <PageHeader
        eyebrow={isEdit ? `Editar ${cotizacion?.codigo}` : "Nueva propuesta"}
        title={isEdit ? "Editar cotización" : "Nueva cotización"}
        description="Define el evento, aplica una plantilla y ajusta cada servicio. Los totales se recalculan en tiempo real."
        actions={
          <>
            <Link href={cotizacion ? `/cotizaciones/${cotizacion.id}` : "/cotizaciones"} className="btn btn-outline">
              <ArrowLeft className="h-4 w-4" />
              Cancelar
            </Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear cotización"}
            </button>
          </>
        }
      />

      {formError && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-200 text-[10px] font-bold text-rose-800">
            !
          </span>
          {formError}
        </div>
      )}

      <div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="card card-pad">
            <div className="mb-5 flex items-center justify-between gap-2">
              <div>
                <h2 className="font-serif text-xl text-ink">Cliente y evento</h2>
                <p className="mt-1 text-xs text-slate-500">Datos principales que verá el cliente en la propuesta.</p>
              </div>
              <CalendarDays className="h-5 w-5 text-brand-500" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Cliente" required className="sm:col-span-2">
                <div className="relative">
                  <select
                    value={form.clienteId}
                    onChange={(event) => update("clienteId", event.target.value)}
                    className="select"
                    required
                  >
                    <option value="">Selecciona un cliente...</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre} · {cliente.tipoCliente === "CORPORATIVO" ? "Corporativo" : "Social"}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>¿Cliente nuevo?</span>
                  <Link href="/clientes" className="font-semibold text-brand-700 hover:underline">
                    Regístralo en Clientes →
                  </Link>
                </div>
              </Field>

              <Field label="Tipo de evento">
                <input
                  list="mm-tipos-evento"
                  value={form.tipoEvento}
                  onChange={(event) => update("tipoEvento", event.target.value)}
                  className="input"
                  placeholder="Boda, corporativo, quinceañero..."
                />
                <datalist id="mm-tipos-evento">
                  {tiposEvento.map((tipo) => (
                    <option key={tipo} value={tipo} />
                  ))}
                </datalist>
              </Field>

              <Field label="Fecha del evento">
                <input
                  type="date"
                  value={form.fechaEvento}
                  onChange={(event) => update("fechaEvento", event.target.value)}
                  className="input"
                />
              </Field>

              <Field label="Local / lugar">
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={form.localEvento}
                    onChange={(event) => update("localEvento", event.target.value)}
                    className="input pl-9"
                    placeholder="Club Grau, Fundo Stiwar..."
                  />
                </div>
              </Field>

              <Field label="Cantidad de invitados">
                <div className="relative">
                  <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min={0}
                    value={form.cantidadInvitados}
                    onChange={(event) => update("cantidadInvitados", event.target.value)}
                    className="input pl-9"
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-400">
                  Se usa para ajustar plantillas y calcular el ticket por persona.
                </p>
              </Field>

              <Field label="Temática">
                <input
                  value={form.tematica}
                  onChange={(event) => update("tematica", event.target.value)}
                  className="input"
                  placeholder="Jardín encantado, blanco y dorado..."
                />
              </Field>

              <Field label="Paleta de colores">
                <input
                  value={form.paletaColores}
                  onChange={(event) => update("paletaColores", event.target.value)}
                  className="input"
                  placeholder="Marfil, dorado y verde eucalipto"
                />
              </Field>
            </div>
          </section>

          <section className="card card-pad">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-serif text-xl text-ink">Servicios y mobiliario</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Arma la propuesta con una plantilla o directamente desde el catálogo.
                </p>
              </div>
              <span className="badge bg-brand-50 text-brand-800 ring-brand-200">
                <Wand2 className="h-3.5 w-3.5" />
                {items.length} ítem(s)
              </span>
            </div>

            {plantillas.length > 0 && (
              <div className="mb-5 rounded-xl border border-brand-100 bg-brand-50/40 p-3 sm:p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-800">
                    Plantillas rápidas
                  </p>
                  <p className="text-[10px] text-brand-700/70">
                    Se ajustan a {invited || 0} invitados
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {plantillas.map((plantilla) => (
                    <button
                      key={plantilla.id}
                      type="button"
                      onClick={() => requestApply(plantilla, invited)}
                      disabled={applyingId === plantilla.id}
                      className="group flex items-start gap-2.5 rounded-lg border border-brand-200/60 bg-white px-3 py-2.5 text-left transition hover:border-brand-400 hover:shadow-sm disabled:opacity-60"
                    >
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700 transition group-hover:bg-brand-500 group-hover:text-white">
                        {applyingId === plantilla.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-slate-800">
                          {plantilla.nombre}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-slate-500">
                          {plantilla.tipoEvento} · {plantilla.detalles.length} líneas
                          {plantilla.incluyeIgv ? " · con IGV" : ""}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <ItemsEditor
              items={items}
              onChange={setItems}
              categorias={categorias}
              catalogo={catalogo}
              invitados={invited}
            />
          </section>

          <section className="card card-pad">
            <h2 className="mb-4 font-serif text-xl text-ink">Notas de la propuesta</h2>
            <div className="grid gap-4">
              <Field
                label="Notas para el cliente"
                hint="Cortesías, condiciones especiales o mensajes que aparecerán en el PDF."
              >
                <textarea
                  value={form.notasCortesia}
                  onChange={(event) => update("notasCortesia", event.target.value)}
                  className="textarea"
                  placeholder="Backing fotográfico con logo de marca, podio con arreglo floral..."
                />
              </Field>
              <Field
                label="Notas internas"
                hint="Solo visibles para el equipo. No se incluyen en la propuesta del cliente."
              >
                <textarea
                  value={form.notasInternas}
                  onChange={(event) => update("notasInternas", event.target.value)}
                  className="textarea border-amber-200 bg-amber-50/30 focus:border-amber-500 focus:ring-amber-500/10"
                  placeholder="Pendiente confirmar disponibilidad de toldo, coordinación con el local..."
                />
              </Field>
            </div>
          </section>
        </div>

        <div className="space-y-5 xl:sticky xl:top-24">
          <section className="card overflow-hidden">
            <div className="bg-ink px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-300">
                Resumen de la propuesta
              </p>
              <p className="mt-1 font-serif text-lg text-white">
                {form.tipoEvento || "Evento"} · {invited || 0} invitados
              </p>
            </div>
            <div className="space-y-3 p-5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Subtotal servicios</span>
                <span className="font-medium text-slate-700">{money(totals.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>IGV ({igvPct}%)</span>
                <span className="font-medium text-slate-700">{money(totals.igv)}</span>
              </div>
              <div className="divider-gold" />
              <div className="flex items-end justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total</span>
                <span className="font-serif text-2xl text-ink">{money(totals.total)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-[11px]">
                <span className="text-slate-500">Ticket por invitado</span>
                <span className="font-semibold text-slate-700">{money(totals.ticket)}</span>
              </div>

              <div className="rounded-xl border border-amber-200/70 bg-amber-50/50 p-3">
                <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-800">
                  Análisis interno
                </p>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-amber-900/70">
                    <span>Costo neto</span>
                    <span className="font-medium">{money(totals.costo)}</span>
                  </div>
                  <div className="flex justify-between text-amber-900/70">
                    <span>Ganancia estimada</span>
                    <span className="font-semibold text-emerald-700">{money(totals.ganancia)}</span>
                  </div>
                  <div className="flex justify-between text-amber-900/70">
                    <span>Margen</span>
                    <span className="font-semibold text-emerald-700">{totals.margen.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear cotización"}
              </button>
              <p className="text-center text-[10px] text-slate-400">
                {isEdit ? "Los cambios mantienen el código y la versión." : "El código se generará automáticamente."}
              </p>
            </div>
          </section>

          <section className="card card-pad">
            <h2 className="mb-4 font-serif text-lg text-ink">Condiciones</h2>
            <div className="space-y-4">
              <Field label="Código" hint={isEdit ? "El código no cambia al editar." : "Déjalo vacío para generarlo automáticamente."}>
                <input
                  value={form.codigo}
                  onChange={(event) => update("codigo", event.target.value)}
                  className="input font-mono text-xs uppercase"
                  placeholder="Automático"
                  disabled={isEdit}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Emisión">
                  <input
                    type="date"
                    value={form.fechaEmision}
                    onChange={(event) => update("fechaEmision", event.target.value)}
                    className="input"
                  />
                </Field>
                <Field label="Válida hasta">
                  <input
                    type="date"
                    value={form.validoHasta}
                    onChange={(event) => update("validoHasta", event.target.value)}
                    className="input"
                  />
                </Field>
              </div>
              <Field label="Estado">
                <select
                  value={form.estado}
                  onChange={(event) => update("estado", event.target.value as QuoteFormState["estado"])}
                  className="select"
                >
                  <option value="BORRADOR">Borrador</option>
                  <option value="ENVIADA">Enviada</option>
                  <option value="APROBADA">Aprobada</option>
                  <option value="RECHAZADA">Rechazada</option>
                </select>
              </Field>

              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3">
                <span>
                  <span className="block text-xs font-semibold text-slate-700">Incluir IGV</span>
                  <span className="text-[10px] text-slate-400">Aplica {igvPct}% sobre el subtotal</span>
                </span>
                <span className="relative inline-flex">
                  <input
                    type="checkbox"
                    checked={form.incluyeIgv}
                    onChange={(event) => update("incluyeIgv", event.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-brand-500" />
                  <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
                </span>
              </label>
            </div>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pendingApply)}
        onClose={() => setPendingApply(null)}
        onConfirm={() => {
          if (pendingApply) {
            void applyTemplate(pendingApply.plantilla, pendingApply.guests);
            setPendingApply(null);
          }
        }}
        title="Reemplazar los ítems actuales"
        description={`Al aplicar “${pendingApply?.plantilla.nombre ?? ""}” se reemplazarán las ${items.length} línea(s) que ya tienes en la propuesta. Esta acción no se puede deshacer.`}
        confirmLabel="Aplicar plantilla"
        tone="primary"
      />
    </form>
  );
}

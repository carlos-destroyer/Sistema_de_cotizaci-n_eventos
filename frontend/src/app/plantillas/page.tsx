"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  CakeSlice,
  Heart,
  LayoutTemplate,
  Pencil,
  Plus,
  Power,
  Search,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Plantilla } from "@/lib/types";
import { money } from "@/lib/format";
import {
  ConfirmDialog,
  EmptyState,
  ErrorBlock,
  Field,
  LoadingBlock,
  Modal,
  PageHeader,
} from "@/components/ui";
import { useToast } from "@/components/toast";

function iconFor(tipo: string) {
  const normalized = tipo.toLowerCase();
  if (normalized.includes("boda")) return Heart;
  if (normalized.includes("corporativ")) return Building2;
  if (normalized.includes("infantil")) return CakeSlice;
  return Sparkles;
}

function baseTotals(plantilla: Plantilla) {
  let subtotal = 0;
  let costo = 0;
  for (const detalle of plantilla.detalles) {
    if (detalle.esSubitem) continue;
    subtotal += detalle.cantidadBase * detalle.precioVenta;
    costo += detalle.cantidadBase * detalle.costoInterno;
  }
  return {
    subtotal,
    costo,
    ganancia: subtotal - costo,
    margen: subtotal > 0 ? ((subtotal - costo) / subtotal) * 100 : 0,
  };
}

export default function PlantillasPage() {
  const router = useRouter();
  const toast = useToast();
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [preview, setPreview] = useState<Plantilla | null>(null);
  const [applyTarget, setApplyTarget] = useState<Plantilla | null>(null);
  const [guests, setGuests] = useState("100");
  const [deleteTarget, setDeleteTarget] = useState<Plantilla | null>(null);
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setPlantillas(await api.plantillas.listar(includeInactive));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar las plantillas.");
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return plantillas;
    return plantillas.filter(
      (plantilla) =>
        plantilla.nombre.toLowerCase().includes(term) ||
        plantilla.tipoEvento.toLowerCase().includes(term) ||
        (plantilla.descripcion ?? "").toLowerCase().includes(term),
    );
  }, [plantillas, q]);

  const totalLines = plantillas.reduce((sum, plantilla) => sum + plantilla.detalles.length, 0);
  const activeCount = plantillas.filter((plantilla) => plantilla.activo).length;

  function openApply(plantilla: Plantilla) {
    setApplyTarget(plantilla);
    setGuests("100");
    setPreview(null);
  }

  function useTemplate() {
    if (!applyTarget) return;
    try {
      window.sessionStorage.setItem(
        "mm:plantilla",
        JSON.stringify({ id: applyTarget.id, invitados: Number(guests) || 0 }),
      );
      router.push("/cotizaciones/nueva");
    } catch {
      toast.error("No se pudo preparar la plantilla en este navegador.");
    }
  }

  async function toggleActive(plantilla: Plantilla) {
    setProcessing(true);
    try {
      await api.plantillas.actualizar(plantilla.id, {
        nombre: plantilla.nombre,
        tipoEvento: plantilla.tipoEvento,
        descripcion: plantilla.descripcion ?? null,
        incluyeIgv: plantilla.incluyeIgv,
        activo: !plantilla.activo,
        detalles: plantilla.detalles.map((detalle) => ({
          catalogoItemId: detalle.catalogoItemId ?? null,
          categoriaNombre: detalle.categoriaNombre,
          descripcion: detalle.descripcion,
          cantidadBase: detalle.cantidadBase,
          precioVenta: detalle.precioVenta,
          costoInterno: detalle.costoInterno,
          esSubitem: detalle.esSubitem,
          orden: detalle.orden,
        })),
      });
      toast.success(plantilla.activo ? "Plantilla desactivada." : "Plantilla reactivada.");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar la plantilla.");
    } finally {
      setProcessing(false);
    }
  }

  async function remove() {
    if (!deleteTarget) return;
    setProcessing(true);
    try {
      await api.plantillas.eliminar(deleteTarget.id);
      toast.success(`Plantilla “${deleteTarget.nombre}” eliminada.`);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar la plantilla.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Biblioteca de eventos"
        title="Plantillas"
        description="Propuestas base listas para adaptar a cada cliente. Al aplicarlas, las cantidades se ajustan automáticamente."
        actions={
          <Link href="/plantillas/nueva" className="btn btn-primary">
            <Plus className="h-4 w-4" />
            Nueva plantilla
          </Link>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="card flex items-center gap-3 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <LayoutTemplate className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Plantillas activas</p>
            <p className="text-sm font-semibold text-ink">
              {activeCount} de {plantillas.length}
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Líneas configurables</p>
            <p className="text-sm font-semibold text-ink">{totalLines}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Ajuste automático</p>
            <p className="text-sm font-semibold text-ink">Por invitado / mesa</p>
          </div>
        </div>
      </div>

      <div className="card mb-5 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            className="input pl-10 pr-9"
            placeholder="Buscar plantilla por nombre o tipo..."
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-[11px] font-medium text-slate-500">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(event) => setIncludeInactive(event.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-300 accent-brand-600"
          />
          Incluir plantillas inactivas
        </label>
      </div>

      {loading ? (
        <div className="card">
          <LoadingBlock rows={7} />
        </div>
      ) : error ? (
        <div className="card">
          <ErrorBlock message={error} onRetry={load} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<LayoutTemplate className="h-6 w-6" />}
            title={q ? "Sin resultados" : "Aún no hay plantillas"}
            description={
              q
                ? "Prueba con otro nombre o tipo de evento."
                : "Crea una plantilla con los servicios que sueles incluir en cada tipo de evento."
            }
            action={
              <Link href="/plantillas/nueva" className="btn btn-primary">
                <Plus className="h-4 w-4" />
                Nueva plantilla
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((plantilla) => {
            const Icon = iconFor(plantilla.tipoEvento);
            const totals = baseTotals(plantilla);
            return (
              <article
                key={plantilla.id}
                className={`card flex flex-col overflow-hidden transition hover:shadow-[0_12px_34px_-22px_rgba(15,26,43,0.35)] ${
                  plantilla.activo ? "" : "opacity-70"
                }`}
              >
                <div className="border-b border-slate-100 p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        {plantilla.tipoEvento}
                      </span>
                      <span
                        className={`badge ${
                          plantilla.activo
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : "bg-slate-100 text-slate-500 ring-slate-200"
                        }`}
                      >
                        {plantilla.activo ? "Activa" : "Inactiva"}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-serif text-xl leading-tight text-ink">{plantilla.nombre}</h3>
                  <p className="mt-1.5 line-clamp-2 min-h-[32px] text-xs leading-relaxed text-slate-500">
                    {plantilla.descripcion || "Sin descripción. Edita la plantilla para agregar una."}
                  </p>
                </div>

                <div className="flex-1 p-5">
                  <div className="mb-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-slate-50 px-2 py-2">
                      <p className="font-serif text-base text-ink">{plantilla.detalles.length}</p>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400">Líneas</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2 py-2">
                      <p className="font-serif text-base text-ink">{plantilla.incluyeIgv ? "Sí" : "No"}</p>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400">IGV</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2 py-2">
                      <p className="font-serif text-base text-ink">{totals.margen.toFixed(0)}%</p>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400">Margen</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {plantilla.detalles.slice(0, 3).map((detalle) => (
                      <div key={detalle.id} className="flex items-center gap-2 text-[11px]">
                        <span className="h-1 w-1 shrink-0 rounded-full bg-brand-300" />
                        <span className="truncate text-slate-500">{detalle.descripcion}</span>
                      </div>
                    ))}
                    {plantilla.detalles.length > 3 && (
                      <p className="pl-3 text-[10px] text-slate-400">
                        + {plantilla.detalles.length - 3} línea(s) más
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400">Base estimada</p>
                      <p className="font-serif text-lg text-ink">{money(totals.subtotal)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreview(plantilla)}
                      className="text-[11px] font-semibold text-brand-700 hover:text-brand-800"
                    >
                      Ver detalle →
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 border-t border-slate-100 bg-slate-50/50 px-4 py-3">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm flex-1"
                    onClick={() => openApply(plantilla)}
                    disabled={!plantilla.activo}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Usar plantilla
                  </button>
                  <Link
                    href={`/plantillas/${plantilla.id}/editar`}
                    className="btn-icon h-8 w-8 border border-slate-200 bg-white"
                    title="Editar plantilla"
                    aria-label={`Editar ${plantilla.nombre}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    type="button"
                    className={`btn-icon h-8 w-8 border border-slate-200 bg-white ${
                      plantilla.activo ? "hover:bg-rose-50 hover:text-rose-600" : "text-emerald-600 hover:bg-emerald-50"
                    }`}
                    onClick={() => toggleActive(plantilla)}
                    disabled={processing}
                    title={plantilla.activo ? "Desactivar plantilla" : "Reactivar plantilla"}
                    aria-label={plantilla.activo ? "Desactivar plantilla" : "Reactivar plantilla"}
                  >
                    <Power className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="btn-icon h-8 w-8 border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600"
                    onClick={() => setDeleteTarget(plantilla)}
                    title="Eliminar plantilla"
                    aria-label={`Eliminar ${plantilla.nombre}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(applyTarget)}
        onClose={() => setApplyTarget(null)}
        title="Usar plantilla"
        description={applyTarget ? `“${applyTarget.nombre}” se aplicará en una nueva cotización.` : undefined}
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setApplyTarget(null)}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" onClick={useTemplate}>
              <Sparkles className="h-4 w-4" />
              Ir al cotizador
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field
            label="Cantidad de invitados"
            hint="Las líneas con regla por invitado, mesa o mozo se ajustarán a este número."
          >
            <input
              type="number"
              min={0}
              value={guests}
              onChange={(event) => setGuests(event.target.value)}
              className="input"
            />
          </Field>
          <div className="flex flex-wrap gap-1.5">
            {[50, 100, 150, 200].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setGuests(String(value))}
                className={`chip ${Number(guests) === value ? "chip-active" : ""}`}
              >
                {value} invitados
              </button>
            ))}
          </div>
          {applyTarget && (
            <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-3 text-[11px] leading-relaxed text-brand-800">
              <p className="font-semibold">{applyTarget.detalles.length} línea(s) en la plantilla</p>
              <p className="mt-0.5 text-brand-700/80">
                Podrás editar cliente, fechas, precios y cantidades antes de guardar la cotización.
              </p>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title={preview?.nombre ?? "Plantilla"}
        description={preview ? `${preview.tipoEvento} · ${preview.detalles.length} línea(s) base` : undefined}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setPreview(null)}>
              Cerrar
            </button>
            {preview && (
              <button type="button" className="btn btn-primary" onClick={() => openApply(preview)}>
                <Sparkles className="h-4 w-4" />
                Usar esta plantilla
              </button>
            )}
          </>
        }
      >
        {preview && (
          <PreviewContent plantilla={preview} />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        title="Eliminar plantilla"
        description={`Se eliminará permanentemente la plantilla “${deleteTarget?.nombre ?? ""}”. Las cotizaciones creadas a partir de ella no se modifican.`}
        confirmLabel="Eliminar"
        loading={processing}
      />
    </div>
  );
}

function PreviewContent({ plantilla }: { plantilla: Plantilla }) {
  let subtotal = 0;
  for (const detalle of plantilla.detalles) {
    if (!detalle.esSubitem) subtotal += detalle.cantidadBase * detalle.precioVenta;
  }
  const detallesConCategoria = plantilla.detalles.map((detalle, index, detalles) => ({
    ...detalle,
    showCategory: index === 0 || detalle.categoriaNombre !== detalles[index - 1]?.categoriaNombre,
  }));

  return (
    <div>
      {plantilla.descripcion && (
        <p className="mb-4 rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-500">
          {plantilla.descripcion}
        </p>
      )}
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              <th className="th">Descripción</th>
              <th className="th text-center">Cant. base</th>
              <th className="th text-right">P. unit.</th>
              <th className="th text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {detallesConCategoria.map((detalle) => {
              return (
                <Fragment key={detalle.id}>
                  {detalle.showCategory && (
                    <tr className="bg-brand-50/60">
                      <td
                        colSpan={4}
                        className="border-b border-brand-100 px-4 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-brand-800"
                      >
                        {detalle.categoriaNombre}
                      </td>
                    </tr>
                  )}
                  <tr className={detalle.esSubitem ? "bg-slate-50/40" : ""}>
                    <td className="td text-[12px]">
                      <span className={detalle.esSubitem ? "pl-4 italic text-slate-500" : ""}>
                        {detalle.descripcion}
                      </span>
                    </td>
                    <td className="td text-center text-xs text-slate-500">
                      {detalle.esSubitem ? "—" : detalle.cantidadBase}
                    </td>
                    <td className="td text-right text-xs text-slate-500">
                      {detalle.esSubitem ? "—" : money(detalle.precioVenta)}
                    </td>
                    <td className="td text-right text-xs font-semibold text-slate-700">
                      {detalle.esSubitem ? "Incluido" : money(detalle.cantidadBase * detalle.precioVenta)}
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
        <span className="text-xs font-medium text-slate-500">Subtotal base (sin IGV)</span>
        <span className="font-serif text-xl text-ink">{money(subtotal)}</span>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  History,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Cotizacion, EstadoCotizacion } from "@/lib/types";
import {
  daysUntil,
  estadoLabels,
  formatDate,
  formatDateTime,
  money,
  tipoClienteLabels,
} from "@/lib/format";
import { estadoStyles, estados } from "@/lib/constants";
import {
  ConfirmDialog,
  EmptyState,
  EstadoBadge,
  LoadingBlock,
  PageHeader,
  TipoClienteBadge,
} from "@/components/ui";
import { useToast } from "@/components/toast";

export default function CotizacionDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<Cotizacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [changing, setChanging] = useState<EstadoCotizacion | null>(null);
  const [duplicating, setDuplicating] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showCosts, setShowCosts] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await api.cotizaciones.obtener(params.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar la cotización.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(() => {
    if (!data) return [];
    const order = [...data.detalles].sort((a, b) => a.orden - b.orden);
    const groups: Array<{ categoria: string; items: typeof order }> = [];
    for (const item of order) {
      const last = groups[groups.length - 1];
      if (last && last.categoria === item.categoriaNombre) {
        last.items.push(item);
      } else {
        groups.push({ categoria: item.categoriaNombre, items: [item] });
      }
    }
    return groups;
  }, [data]);

  async function cambiarEstado(estado: EstadoCotizacion) {
    if (!data || data.estado === estado) return;
    setChanging(estado);
    try {
      const updated = await api.cotizaciones.cambiarEstado(data.id, estado);
      setData(updated);
      toast.success(`Estado actualizado a “${estadoLabels[estado]}”.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo cambiar el estado.");
    } finally {
      setChanging(null);
    }
  }

  async function duplicar() {
    if (!data) return;
    setDuplicating(true);
    try {
      const copia = await api.cotizaciones.duplicar(data.id);
      toast.success(`Nueva versión ${copia.codigo} creada como borrador.`);
      router.push(`/cotizaciones/${copia.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo duplicar la cotización.");
    } finally {
      setDuplicating(false);
    }
  }

  async function eliminar() {
    if (!data) return;
    setDeleting(true);
    try {
      await api.cotizaciones.eliminar(data.id);
      toast.success(`Cotización ${data.codigo} eliminada.`);
      router.push("/cotizaciones");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar la cotización.");
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  if (loading) {
    return (
      <div className="card">
        <LoadingBlock rows={9} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card">
        <EmptyState
          title="No encontramos esta cotización"
          description={error || "Es posible que haya sido eliminada o que el enlace no sea válido."}
          action={
            <Link href="/cotizaciones" className="btn btn-primary">
              <ArrowLeft className="h-4 w-4" />
              Volver a cotizaciones
            </Link>
          }
        />
      </div>
    );
  }

  const eventDays = daysUntil(data.fechaEvento);
  const margin = data.subtotalVenta > 0 ? (data.gananciaEstimada / data.subtotalVenta) * 100 : 0;

  return (
    <div>
      <PageHeader
        eyebrow="Propuesta comercial"
        title={data.codigo}
        description={`${data.clienteNombre} · ${data.tipoEvento ?? "Evento"} · ${formatDate(data.fechaEvento)}`}
        actions={
          <>
            <Link href="/cotizaciones" className="btn btn-outline">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
            <Link href={`/cotizaciones/${data.id}/editar`} className="btn btn-outline">
              <Pencil className="h-4 w-4" />
              Editar
            </Link>
            <a
              href={api.cotizaciones.pdfUrl(data.id)}
              className="btn btn-primary"
            >
              <Download className="h-4 w-4" />
              PDF
            </a>
            <details className="group relative">
              <summary className="btn btn-dark cursor-pointer list-none">
                <FileSpreadsheet className="h-4 w-4" />
                Excel
                <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />
              </summary>
              <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                <a
                  href={api.cotizaciones.excelUrl(data.id, "cliente")}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  <FileText className="h-3.5 w-3.5 text-emerald-600" />
                  Excel para el cliente
                </a>
                <a
                  href={api.cotizaciones.excelUrl(data.id, "interno")}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                  Excel interno (costos)
                </a>
              </div>
            </details>
          </>
        }
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <section className="card overflow-hidden">
          <div className="relative overflow-hidden bg-ink px-5 py-6 text-white sm:px-7">
            <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full border border-brand-400/20" />
            <div className="pointer-events-none absolute -bottom-24 right-10 h-52 w-52 rounded-full bg-brand-500/10" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-brand-300">
                  Propuesta para
                </p>
                <h2 className="mt-1.5 font-serif text-2xl leading-tight text-white sm:text-[28px]">
                  {data.clienteNombre}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5 text-brand-300" />
                    {formatDate(data.fechaEvento)}
                  </span>
                  {data.localEvento && (
                    <span className="inline-flex items-center gap-1">
                      <span className="text-slate-500">·</span>
                      <MapPin className="h-3.5 w-3.5 text-brand-300" />
                      {data.localEvento}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <span className="text-slate-500">·</span>
                    <Users className="h-3.5 w-3.5 text-brand-300" />
                    {data.cantidadInvitados} invitados
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <EstadoBadge estado={data.estado} />
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium text-slate-300">
                    <History className="h-3 w-3" />
                    Versión {data.version}
                  </span>
                  {data.incluyeIgv && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium text-slate-300">
                      Incluye IGV
                    </span>
                  )}
                </div>
              </div>
              <div className="shrink-0 sm:text-right">
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-300">
                  Total de la propuesta
                </p>
                <p className="mt-1 font-serif text-3xl leading-none text-white sm:text-[34px]">
                  {money(data.totalVenta)}
                </p>
                <p className="mt-1.5 text-[10px] text-slate-400">
                  {money(data.ticketPorPersona)} por invitado
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-slate-100 sm:grid-cols-4">
            <div className="px-4 py-3.5">
              <p className="text-[9px] uppercase tracking-wider text-slate-400">Emisión</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-700">{formatDate(data.fechaEmision)}</p>
            </div>
            <div className="px-4 py-3.5">
              <p className="text-[9px] uppercase tracking-wider text-slate-400">Válida hasta</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-700">{formatDate(data.validoHasta)}</p>
            </div>
            <div className="px-4 py-3.5">
              <p className="text-[9px] uppercase tracking-wider text-slate-400">Temática</p>
              <p className="mt-0.5 truncate text-xs font-semibold text-slate-700">
                {data.tematica || "Por definir"}
              </p>
            </div>
            <div className="px-4 py-3.5">
              <p className="text-[9px] uppercase tracking-wider text-slate-400">Paleta</p>
              <p className="mt-0.5 truncate text-xs font-semibold text-slate-700">
                {data.paletaColores || "Por definir"}
              </p>
            </div>
          </div>
        </section>

        <section className="card card-pad lg:w-[300px]">
          <p className="eyebrow mb-2">Estado de la propuesta</p>
          <div className="grid grid-cols-2 gap-1.5">
            {estados.map((estado) => {
              const active = data.estado === estado;
              return (
                <button
                  key={estado}
                  type="button"
                  onClick={() => cambiarEstado(estado)}
                  disabled={changing !== null}
                  className={`rounded-lg px-2.5 py-2 text-[11px] font-semibold ring-1 ring-inset transition disabled:opacity-60 ${
                    active
                      ? estadoStyles[estado].badge
                      : "bg-white text-slate-500 ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {changing === estado ? (
                    <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" />
                  ) : (
                    estadoLabels[estado]
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={duplicar}
              disabled={duplicating}
              className="btn btn-outline w-full justify-start"
            >
              {duplicating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
              Duplicar como nueva versión
            </button>
            {data.cotizacionOrigenId && data.codigoOrigen && (
              <Link
                href={`/cotizaciones/${data.cotizacionOrigenId}`}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
              >
                <History className="h-3.5 w-3.5" />
                Basada en {data.codigoOrigen}
              </Link>
            )}
            {data.estado === "BORRADOR" && (
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="btn btn-ghost w-full justify-start text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar borrador
              </button>
            )}
          </div>
          {eventDays !== null && eventDays >= 0 && (
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-[10px] leading-relaxed text-brand-800">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              El evento está a {eventDays} día(s). Última actualización: {formatDateTime(data.actualizadoEn)}.
            </div>
          )}
        </section>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="card overflow-hidden print-block">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-serif text-xl text-ink">Detalle de servicios</h2>
                <p className="text-xs text-slate-500">
                  {data.detalles.filter((item) => !item.esSubitemInformativo).length} líneas cotizadas
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCosts((value) => !value)}
                className={`chip ${showCosts ? "border-amber-300 bg-amber-50 text-amber-800" : ""}`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {showCosts ? "Ocultar costos" : "Ver costos internos"}
              </button>
            </div>

            <div className="table-shell">
              <table className={`table-base ${showCosts ? "min-w-[900px]" : "min-w-[640px]"}`}>
                <thead>
                  <tr>
                    <th className="th">Descripción</th>
                    <th className="th text-center">Unid.</th>
                    <th className="th text-right">P. unit.</th>
                    <th className="th text-right">Subtotal</th>
                    {showCosts && (
                      <>
                        <th className="th bg-amber-50/70 text-right text-amber-800">Costo unit.</th>
                        <th className="th bg-amber-50/70 text-right text-amber-800">Costo total</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {grouped.map((group) => {
                    const groupSubtotal = group.items.reduce((sum, item) => sum + item.subtotalVenta, 0);
                    return (
                      <Fragment key={group.categoria}>
                        <tr className="bg-brand-50/50">
                          <td
                            colSpan={showCosts ? 6 : 4}
                            className="border-b border-brand-100 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-800"
                          >
                            {group.categoria}
                          </td>
                        </tr>
                        {group.items.map((item) => (
                          <tr key={item.id} className={item.esSubitemInformativo ? "bg-slate-50/50" : ""}>
                            <td className="td">
                              {item.esSubitemInformativo ? (
                                <div className="flex items-start gap-2 py-0.5 pl-6 text-[11px] italic leading-relaxed text-slate-500">
                                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                                  {item.descripcion}
                                </div>
                              ) : (
                                <p className="text-[13px] text-slate-700">{item.descripcion}</p>
                              )}
                            </td>
                            <td className="td text-center text-xs text-slate-500">
                              {item.esSubitemInformativo ? "—" : item.unidades}
                            </td>
                            <td className="td text-right text-xs text-slate-500">
                              {item.esSubitemInformativo ? "—" : money(item.precioUnitarioVenta)}
                            </td>
                            <td className="td text-right text-[13px] font-semibold text-slate-800">
                              {item.esSubitemInformativo ? "Incluido" : money(item.subtotalVenta)}
                            </td>
                            {showCosts && (
                              <>
                                <td className="td bg-amber-50/30 text-right text-xs text-amber-800/80">
                                  {item.esSubitemInformativo ? "—" : money(item.costoUnitarioInterno)}
                                </td>
                                <td className="td bg-amber-50/30 text-right text-xs font-medium text-amber-900">
                                  {item.esSubitemInformativo ? "—" : money(item.subtotalCostoInterno)}
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                        <tr className="bg-slate-50/60">
                          <td
                            colSpan={showCosts ? 6 : 4}
                            className="px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400"
                          >
                            Subtotal {group.categoria}:{" "}
                            <span className="ml-1 text-slate-600">{money(groupSubtotal)}</span>
                          </td>
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid gap-0 border-t border-slate-200 bg-slate-50/40 sm:grid-cols-2">
              <div className="px-5 py-4 text-[11px] leading-relaxed text-slate-400">
                {data.incluyeIgv
                  ? "Los importes incluyen IGV. La propuesta es válida hasta la fecha indicada y está sujeta a disponibilidad."
                  : "Los importes no incluyen IGV. La propuesta es válida hasta la fecha indicada y está sujeta a disponibilidad."}
              </div>
              <div className="space-y-2 px-5 py-4">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-medium text-slate-700">{money(data.subtotalVenta)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>IGV</span>
                  <span className="font-medium text-slate-700">{money(data.montoIgv)}</span>
                </div>
                <div className="flex items-end justify-between border-t border-slate-200 pt-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Total
                  </span>
                  <span className="font-serif text-xl text-ink">{money(data.totalVenta)}</span>
                </div>
              </div>
            </div>
          </section>

          {(data.notasCortesia || data.notasInternas) && (
            <div className="grid gap-4 md:grid-cols-2">
              {data.notasCortesia && (
                <section className="card card-pad print-block">
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-brand-600" />
                    <h2 className="font-serif text-base text-ink">Notas para el cliente</h2>
                  </div>
                  <p className="whitespace-pre-line text-xs leading-relaxed text-slate-600">
                    {data.notasCortesia}
                  </p>
                </section>
              )}
              {data.notasInternas && (
                <section className="card card-pad border-amber-200/70 bg-amber-50/30 print-block">
                  <div className="mb-2 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-amber-700" />
                    <h2 className="font-serif text-base text-ink">Notas internas</h2>
                  </div>
                  <p className="whitespace-pre-line text-xs leading-relaxed text-slate-600">
                    {data.notasInternas}
                  </p>
                </section>
              )}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <section className="card overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-serif text-lg text-ink">Análisis interno</h2>
              <p className="text-[11px] text-slate-500">Rentabilidad estimada de la propuesta</p>
            </div>
            <div className="space-y-3 p-5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Costo neto total</span>
                <span className="font-semibold text-amber-800">{money(data.costoInternoTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Ganancia estimada</span>
                <span className="font-semibold text-emerald-700">{money(data.gananciaEstimada)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Margen sobre venta</span>
                <span className="font-semibold text-emerald-700">{margin.toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300"
                  style={{ width: `${Math.min(100, Math.max(0, margin))}%` }}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-[11px]">
                <span className="text-slate-500">Ticket por invitado</span>
                <span className="font-semibold text-slate-700">{money(data.ticketPorPersona)}</span>
              </div>
              <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-slate-400">
                <TrendingUp className="mt-0.5 h-3 w-3 shrink-0" />
                Información confidencial: no se incluye en el PDF ni en el Excel para el cliente.
              </p>
            </div>
          </section>

          <section className="card card-pad">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-serif text-lg text-ink">Cliente</h2>
              <TipoClienteBadge tipo={data.clienteTipo} />
            </div>
            <p className="text-sm font-medium text-slate-800">{data.clienteNombre}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {tipoClienteLabels[data.clienteTipo]}
              {data.clienteDocumento ? ` · Doc. ${data.clienteDocumento}` : ""}
            </p>
            <div className="mt-4 space-y-2">
              {data.clienteTelefono && (
                <a
                  href={`tel:${data.clienteTelefono}`}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50"
                >
                  <Phone className="h-3.5 w-3.5 text-brand-600" />
                  {data.clienteTelefono}
                </a>
              )}
              {data.clienteEmail && (
                <a
                  href={`mailto:${data.clienteEmail}`}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50"
                >
                  <Mail className="h-3.5 w-3.5 text-brand-600" />
                  <span className="truncate">{data.clienteEmail}</span>
                </a>
              )}
              <Link
                href="/clientes"
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-brand-700 transition hover:bg-brand-50"
              >
                Ver ficha del cliente →
              </Link>
            </div>
          </section>

          <section className="card card-pad text-[11px] leading-relaxed text-slate-500">
            <div className="mb-2 flex items-center gap-2">
              <History className="h-4 w-4 text-slate-400" />
              <h2 className="font-serif text-base text-ink">Historial</h2>
            </div>
            <p>Creada el {formatDateTime(data.creadoEn)}</p>
            <p>Última actualización: {formatDateTime(data.actualizadoEn)}</p>
            <p className="mt-1.5">
              Versión {data.version}
              {data.codigoOrigen ? ` · Originada de ${data.codigoOrigen}` : " · Versión original"}
            </p>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={eliminar}
        title="Eliminar cotización"
        description={`Se eliminará permanentemente la cotización ${data.codigo} y todos sus ítems. Solo es posible eliminar borradores.`}
        confirmLabel="Eliminar"
        loading={deleting}
      />
    </div>
  );
}

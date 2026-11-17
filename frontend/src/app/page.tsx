"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  FileText,
  MapPin,
  Percent,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Dashboard } from "@/lib/types";
import { daysUntil, estadoLabels, formatDate, money, percent } from "@/lib/format";
import { estadoStyles } from "@/lib/constants";
import { EmptyState, ErrorBlock, EstadoBadge, LoadingBlock, PageHeader } from "@/components/ui";

function compactMoney(value: number) {
  if (value >= 1000) return `S/ ${(value / 1000).toFixed(1)}k`;
  return money(value);
}

function KpiCard({
  icon,
  label,
  value,
  detail,
  accent = "text-brand-600 bg-brand-50",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  accent?: string;
}) {
  return (
    <div className="card relative overflow-hidden p-5">
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-brand-50/70" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
          <p className="mt-2 font-serif text-[26px] leading-none text-ink">{value}</p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}>
          {icon}
        </div>
      </div>
      <p className="relative mt-3 text-[11px] leading-relaxed text-slate-500">{detail}</p>
    </div>
  );
}

function MonthlyChart({ data }: { data: Dashboard["serieMensual"] }) {
  if (!data.length) {
    return <EmptyState compact title="Sin movimientos" description="Aún no hay cotizaciones en los últimos meses." />;
  }
  const max = Math.max(...data.map((item) => item.total), 1);

  return (
    <div>
      <div className="flex h-[230px] items-end gap-2 sm:gap-4">
        {data.map((item, index) => {
          const height = Math.max(3, (item.total / max) * 100);
          const current = index === data.length - 1;
          return (
            <div key={item.clave} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
              <div className="relative flex w-full flex-1 items-end justify-center">
                <div
                  className={`w-full max-w-[56px] rounded-t-lg transition-all duration-300 ${
                    current
                      ? "bg-gradient-to-t from-brand-600 to-brand-300"
                      : "bg-slate-200 group-hover:bg-brand-200"
                  }`}
                  style={{ height: `${height}%` }}
                  title={`${item.etiqueta}: ${money(item.total)} · ${item.cantidad} cotización(es)`}
                />
                <div className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-[10px] font-medium text-white shadow-lg group-hover:block">
                  {money(item.total)}
                </div>
              </div>
              <span className={`text-[10px] font-medium ${current ? "text-brand-700" : "text-slate-400"}`}>
                {item.etiqueta}
              </span>
              <span className={`hidden text-[10px] font-semibold sm:block ${current ? "text-ink" : "text-slate-400"}`}>
                {compactMoney(item.total)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand-500" /> Mes actual
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-slate-200" /> Meses anteriores
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await api.dashboard());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error inesperado al cargar el dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPipeline = data?.pipeline.reduce((sum, item) => sum + item.monto, 0) ?? 0;
  const pipelineCount = data?.pipeline.reduce((sum, item) => sum + item.cantidad, 0) ?? 0;

  return (
    <div>
      <PageHeader
        eyebrow="Resumen ejecutivo"
        title="Panel general"
        description="Una lectura rápida del pulso comercial de M&M Eventos: cotizaciones, pipeline y próximos eventos."
        actions={
          <>
            <Link href="/cotizaciones" className="btn btn-outline">
              Ver cotizaciones
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href="/cotizaciones/nueva" className="btn btn-primary">
              <Sparkles className="h-4 w-4" />
              Nueva cotización
            </Link>
          </>
        }
      />

      {loading && !data ? (
        <div className="card">
          <LoadingBlock rows={8} />
        </div>
      ) : error ? (
        <div className="card">
          <ErrorBlock message={error} onRetry={load} />
        </div>
      ) : data ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              icon={<FileText className="h-5 w-5" />}
              label="Cotizaciones del mes"
              value={String(data.kpis.cotizacionesMes)}
              detail={`${data.kpis.cotizacionesTotal} cotizaciones registradas en total`}
            />
            <KpiCard
              icon={<Wallet className="h-5 w-5" />}
              label="Monto cotizado"
              value={money(data.kpis.montoCotizadoMes)}
              detail="Propuestas enviadas durante el mes en curso"
              accent="text-sky-600 bg-sky-50"
            />
            <KpiCard
              icon={<Percent className="h-5 w-5" />}
              label="Tasa de cierre"
              value={percent(data.kpis.tasaCierre, 0)}
              detail={`${data.kpis.aprobadasMes} aprobadas este mes`}
              accent="text-emerald-600 bg-emerald-50"
            />
            <KpiCard
              icon={<TrendingUp className="h-5 w-5" />}
              label="Ganancia proyectada"
              value={money(data.kpis.gananciaProyectada)}
              detail="Margen estimado de la cartera cotizada"
              accent="text-amber-700 bg-amber-50"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <CircleDollarSign className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Ticket promedio</p>
                <p className="text-sm font-semibold text-ink">{money(data.kpis.ticketPromedio)}</p>
              </div>
            </div>
            <div className="card flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Clientes activos</p>
                <p className="text-sm font-semibold text-ink">{data.kpis.clientesActivos}</p>
              </div>
            </div>
            <div className="card flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <CalendarDays className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Próximos eventos</p>
                <p className="text-sm font-semibold text-ink">{data.proximosEventos.length}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="card card-pad xl:col-span-2">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-xl text-ink">Monto cotizado por mes</h2>
                  <p className="mt-1 text-xs text-slate-500">Últimos seis meses de actividad comercial</p>
                </div>
                <span className="hidden rounded-full bg-brand-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-700 sm:inline-flex">
                  Soles peruanos
                </span>
              </div>
              <MonthlyChart data={data.serieMensual} />
            </div>

            <div className="card card-pad">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-serif text-xl text-ink">Pipeline</h2>
                  <p className="mt-1 text-xs text-slate-500">Estado de la cartera comercial</p>
                </div>
                <Link href="/cotizaciones" className="text-[11px] font-semibold text-brand-700 hover:text-brand-800">
                  Ver todo
                </Link>
              </div>

              <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
                {data.pipeline.map((item) => {
                  const width = pipelineCount ? (item.cantidad / pipelineCount) * 100 : 0;
                  return (
                    <div
                      key={item.estado}
                      className={`${estadoStyles[item.estado].bar} h-full transition-all`}
                      style={{ width: `${width}%` }}
                      title={`${estadoLabels[item.estado]}: ${item.cantidad}`}
                    />
                  );
                })}
              </div>

              <div className="mt-5 space-y-3">
                {data.pipeline.map((item) => (
                  <div key={item.estado} className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${estadoStyles[item.estado].dot}`} />
                      <span className="text-xs font-medium text-slate-600">{estadoLabels[item.estado]}</span>
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                        {item.cantidad}
                      </span>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-slate-700">{money(item.monto)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Total cartera
                </span>
                <span className="font-serif text-lg text-ink">{money(totalPipeline)}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 2xl:grid-cols-3">
            <div className="card 2xl:col-span-2">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="font-serif text-lg text-ink">Cotizaciones recientes</h2>
                  <p className="text-xs text-slate-500">Últimas propuestas registradas</p>
                </div>
                <Link
                  href="/cotizaciones"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 hover:text-brand-800"
                >
                  Ver todas <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="table-shell">
                <table className="table-base min-w-[680px]">
                  <thead>
                    <tr>
                      <th className="th">Código</th>
                      <th className="th">Cliente</th>
                      <th className="th">Evento</th>
                      <th className="th text-right">Total</th>
                      <th className="th">Estado</th>
                      <th className="th w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.recientes.map((item) => (
                      <tr key={item.id} className="row-hover">
                        <td className="td">
                          <span className="font-mono text-xs font-medium text-slate-700">{item.codigo}</span>
                        </td>
                        <td className="td">
                          <p className="max-w-[190px] truncate text-[13px] font-medium text-slate-800">
                            {item.clienteNombre}
                          </p>
                          <p className="text-[11px] text-slate-400">{item.tipoEvento ?? "Evento"}</p>
                        </td>
                        <td className="td text-xs text-slate-500">
                          {formatDate(item.fechaEvento)}
                          {item.localEvento && (
                            <p className="max-w-[150px] truncate text-[11px] text-slate-400">{item.localEvento}</p>
                          )}
                        </td>
                        <td className="td text-right text-[13px] font-semibold text-ink">
                          {money(item.totalVenta)}
                        </td>
                        <td className="td">
                          <EstadoBadge estado={item.estado} />
                        </td>
                        <td className="td text-right">
                          <Link
                            href={`/cotizaciones/${item.id}`}
                            className="btn-icon h-7 w-7"
                            aria-label={`Ver ${item.codigo}`}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 2xl:block 2xl:space-y-6">
              <div className="card card-pad">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-lg text-ink">Próximos eventos</h2>
                    <p className="text-xs text-slate-500">Agenda confirmada y por confirmar</p>
                  </div>
                  <CalendarDays className="h-4 w-4 text-brand-600" />
                </div>
                {data.proximosEventos.length === 0 ? (
                  <EmptyState compact title="Sin eventos próximos" description="Registra una cotización con fecha de evento." />
                ) : (
                  <div className="space-y-3">
                    {data.proximosEventos.slice(0, 4).map((item) => {
                      const days = daysUntil(item.fechaEvento);
                      return (
                        <Link
                          key={item.id}
                          href={`/cotizaciones/${item.id}`}
                          className="group flex items-start gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-brand-200 hover:bg-brand-50/40"
                        >
                          <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-ink text-white">
                            <span className="text-[9px] uppercase leading-none text-brand-200">
                              {item.fechaEvento
                                ? new Date(`${item.fechaEvento}T00:00:00`).toLocaleDateString("es-PE", { month: "short" })
                                : "—"}
                            </span>
                            <span className="text-sm font-semibold leading-tight">
                              {item.fechaEvento ? item.fechaEvento.slice(8, 10) : "—"}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium text-slate-800 group-hover:text-brand-800">
                              {item.clienteNombre}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-slate-400">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {item.localEvento ?? "Local por confirmar"}
                            </p>
                            <p className="mt-1 text-[10px] font-medium text-slate-500">
                              {item.cantidadInvitados} invitados
                              {days !== null && days >= 0 && (
                                <span className="ml-1.5 text-brand-700">· en {days} día(s)</span>
                              )}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="card card-pad">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-lg text-ink">Top categorías</h2>
                    <p className="text-xs text-slate-500">Participación en el monto cotizado</p>
                  </div>
                  <Sparkles className="h-4 w-4 text-brand-600" />
                </div>
                <div className="space-y-3.5">
                  {data.topCategorias.map((item) => (
                    <div key={item.categoria}>
                      <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
                        <span className="truncate font-medium text-slate-600">{item.categoria}</span>
                        <span className="shrink-0 text-slate-400">{percent(item.porcentaje)}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-300"
                          style={{ width: `${Math.max(2, item.porcentaje)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {data.topCategorias.length === 0 && (
                    <p className="py-4 text-center text-xs text-slate-400">Aún no hay categorías con movimientos.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

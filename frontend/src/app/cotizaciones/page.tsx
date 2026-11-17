"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Copy,
  Download,
  FileText,
  Pencil,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { CotizacionResumen, EstadoCotizacion, PageResponse } from "@/lib/types";
import { estadoLabels, formatDate, money } from "@/lib/format";
import { estados } from "@/lib/constants";
import {
  EmptyState,
  ErrorBlock,
  EstadoBadge,
  LoadingBlock,
  PageHeader,
  Pagination,
  TipoClienteBadge,
} from "@/components/ui";
import { useToast } from "@/components/toast";

export default function CotizacionesPage() {
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<PageResponse<CotizacionResumen> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState<EstadoCotizacion | "">("");
  const [page, setPage] = useState(0);
  const [duplicating, setDuplicating] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(q.trim());
      setPage(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(
        await api.cotizaciones.listar({
          q: search || undefined,
          estado: estado || undefined,
          page,
          size: 12,
          sort: "creadoEn",
          dir: "desc",
        }),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error inesperado al listar las cotizaciones.");
    } finally {
      setLoading(false);
    }
  }, [search, estado, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function duplicar(id: number) {
    setDuplicating(id);
    try {
      const copia = await api.cotizaciones.duplicar(id);
      toast.success(`Cotización duplicada como ${copia.codigo} (versión ${copia.version}).`);
      router.push(`/cotizaciones/${copia.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo duplicar la cotización.");
    } finally {
      setDuplicating(null);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Gestión comercial"
        title="Cotizaciones"
        description="Administra propuestas, controla su estado y genera versiones para cada evento."
        actions={
          <Link href="/cotizaciones/nueva" className="btn btn-primary">
            <Plus className="h-4 w-4" />
            Nueva cotización
          </Link>
        }
      />

      <div className="card mb-5 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Buscar por código, cliente, local o temática..."
              className="input pl-10 pr-9"
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

          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => {
                setEstado("");
                setPage(0);
              }}
              className={`chip shrink-0 ${estado === "" ? "chip-active" : ""}`}
            >
              Todas
            </button>
            {estados.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setEstado(item);
                  setPage(0);
                }}
                className={`chip shrink-0 ${estado === item ? "chip-active" : ""}`}
              >
                {estadoLabels[item]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <LoadingBlock rows={7} />
        ) : error ? (
          <ErrorBlock message={error} onRetry={load} />
        ) : !data || data.content.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title={search || estado ? "No encontramos cotizaciones" : "Aún no hay cotizaciones"}
            description={
              search || estado
                ? "Prueba con otro término de búsqueda o cambia el filtro de estado."
                : "Crea la primera propuesta y empieza a dar forma a los próximos eventos."
            }
            action={
              <Link href="/cotizaciones/nueva" className="btn btn-primary">
                <Sparkles className="h-4 w-4" />
                Crear cotización
              </Link>
            }
          />
        ) : (
          <>
            <div className="table-shell">
              <table className="table-base min-w-[860px]">
                <thead>
                  <tr>
                    <th className="th">Código</th>
                    <th className="th">Cliente</th>
                    <th className="th">Evento</th>
                    <th className="th text-right">Total</th>
                    <th className="th">Estado</th>
                    <th className="th text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((item) => (
                    <tr key={item.id} className="row-hover">
                      <td className="td">
                        <Link
                          href={`/cotizaciones/${item.id}`}
                          className="whitespace-nowrap font-mono text-xs font-semibold text-brand-800 hover:text-brand-900 hover:underline"
                        >
                          {item.codigo}
                        </Link>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          v{item.version} · {formatDate(item.fechaEmision)}
                        </p>
                      </td>
                      <td className="td">
                        <p className="max-w-[210px] truncate text-[13px] font-medium text-slate-800">
                          {item.clienteNombre}
                        </p>
                        <div className="mt-1">
                          <TipoClienteBadge tipo={item.clienteTipo} />
                        </div>
                      </td>
                      <td className="td">
                        <p className="text-xs font-medium text-slate-600">{item.tipoEvento ?? "Evento"}</p>
                        <p className="text-[11px] text-slate-400">{formatDate(item.fechaEvento)}</p>
                        {item.localEvento && (
                          <p className="max-w-[190px] truncate text-[11px] text-slate-400">{item.localEvento}</p>
                        )}
                        <p className="text-[11px] text-slate-400">{item.cantidadInvitados} invitados</p>
                      </td>
                      <td className="td text-right">
                        <p className="text-[13px] font-semibold text-ink">{money(item.totalVenta)}</p>
                        <p className="text-[10px] text-emerald-600">Ganancia {money(item.gananciaEstimada)}</p>
                      </td>
                      <td className="td">
                        <EstadoBadge estado={item.estado} />
                      </td>
                      <td className="td">
                        <div className="flex items-center justify-end gap-0.5">
                          <Link
                            href={`/cotizaciones/${item.id}/editar`}
                            className="btn-icon h-8 w-8"
                            title="Editar"
                            aria-label={`Editar ${item.codigo}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <a
                            href={api.cotizaciones.pdfUrl(item.id)}
                            className="btn-icon h-8 w-8"
                            title="Descargar PDF"
                            aria-label={`PDF de ${item.codigo}`}
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          <button
                            type="button"
                            onClick={() => duplicar(item.id)}
                            className="btn-icon h-8 w-8"
                            title="Duplicar como nueva versión"
                            aria-label={`Duplicar ${item.codigo}`}
                            disabled={duplicating === item.id}
                          >
                            <Copy className={`h-4 w-4 ${duplicating === item.id ? "animate-pulse" : ""}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              onChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}

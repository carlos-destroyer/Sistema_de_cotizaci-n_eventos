"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Power,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Cliente, ClienteRequest, TipoCliente } from "@/lib/types";
import { initials, tipoClienteLabels } from "@/lib/format";
import {
  ConfirmDialog,
  EmptyState,
  ErrorBlock,
  Field,
  LoadingBlock,
  Modal,
  PageHeader,
  TipoClienteBadge,
} from "@/components/ui";
import { useToast } from "@/components/toast";

const emptyForm: ClienteRequest = {
  nombreRazonSocial: "",
  tipoCliente: "SOCIAL",
  documento: "",
  telefono: "",
  email: "",
  direccion: "",
  notas: "",
  activo: true,
};

export default function ClientesPage() {
  const toast = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState<TipoCliente | "">("");
  const [includeInactive, setIncludeInactive] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [form, setForm] = useState<ClienteRequest>(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [target, setTarget] = useState<Cliente | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(q.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setClientes(
        await api.clientes.listar({
          q: search || undefined,
          tipo: tipo || undefined,
          incluirInactivos: includeInactive,
        }),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar los clientes.");
    } finally {
      setLoading(false);
    }
  }, [search, tipo, includeInactive]);

  useEffect(() => {
    void load();
  }, [load]);

  const social = clientes.filter((cliente) => cliente.tipoCliente === "SOCIAL").length;
  const corporativo = clientes.filter((cliente) => cliente.tipoCliente === "CORPORATIVO").length;

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(cliente: Cliente) {
    setEditing(cliente);
    setForm({
      nombreRazonSocial: cliente.nombreRazonSocial,
      tipoCliente: cliente.tipoCliente,
      documento: cliente.documento ?? "",
      telefono: cliente.telefono ?? "",
      email: cliente.email ?? "",
      direccion: cliente.direccion ?? "",
      notas: cliente.notas ?? "",
      activo: cliente.activo,
    });
    setFormError("");
    setFormOpen(true);
  }

  async function save() {
    setFormError("");
    if (!form.nombreRazonSocial.trim()) {
      setFormError("El nombre o razón social es obligatorio.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.clientes.actualizar(editing.id, form);
        toast.success("Cliente actualizado correctamente.");
      } else {
        await api.clientes.crear(form);
        toast.success("Cliente registrado correctamente.");
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(Object.values(err.fields ?? {})[0] ?? err.message);
      } else {
        setFormError("No se pudo guardar el cliente.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function reactivate(cliente: Cliente) {
    setProcessing(true);
    try {
      await api.clientes.actualizar(cliente.id, {
        nombreRazonSocial: cliente.nombreRazonSocial,
        tipoCliente: cliente.tipoCliente,
        documento: cliente.documento ?? "",
        telefono: cliente.telefono ?? "",
        email: cliente.email ?? "",
        direccion: cliente.direccion ?? "",
        notas: cliente.notas ?? "",
        activo: true,
      });
      toast.success(`Cliente ${cliente.nombreRazonSocial} reactivado.`);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo reactivar el cliente.");
    } finally {
      setProcessing(false);
    }
  }

  async function deactivate() {
    if (!target) return;
    setProcessing(true);
    try {
      await api.clientes.desactivar(target.id);
      toast.success("Cliente desactivado. Su historial de cotizaciones se conserva.");
      setTarget(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo desactivar el cliente.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Directorio comercial"
        title="Clientes"
        description="Centraliza los datos de contacto y el historial de cada cliente social o corporativo."
        actions={
          <button type="button" className="btn btn-primary" onClick={openNew}>
            <Plus className="h-4 w-4" />
            Nuevo cliente
          </button>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="card flex items-center gap-3 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">En esta vista</p>
            <p className="text-sm font-semibold text-ink">{clientes.length} cliente(s)</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Corporativos</p>
            <p className="text-sm font-semibold text-ink">{corporativo}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <UserRound className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Sociales</p>
            <p className="text-sm font-semibold text-ink">{social}</p>
          </div>
        </div>
      </div>

      <div className="card mb-5 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              className="input pl-10 pr-9"
              placeholder="Buscar por nombre, documento, email o teléfono..."
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
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setTipo("")}
                className={`chip ${tipo === "" ? "chip-active" : ""}`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setTipo("SOCIAL")}
                className={`chip ${tipo === "SOCIAL" ? "chip-active" : ""}`}
              >
                Social
              </button>
              <button
                type="button"
                onClick={() => setTipo("CORPORATIVO")}
                className={`chip ${tipo === "CORPORATIVO" ? "chip-active" : ""}`}
              >
                Corporativo
              </button>
            </div>
            <label className="ml-1 inline-flex cursor-pointer items-center gap-2 text-[11px] font-medium text-slate-500">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(event) => setIncludeInactive(event.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 accent-brand-600"
              />
              Incluir inactivos
            </label>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <LoadingBlock rows={6} />
        ) : error ? (
          <ErrorBlock message={error} onRetry={load} />
        ) : clientes.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title={search || tipo ? "Sin resultados" : "Aún no hay clientes"}
            description={
              search || tipo
                ? "Ajusta la búsqueda o los filtros para encontrar al cliente."
                : "Registra a tus primeros clientes para empezar a cotizar sus eventos."
            }
            action={
              <button type="button" className="btn btn-primary" onClick={openNew}>
                <Plus className="h-4 w-4" />
                Nuevo cliente
              </button>
            }
          />
        ) : (
          <div className="table-shell">
            <table className="table-base min-w-[880px]">
              <thead>
                <tr>
                  <th className="th">Cliente</th>
                  <th className="th">Tipo</th>
                  <th className="th">Contacto</th>
                  <th className="th">Dirección</th>
                  <th className="th">Estado</th>
                  <th className="th text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className={`row-hover ${cliente.activo ? "" : "opacity-60"}`}>
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                            cliente.tipoCliente === "CORPORATIVO"
                              ? "bg-indigo-50 text-indigo-700"
                              : "bg-brand-50 text-brand-800"
                          }`}
                        >
                          {initials(cliente.nombreRazonSocial)}
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-[240px] truncate text-[13px] font-medium text-slate-800">
                            {cliente.nombreRazonSocial}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {cliente.documento ? `Doc. ${cliente.documento}` : "Sin documento"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="td">
                      <TipoClienteBadge tipo={cliente.tipoCliente} />
                    </td>
                    <td className="td">
                      <div className="space-y-1 text-[11px] text-slate-500">
                        {cliente.telefono && (
                          <p className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {cliente.telefono}
                          </p>
                        )}
                        {cliente.email && (
                          <p className="flex items-center gap-1.5">
                            <Mail className="h-3 w-3 text-slate-400" />
                            <span className="max-w-[180px] truncate">{cliente.email}</span>
                          </p>
                        )}
                        {!cliente.telefono && !cliente.email && <span className="text-slate-300">—</span>}
                      </div>
                    </td>
                    <td className="td max-w-[200px]">
                      <p className="flex items-start gap-1.5 text-[11px] text-slate-500">
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
                        <span className="line-clamp-2">{cliente.direccion || "—"}</span>
                      </p>
                    </td>
                    <td className="td">
                      <span
                        className={`badge ${
                          cliente.activo
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : "bg-slate-100 text-slate-500 ring-slate-200"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${cliente.activo ? "bg-emerald-500" : "bg-slate-400"}`}
                        />
                        {cliente.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="td">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          type="button"
                          onClick={() => openEdit(cliente)}
                          className="btn-icon h-8 w-8"
                          title="Editar cliente"
                          aria-label={`Editar ${cliente.nombreRazonSocial}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {cliente.activo ? (
                          <button
                            type="button"
                            onClick={() => setTarget(cliente)}
                            className="btn-icon h-8 w-8 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            title="Desactivar cliente"
                            aria-label={`Desactivar ${cliente.nombreRazonSocial}`}
                          >
                            <Power className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => reactivate(cliente)}
                            disabled={processing}
                            className="btn-icon h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                            title="Reactivar cliente"
                            aria-label={`Reactivar ${cliente.nombreRazonSocial}`}
                          >
                            <Power className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Editar cliente" : "Nuevo cliente"}
        description={
          editing
            ? "Actualiza los datos de contacto del cliente. Los cambios no alteran sus cotizaciones."
            : "Registra los datos principales del cliente para agilizar sus próximas cotizaciones."
        }
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Guardar cambios" : "Registrar cliente"}
            </button>
          </>
        }
      >
        {formError && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {formError}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre o razón social" required className="sm:col-span-2">
            <input
              value={form.nombreRazonSocial}
              onChange={(event) => setForm({ ...form, nombreRazonSocial: event.target.value })}
              className="input"
              placeholder="Ej. Novios Stiwar & Camila / MiFarma S.A.C."
              autoFocus
            />
          </Field>
          <Field label="Tipo de cliente" required>
            <select
              value={form.tipoCliente}
              onChange={(event) => setForm({ ...form, tipoCliente: event.target.value as TipoCliente })}
              className="select"
            >
              <option value="SOCIAL">Social</option>
              <option value="CORPORATIVO">Corporativo</option>
            </select>
          </Field>
          <Field label="Documento / RUC">
            <input
              value={form.documento ?? ""}
              onChange={(event) => setForm({ ...form, documento: event.target.value })}
              className="input"
              placeholder="DNI o RUC"
            />
          </Field>
          <Field label="Teléfono">
            <input
              value={form.telefono ?? ""}
              onChange={(event) => setForm({ ...form, telefono: event.target.value })}
              className="input"
              placeholder="900 000 000"
            />
          </Field>
          <Field label="Correo electrónico">
            <input
              type="email"
              value={form.email ?? ""}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className="input"
              placeholder="cliente@correo.com"
            />
          </Field>
          <Field label="Dirección" className="sm:col-span-2">
            <input
              value={form.direccion ?? ""}
              onChange={(event) => setForm({ ...form, direccion: event.target.value })}
              className="input"
              placeholder="Distrito, ciudad"
            />
          </Field>
          <Field label="Notas internas" className="sm:col-span-2">
            <textarea
              value={form.notas ?? ""}
              onChange={(event) => setForm({ ...form, notas: event.target.value })}
              className="textarea"
              placeholder="Preferencias, referencias, historial relevante..."
            />
          </Field>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(event) => setForm({ ...form, activo: event.target.checked })}
              className="h-4 w-4 rounded border-slate-300 accent-brand-600"
            />
            Cliente activo
            <span className="text-[11px] font-normal text-slate-400">
              · {tipoClienteLabels[form.tipoCliente]}
            </span>
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        onConfirm={deactivate}
        title="Desactivar cliente"
        description={`El cliente “${target?.nombreRazonSocial ?? ""}” dejará de aparecer en los listados activos, pero su historial y cotizaciones se conservarán.`}
        confirmLabel="Desactivar"
        loading={processing}
      />
    </div>
  );
}

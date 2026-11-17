"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, ShieldCheck, Trash2, UserCog } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Usuario, UsuarioRequest, UsuarioUpdateRequest, RolUsuario } from "@/lib/types";
import { initials } from "@/lib/format";
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
import { useAuth } from "@/components/auth-provider";

const emptyForm: UsuarioRequest = {
  username: "",
  password: "",
  nombre: "",
  email: "",
  rol: "USUARIO",
  activo: true,
};

export default function UsuariosPage() {
  const toast = useToast();
  const { user: me } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [form, setForm] = useState<UsuarioRequest>(emptyForm);
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [target, setTarget] = useState<Usuario | null>(null);
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setUsuarios(await api.usuarios.listar());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setPassword("");
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(u: Usuario) {
    setEditing(u);
    setForm({
      username: u.username,
      password: "",
      nombre: u.nombre,
      email: u.email ?? "",
      rol: u.rol,
      activo: u.activo,
    });
    setPassword("");
    setFormError("");
    setFormOpen(true);
  }

  async function save() {
    setFormError("");
    setSaving(true);
    try {
      if (editing) {
        const body: UsuarioUpdateRequest = {
          nombre: form.nombre,
          email: form.email || null,
          rol: form.rol,
          activo: form.activo,
        };
        if (password.trim()) body.password = password.trim();
        await api.usuarios.actualizar(editing.id, body);
        toast.success("Usuario actualizado.");
      } else {
        if (!form.password.trim()) {
          setFormError("La contraseña es obligatoria.");
          setSaving(false);
          return;
        }
        await api.usuarios.crear({ ...form, password: form.password });
        toast.success("Usuario creado.");
      }
      setFormOpen(false);
      await load();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!target) return;
    setProcessing(true);
    try {
      await api.usuarios.eliminar(target.id);
      toast.success("Usuario eliminado.");
      setTarget(null);
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "No se pudo eliminar.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Administración"
        title="Usuarios"
        description="Gestiona las cuentas que pueden ingresar al sistema."
        actions={
          <button type="button" className="btn btn-primary" onClick={openNew}>
            <Plus className="h-4 w-4" />
            Nuevo usuario
          </button>
        }
      />

      {error && <ErrorBlock message={error} onRetry={load} />}

      {loading ? (
        <LoadingBlock />
      ) : usuarios.length === 0 ? (
        <EmptyState
          icon={<UserCog className="h-5 w-5" />}
          title="Sin usuarios"
          description="Crea el primer usuario para acceder al sistema."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="th">Usuario</th>
                  <th className="th">Nombre</th>
                  <th className="th">Correo</th>
                  <th className="th">Rol</th>
                  <th className="th">Estado</th>
                  <th className="th text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                          {initials(u.nombre)}
                        </div>
                        <span className="text-sm font-semibold text-ink">{u.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{u.nombre}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{u.email ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        <ShieldCheck className="h-3 w-3" />
                        {u.rol === "ADMIN" ? "Administrador" : "Usuario"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                          u.activo ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-500 ring-slate-200"
                        }`}
                      >
                        {u.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => openEdit(u)}
                          aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="btn-icon text-rose-600 hover:bg-rose-50"
                          onClick={() => setTarget(u)}
                          disabled={u.id === me?.id}
                          aria-label="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Editar usuario" : "Nuevo usuario"}>
        <div className="space-y-4">
          <Field label="Usuario" required>
            <input
              className="input"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              disabled={Boolean(editing)}
            />
          </Field>
          <Field label={editing ? "Nueva contraseña (opcional)" : "Contraseña"} required={!editing}>
            <input
              type="password"
              className="input"
              value={editing ? password : form.password}
              onChange={(e) =>
                editing ? setPassword(e.target.value) : setForm({ ...form, password: e.target.value })
              }
            />
          </Field>
          <Field label="Nombre" required>
            <input
              className="input"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </Field>
          <Field label="Correo">
            <input
              type="email"
              className="input"
              value={form.email ?? ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Rol">
            <select
              className="input"
              value={form.rol}
              onChange={(e) => setForm({ ...form, rol: e.target.value as RolUsuario })}
            >
              <option value="USUARIO">Usuario</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </Field>
          <Field label="Estado">
            <select
              className="input"
              value={form.activo ? "1" : "0"}
              onChange={(e) => setForm({ ...form, activo: e.target.value === "1" })}
            >
              <option value="1">Activo</option>
              <option value="0">Inactivo</option>
            </select>
          </Field>

          {formError && (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 ring-1 ring-rose-200">
              {formError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Guardar" : "Crear"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        onConfirm={remove}
        title="Eliminar usuario"
        description={`Se eliminará permanentemente la cuenta “${target?.username ?? ""}”.`}
        confirmLabel="Eliminar"
        loading={processing}
      />
    </div>
  );
}
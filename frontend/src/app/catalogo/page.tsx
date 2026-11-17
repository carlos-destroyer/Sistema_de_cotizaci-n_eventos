"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Boxes,
  Eye,
  EyeOff,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Power,
  Search,
  Tags,
  X,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { CatalogoItem, CatalogoItemRequest, Categoria, ReglaCantidad } from "@/lib/types";
import { money, number as formatNumber, reglaLabels } from "@/lib/format";
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

interface ItemFormState {
  categoriaId: string;
  nombre: string;
  descripcion: string;
  unidadMedida: string;
  precioVenta: string;
  costoInterno: string;
  stockReferencial: string;
  reglaCantidad: ReglaCantidad;
  activo: boolean;
}

const emptyItemForm: ItemFormState = {
  categoriaId: "",
  nombre: "",
  descripcion: "",
  unidadMedida: "unidad",
  precioVenta: "",
  costoInterno: "",
  stockReferencial: "",
  reglaCantidad: "NINGUNA",
  activo: true,
};

export default function CatalogoPage() {
  const toast = useToast();
  const [items, setItems] = useState<CatalogoItem[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [allCategorias, setAllCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [showCosts, setShowCosts] = useState(true);

  const [itemOpen, setItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogoItem | null>(null);
  const [itemForm, setItemForm] = useState<ItemFormState>(emptyItemForm);
  const [itemError, setItemError] = useState("");
  const [savingItem, setSavingItem] = useState(false);
  const [itemTarget, setItemTarget] = useState<CatalogoItem | null>(null);

  const [catOpen, setCatOpen] = useState(false);
  const [catEditingId, setCatEditingId] = useState<number | null>(null);
  const [catNombre, setCatNombre] = useState("");
  const [catOrden, setCatOrden] = useState("0");
  const [catError, setCatError] = useState("");
  const [savingCat, setSavingCat] = useState(false);
  const [catTarget, setCatTarget] = useState<Categoria | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(q.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [q]);

  const loadCategories = useCallback(async () => {
    const active = await api.categorias.listar(false);
    setCategorias(active);
    return active;
  }, []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(
        await api.catalogo.listar({
          categoriaId: categoryId === "" ? undefined : categoryId,
          q: search || undefined,
          incluirInactivos: includeInactive,
        }),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar el catálogo.");
    } finally {
      setLoading(false);
    }
  }, [categoryId, search, includeInactive]);

  useEffect(() => {
    void loadCategories().catch(() => undefined);
  }, [loadCategories]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const totalActive = categorias.reduce((sum, categoria) => sum + categoria.items, 0);
  const visibleCategories = categorias;

  function openNewItem() {
    setEditingItem(null);
    setItemForm({
      ...emptyItemForm,
      categoriaId: categoryId !== "" ? String(categoryId) : categorias[0] ? String(categorias[0].id) : "",
    });
    setItemError("");
    setItemOpen(true);
  }

  function openEditItem(item: CatalogoItem) {
    setEditingItem(item);
    setItemForm({
      categoriaId: String(item.categoriaId),
      nombre: item.nombre,
      descripcion: item.descripcion ?? "",
      unidadMedida: item.unidadMedida ?? "unidad",
      precioVenta: String(item.precioVenta ?? 0),
      costoInterno: String(item.costoInterno ?? 0),
      stockReferencial: item.stockReferencial == null ? "" : String(item.stockReferencial),
      reglaCantidad: item.reglaCantidad,
      activo: item.activo,
    });
    setItemError("");
    setItemOpen(true);
  }

  async function saveItem() {
    setItemError("");
    if (!itemForm.categoriaId) {
      setItemError("Selecciona una categoría.");
      return;
    }
    if (!itemForm.nombre.trim()) {
      setItemError("El nombre del ítem es obligatorio.");
      return;
    }
    const payload: CatalogoItemRequest = {
      categoriaId: Number(itemForm.categoriaId),
      nombre: itemForm.nombre.trim(),
      descripcion: itemForm.descripcion.trim() || null,
      unidadMedida: itemForm.unidadMedida.trim() || null,
      precioVenta: Number(itemForm.precioVenta) || 0,
      costoInterno: Number(itemForm.costoInterno) || 0,
      stockReferencial: itemForm.stockReferencial === "" ? null : Number(itemForm.stockReferencial),
      reglaCantidad: itemForm.reglaCantidad,
      activo: itemForm.activo,
    };
    setSavingItem(true);
    try {
      if (editingItem) {
        await api.catalogo.actualizar(editingItem.id, payload);
        toast.success("Ítem actualizado en el catálogo.");
      } else {
        await api.catalogo.crear(payload);
        toast.success("Ítem agregado al catálogo.");
      }
      setItemOpen(false);
      await Promise.all([loadItems(), loadCategories()]);
    } catch (err) {
      if (err instanceof ApiError) {
        setItemError(Object.values(err.fields ?? {})[0] ?? err.message);
      } else {
        setItemError("No se pudo guardar el ítem.");
      }
    } finally {
      setSavingItem(false);
    }
  }

  async function toggleItem(item: CatalogoItem) {
    try {
      await api.catalogo.actualizar(item.id, {
        categoriaId: item.categoriaId,
        nombre: item.nombre,
        descripcion: item.descripcion ?? null,
        unidadMedida: item.unidadMedida ?? null,
        precioVenta: item.precioVenta,
        costoInterno: item.costoInterno,
        stockReferencial: item.stockReferencial ?? null,
        reglaCantidad: item.reglaCantidad,
        activo: !item.activo,
      });
      toast.success(item.activo ? "Ítem desactivado." : "Ítem reactivado.");
      await Promise.all([loadItems(), loadCategories()]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar el ítem.");
    }
  }

  async function deactivateItem() {
    if (!itemTarget) return;
    setSavingItem(true);
    try {
      await api.catalogo.desactivar(itemTarget.id);
      toast.success("Ítem desactivado del catálogo.");
      setItemTarget(null);
      await Promise.all([loadItems(), loadCategories()]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo desactivar el ítem.");
    } finally {
      setSavingItem(false);
    }
  }

  async function openCategories() {
    setCatOpen(true);
    setCatError("");
    setCatEditingId(null);
    setCatNombre("");
    setCatOrden("0");
    try {
      setAllCategorias(await api.categorias.listar(true));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudieron cargar las categorías.");
    }
  }

  async function saveCategory() {
    setCatError("");
    if (!catNombre.trim()) {
      setCatError("Escribe el nombre de la categoría.");
      return;
    }
    setSavingCat(true);
    try {
      if (catEditingId) {
        await api.categorias.actualizar(catEditingId, {
          nombre: catNombre.trim(),
          orden: Number(catOrden) || 0,
          activo: true,
        });
        toast.success("Categoría actualizada.");
      } else {
        await api.categorias.crear({
          nombre: catNombre.trim(),
          orden: Number(catOrden) || 0,
          activo: true,
        });
        toast.success("Categoría creada.");
      }
      setCatEditingId(null);
      setCatNombre("");
      setCatOrden("0");
      setAllCategorias(await api.categorias.listar(true));
      await Promise.all([loadItems(), loadCategories()]);
    } catch (err) {
      if (err instanceof ApiError) {
        setCatError(Object.values(err.fields ?? {})[0] ?? err.message);
      } else {
        setCatError("No se pudo guardar la categoría.");
      }
    } finally {
      setSavingCat(false);
    }
  }

  async function toggleCategory(categoria: Categoria) {
    try {
      await api.categorias.actualizar(categoria.id, {
        nombre: categoria.nombre,
        orden: categoria.orden,
        activo: !categoria.activo,
      });
      toast.success(categoria.activo ? "Categoría desactivada." : "Categoría reactivada.");
      setAllCategorias(await api.categorias.listar(true));
      await Promise.all([loadItems(), loadCategories()]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar la categoría.");
    }
  }

  async function deactivateCategory() {
    if (!catTarget) return;
    setSavingCat(true);
    try {
      await api.categorias.desactivar(catTarget.id);
      toast.success("Categoría desactivada. Sus ítems se conservan en el catálogo.");
      setCatTarget(null);
      setAllCategorias(await api.categorias.listar(true));
      await Promise.all([loadItems(), loadCategories()]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo desactivar la categoría.");
    } finally {
      setSavingCat(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Catálogo maestro"
        title="Servicios y mobiliario"
        description="Administra precios de venta, costos internos y reglas de cantidad para cotizar con precisión."
        actions={
          <>
            <button type="button" className="btn btn-outline" onClick={openCategories}>
              <Tags className="h-4 w-4" />
              Categorías
            </button>
            <button type="button" className="btn btn-primary" onClick={openNewItem}>
              <Plus className="h-4 w-4" />
              Nuevo ítem
            </button>
          </>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="card flex items-center gap-3 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <Boxes className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Ítems activos</p>
            <p className="text-sm font-semibold text-ink">{totalActive}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Categorías</p>
            <p className="text-sm font-semibold text-ink">{categorias.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <Eye className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Vista de costos</p>
            <p className="text-sm font-semibold text-ink">{showCosts ? "Visible" : "Oculta"}</p>
          </div>
        </div>
      </div>

      <div className="card mb-5 p-4 sm:p-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                className="input pl-10 pr-9"
                placeholder="Buscar por nombre, categoría o descripción..."
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
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 text-[11px] font-medium text-slate-500">
                <input
                  type="checkbox"
                  checked={includeInactive}
                  onChange={(event) => setIncludeInactive(event.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 accent-brand-600"
                />
                Incluir inactivos
              </label>
              <button
                type="button"
                onClick={() => setShowCosts((value) => !value)}
                className={`chip ${showCosts ? "border-amber-300 bg-amber-50 text-amber-800" : ""}`}
              >
                {showCosts ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showCosts ? "Ocultar costos" : "Ver costos"}
              </button>
            </div>
          </div>

          <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setCategoryId("")}
              className={`chip shrink-0 ${categoryId === "" ? "chip-active" : ""}`}
            >
              Todas las categorías
            </button>
            {visibleCategories.map((categoria) => (
              <button
                key={categoria.id}
                type="button"
                onClick={() => setCategoryId(categoria.id)}
                className={`chip shrink-0 ${categoryId === categoria.id ? "chip-active" : ""}`}
              >
                {categoria.nombre}
                <span
                  className={`rounded-full px-1.5 text-[9px] ${
                    categoryId === categoria.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {categoria.items}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <LoadingBlock rows={7} />
        ) : error ? (
          <ErrorBlock message={error} onRetry={loadItems} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Boxes className="h-6 w-6" />}
            title={search || categoryId !== "" ? "Sin resultados" : "El catálogo está vacío"}
            description={
              search || categoryId !== ""
                ? "Prueba con otra búsqueda o cambia la categoría."
                : "Agrega servicios, mobiliario y equipos para usarlos en tus cotizaciones."
            }
            action={
              <button type="button" className="btn btn-primary" onClick={openNewItem}>
                <Plus className="h-4 w-4" />
                Nuevo ítem
              </button>
            }
          />
        ) : (
          <div className="table-shell">
            <table className={`table-base ${showCosts ? "min-w-[1050px]" : "min-w-[850px]"}`}>
              <thead>
                <tr>
                  <th className="th">Ítem</th>
                  <th className="th">Categoría</th>
                  <th className="th">Regla</th>
                  <th className="th text-right">Precio venta</th>
                  {showCosts && <th className="th bg-amber-50/70 text-right text-amber-800">Costo interno</th>}
                  {showCosts && <th className="th bg-amber-50/70 text-right text-amber-800">Margen</th>}
                  <th className="th text-center">Stock</th>
                  <th className="th">Estado</th>
                  <th className="th text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const margin =
                    item.precioVenta > 0 ? ((item.precioVenta - item.costoInterno) / item.precioVenta) * 100 : 0;
                  return (
                    <tr key={item.id} className={`row-hover ${item.activo ? "" : "opacity-60"}`}>
                      <td className="td">
                        <p className="max-w-[260px] truncate text-[13px] font-medium text-slate-800">{item.nombre}</p>
                        <p className="max-w-[260px] truncate text-[11px] text-slate-400">
                          {item.descripcion || item.unidadMedida || "—"}
                        </p>
                      </td>
                      <td className="td">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          {item.categoriaNombre}
                        </span>
                      </td>
                      <td className="td text-[11px] text-slate-500">{reglaLabels[item.reglaCantidad]}</td>
                      <td className="td text-right text-[13px] font-semibold text-ink">{money(item.precioVenta)}</td>
                      {showCosts && (
                        <td className="td bg-amber-50/30 text-right text-xs font-medium text-amber-800">
                          {money(item.costoInterno)}
                        </td>
                      )}
                      {showCosts && (
                        <td className="td bg-amber-50/30 text-right text-xs font-semibold text-emerald-700">
                          {margin.toFixed(0)}%
                        </td>
                      )}
                      <td className="td text-center text-xs text-slate-500">
                        {item.stockReferencial == null ? "—" : formatNumber(item.stockReferencial)}
                      </td>
                      <td className="td">
                        <span
                          className={`badge ${
                            item.activo
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : "bg-slate-100 text-slate-500 ring-slate-200"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${item.activo ? "bg-emerald-500" : "bg-slate-400"}`}
                          />
                          {item.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="td">
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            type="button"
                            onClick={() => openEditItem(item)}
                            className="btn-icon h-8 w-8"
                            title="Editar ítem"
                            aria-label={`Editar ${item.nombre}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleItem(item)}
                            className={`btn-icon h-8 w-8 ${
                              item.activo
                                ? "text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                : "text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title={item.activo ? "Desactivar ítem" : "Reactivar ítem"}
                            aria-label={item.activo ? `Desactivar ${item.nombre}` : `Reactivar ${item.nombre}`}
                          >
                            <Power className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={itemOpen}
        onClose={() => setItemOpen(false)}
        title={editingItem ? "Editar ítem del catálogo" : "Nuevo ítem del catálogo"}
        description="Los precios de venta se muestran al cliente; los costos internos solo los ve el equipo."
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setItemOpen(false)} disabled={savingItem}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" onClick={saveItem} disabled={savingItem}>
              {savingItem && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingItem ? "Guardar cambios" : "Crear ítem"}
            </button>
          </>
        }
      >
        {itemError && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {itemError}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre del ítem" required className="sm:col-span-2">
            <input
              value={itemForm.nombre}
              onChange={(event) => setItemForm({ ...itemForm, nombre: event.target.value })}
              className="input"
              placeholder="Silla Tiffany dorada, cena de gala, toldo tubular..."
              autoFocus
            />
          </Field>
          <Field label="Categoría" required>
            <select
              value={itemForm.categoriaId}
              onChange={(event) => setItemForm({ ...itemForm, categoriaId: event.target.value })}
              className="select"
            >
              <option value="">Selecciona...</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Unidad de medida">
            <input
              value={itemForm.unidadMedida}
              onChange={(event) => setItemForm({ ...itemForm, unidadMedida: event.target.value })}
              className="input"
              placeholder="unidad, persona, mesa, hora..."
            />
          </Field>
          <Field label="Descripción" className="sm:col-span-2">
            <textarea
              value={itemForm.descripcion}
              onChange={(event) => setItemForm({ ...itemForm, descripcion: event.target.value })}
              className="textarea"
              placeholder="Detalle que ayuda a identificar el servicio..."
            />
          </Field>
          <Field label="Precio de venta (S/)" required>
            <input
              type="number"
              min="0"
              step="0.01"
              value={itemForm.precioVenta}
              onChange={(event) => setItemForm({ ...itemForm, precioVenta: event.target.value })}
              className="input"
              placeholder="0.00"
            />
          </Field>
          <Field label="Costo interno (S/)" required>
            <input
              type="number"
              min="0"
              step="0.01"
              value={itemForm.costoInterno}
              onChange={(event) => setItemForm({ ...itemForm, costoInterno: event.target.value })}
              className="input border-amber-200 bg-amber-50/30 focus:border-amber-500 focus:ring-amber-500/10"
              placeholder="0.00"
            />
          </Field>
          <Field label="Regla de cantidad" required>
            <select
              value={itemForm.reglaCantidad}
              onChange={(event) =>
                setItemForm({ ...itemForm, reglaCantidad: event.target.value as ReglaCantidad })
              }
              className="select"
            >
              <option value="NINGUNA">Cantidad manual</option>
              <option value="POR_INVITADO">Una unidad por invitado</option>
              <option value="POR_MESA">Una unidad por mesa (8 invitados)</option>
              <option value="POR_MOZO">Un mozo por cada 20 invitados</option>
            </select>
          </Field>
          <Field label="Stock referencial" hint="Opcional. Se usa como referencia de disponibilidad.">
            <input
              type="number"
              min="0"
              value={itemForm.stockReferencial}
              onChange={(event) => setItemForm({ ...itemForm, stockReferencial: event.target.value })}
              className="input"
              placeholder="Sin límite"
            />
          </Field>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600 sm:col-span-2">
            <input
              type="checkbox"
              checked={itemForm.activo}
              onChange={(event) => setItemForm({ ...itemForm, activo: event.target.checked })}
              className="h-4 w-4 rounded border-slate-300 accent-brand-600"
            />
            Ítem activo y disponible para cotizar
          </label>
        </div>
      </Modal>

      <Modal
        open={catOpen}
        onClose={() => setCatOpen(false)}
        title="Categorías del catálogo"
        description="Organiza los servicios por grupos para encontrar y cotizar más rápido."
        footer={
          <button type="button" className="btn btn-primary" onClick={() => setCatOpen(false)}>
            Cerrar
          </button>
        }
      >
        {catError && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {catError}
          </div>
        )}
        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <p className="field-label">{catEditingId ? "Editar categoría" : "Nueva categoría"}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={catNombre}
              onChange={(event) => setCatNombre(event.target.value)}
              className="input"
              placeholder="Nombre de la categoría"
            />
            <input
              type="number"
              value={catOrden}
              onChange={(event) => setCatOrden(event.target.value)}
              className="input sm:w-24"
              placeholder="Orden"
            />
            <button
              type="button"
              className="btn btn-dark shrink-0"
              onClick={saveCategory}
              disabled={savingCat}
            >
              {savingCat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {catEditingId ? "Guardar" : "Agregar"}
            </button>
            {catEditingId && (
              <button
                type="button"
                className="btn btn-ghost shrink-0"
                onClick={() => {
                  setCatEditingId(null);
                  setCatNombre("");
                  setCatOrden("0");
                  setCatError("");
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {allCategorias.map((categoria) => (
            <div key={categoria.id} className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-semibold text-slate-500">
                {categoria.orden}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-[13px] font-medium ${categoria.activo ? "text-slate-800" : "text-slate-400"}`}>
                  {categoria.nombre}
                </p>
                <p className="text-[10px] text-slate-400">
                  {categoria.items} ítem(s) · {categoria.activo ? "Activa" : "Inactiva"}
                </p>
              </div>
              <button
                type="button"
                className="btn-icon h-8 w-8"
                onClick={() => {
                  setCatEditingId(categoria.id);
                  setCatNombre(categoria.nombre);
                  setCatOrden(String(categoria.orden));
                  setCatError("");
                }}
                title="Editar categoría"
                aria-label={`Editar ${categoria.nombre}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className={`btn-icon h-8 w-8 ${
                  categoria.activo
                    ? "text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    : "text-emerald-600 hover:bg-emerald-50"
                }`}
                onClick={() =>
                  categoria.activo
                    ? setCatTarget(categoria)
                    : toggleCategory(categoria)
                }
                title={categoria.activo ? "Desactivar categoría" : "Reactivar categoría"}
                aria-label={categoria.activo ? `Desactivar ${categoria.nombre}` : `Reactivar ${categoria.nombre}`}
              >
                <Power className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {allCategorias.length === 0 && (
            <p className="px-4 py-6 text-center text-xs text-slate-400">Aún no hay categorías registradas.</p>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(itemTarget)}
        onClose={() => setItemTarget(null)}
        onConfirm={deactivateItem}
        title="Desactivar ítem"
        description={`El ítem “${itemTarget?.nombre ?? ""}” dejará de aparecer al cotizar. Las cotizaciones existentes no se modifican.`}
        confirmLabel="Desactivar"
        loading={savingItem}
      />

      <ConfirmDialog
        open={Boolean(catTarget)}
        onClose={() => setCatTarget(null)}
        onConfirm={deactivateCategory}
        title="Desactivar categoría"
        description={`La categoría “${catTarget?.nombre ?? ""}” dejará de mostrarse al cotizar. Sus ${catTarget?.items ?? 0} ítem(s) se conservan en el catálogo.`}
        confirmLabel="Desactivar"
        loading={savingCat}
      />
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Eye,
  EyeOff,
  Info,
  ListPlus,
  PackageOpen,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import type { CatalogoItem, Categoria } from "@/lib/types";
import { money, reglaLabels } from "@/lib/format";
import {
  blankItem,
  catalogToDraft,
  itemCost,
  itemSubtotal,
  type ItemDraft,
} from "@/lib/items";
import { EmptyState, Modal } from "./ui";

const cellInput =
  "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10";

export function ItemsEditor({
  items,
  onChange,
  categorias,
  catalogo,
  invitados,
  mode = "cotizacion",
}: {
  items: ItemDraft[];
  onChange: (items: ItemDraft[]) => void;
  categorias: Categoria[];
  catalogo: CatalogoItem[];
  invitados: number;
  mode?: "cotizacion" | "plantilla";
}) {
  const [showCosts, setShowCosts] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerCategory, setPickerCategory] = useState<number | "">("");
  const [added, setAdded] = useState(0);

  const filteredCatalog = useMemo(() => {
    const term = pickerSearch.trim().toLowerCase();
    return catalogo
      .filter((item) => item.activo)
      .filter((item) => (pickerCategory === "" ? true : item.categoriaId === pickerCategory))
      .filter((item) =>
        term
          ? item.nombre.toLowerCase().includes(term) ||
            item.categoriaNombre.toLowerCase().includes(term) ||
            (item.descripcion ?? "").toLowerCase().includes(term)
          : true,
      );
  }, [catalogo, pickerCategory, pickerSearch]);

  const categoryCount = new Set(items.map((item) => item.categoriaNombre).filter(Boolean)).size;

  function update(key: string, patch: Partial<ItemDraft>) {
    onChange(items.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function remove(key: string) {
    onChange(items.filter((item) => item.key !== key));
  }

  function addCatalogItem(item: CatalogoItem) {
    onChange([...items, catalogToDraft(item, invitados)]);
    setAdded((value) => value + 1);
  }

  function addManual() {
    onChange([...items, blankItem(categorias[0]?.nombre ?? "General")]);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {items.length} {items.length === 1 ? "ítem" : "ítems"}
          </span>
          {categoryCount > 0 && (
            <span className="text-[11px] text-slate-400">{categoryCount} categoría(s)</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCosts((value) => !value)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition ${
              showCosts ? "bg-brand-50 text-brand-800" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            {showCosts ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            Costos internos
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={addManual}>
            <ListPlus className="h-3.5 w-3.5" />
            Línea manual
          </button>
          <button type="button" className="btn btn-dark btn-sm" onClick={() => setPickerOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Agregar del catálogo
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
            <PackageOpen className="h-5 w-5" />
          </div>
          <p className="font-serif text-base text-ink">La propuesta está vacía</p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500">
            {mode === "plantilla"
              ? "Agrega servicios del catálogo o líneas manuales para definir la base de esta plantilla."
              : "Aplica una plantilla de evento o agrega servicios del catálogo para comenzar a cotizar."}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button type="button" className="btn btn-outline btn-sm" onClick={addManual}>
              <ListPlus className="h-3.5 w-3.5" />
              Línea manual
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setPickerOpen(true)}>
              <PackageOpen className="h-4 w-4" />
              Explorar catálogo
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className={`w-full border-collapse text-left ${showCosts ? "min-w-[900px]" : "min-w-[700px]"}`}>
            <thead>
              <tr>
                <th className="border-b border-slate-200 bg-slate-50 px-3 py-2.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Categoría
                </th>
                <th className="border-b border-slate-200 bg-slate-50 px-3 py-2.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Descripción
                </th>
                <th className="border-b border-slate-200 bg-slate-50 px-3 py-2.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {mode === "plantilla" ? "Cant. base" : "Unid."}
                </th>
                <th className="border-b border-slate-200 bg-slate-50 px-3 py-2.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  P. unitario
                </th>
                <th className="border-b border-slate-200 bg-slate-50 px-3 py-2.5 text-right text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Subtotal
                </th>
                {showCosts && (
                  <>
                    <th className="border-b border-amber-200/70 bg-amber-50/60 px-3 py-2.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-amber-800">
                      Costo unit.
                    </th>
                    <th className="border-b border-amber-200/70 bg-amber-50/60 px-3 py-2.5 text-right text-[9px] font-semibold uppercase tracking-[0.12em] text-amber-800">
                      Margen
                    </th>
                  </>
                )}
                <th className="border-b border-slate-200 bg-slate-50 px-2 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const subtotal = itemSubtotal(item);
                const cost = itemCost(item);
                const margin = subtotal > 0 ? ((subtotal - cost) / subtotal) * 100 : 0;
                return (
                  <tr key={item.key} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                    <td className="border-b border-slate-100 px-2 py-2 align-top">
                      <input
                        list="mm-categorias"
                        value={item.categoriaNombre}
                        onChange={(event) => update(item.key, { categoriaNombre: event.target.value })}
                        className={`${cellInput} min-w-[120px]`}
                        placeholder="Categoría"
                        aria-label="Categoría"
                      />
                    </td>
                    <td className="border-b border-slate-100 px-2 py-2 align-top">
                      <input
                        value={item.descripcion}
                        onChange={(event) => update(item.key, { descripcion: event.target.value })}
                        className={`${cellInput} min-w-[220px]`}
                        placeholder={
                          item.esSubitemInformativo
                            ? "Ej. Incluye carta de cócteles de autor..."
                            : "Descripción del servicio"
                        }
                        aria-label="Descripción"
                      />
                      <label className="mt-1 inline-flex cursor-pointer items-center gap-1.5 text-[10px] text-slate-400">
                        <input
                          type="checkbox"
                          checked={item.esSubitemInformativo}
                          onChange={(event) =>
                            update(item.key, {
                              esSubitemInformativo: event.target.checked,
                              precioUnitarioVenta: event.target.checked ? "" : item.precioUnitarioVenta,
                              costoUnitarioInterno: event.target.checked ? "" : item.costoUnitarioInterno,
                            })
                          }
                          className="h-3 w-3 rounded border-slate-300 accent-brand-600"
                        />
                        Texto informativo (no suma)
                      </label>
                    </td>
                    <td className="border-b border-slate-100 px-2 py-2 align-top">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unidades}
                        onChange={(event) => update(item.key, { unidades: event.target.value })}
                        className={`${cellInput} w-20`}
                        aria-label={mode === "plantilla" ? "Cantidad base" : "Unidades"}
                      />
                    </td>
                    <td className="border-b border-slate-100 px-2 py-2 align-top">
                      {item.esSubitemInformativo ? (
                        <span className="inline-flex h-8 items-center text-xs text-slate-300">—</span>
                      ) : (
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                            S/
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.precioUnitarioVenta}
                            onChange={(event) =>
                              update(item.key, { precioUnitarioVenta: event.target.value })
                            }
                            className={`${cellInput} w-28 pl-7`}
                            aria-label="Precio unitario"
                          />
                        </div>
                      )}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-2 text-right align-top">
                      <span className="inline-flex h-8 items-center text-xs font-semibold text-ink">
                        {item.esSubitemInformativo ? "—" : money(subtotal)}
                      </span>
                    </td>
                    {showCosts && (
                      <>
                        <td className="border-b border-amber-100 bg-amber-50/30 px-2 py-2 align-top">
                          {item.esSubitemInformativo ? (
                            <span className="inline-flex h-8 items-center text-xs text-slate-300">—</span>
                          ) : (
                            <div className="relative">
                              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-amber-700/60">
                                S/
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.costoUnitarioInterno}
                                onChange={(event) =>
                                  update(item.key, { costoUnitarioInterno: event.target.value })
                                }
                                className={`${cellInput} w-28 border-amber-200/80 bg-amber-50/40 pl-7 focus:border-amber-500 focus:ring-amber-500/10`}
                                aria-label="Costo unitario interno"
                              />
                            </div>
                          )}
                        </td>
                        <td className="border-b border-amber-100 bg-amber-50/30 px-3 py-2 text-right align-top">
                          <span
                            className={`inline-flex h-8 items-center text-[11px] font-semibold ${
                              item.esSubitemInformativo
                                ? "text-slate-300"
                                : margin >= 0
                                  ? "text-emerald-700"
                                  : "text-rose-600"
                            }`}
                          >
                            {item.esSubitemInformativo ? "—" : `${margin.toFixed(0)}%`}
                          </span>
                        </td>
                      </>
                    )}
                    <td className="border-b border-slate-100 px-1 py-2 align-top">
                      <button
                        type="button"
                        onClick={() => remove(item.key)}
                        className="btn-icon h-8 w-8 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        title="Quitar ítem"
                        aria-label="Quitar ítem"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <datalist id="mm-categorias">
        {categorias.map((categoria) => (
          <option key={categoria.id} value={categoria.nombre} />
        ))}
      </datalist>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-[10px] leading-relaxed text-slate-400">
          <Info className="h-3 w-3 shrink-0" />
          {mode === "plantilla"
            ? "Las cantidades se ajustan por invitado al aplicar la plantilla en una cotización."
            : "Las líneas informativas se muestran al cliente pero no afectan los totales."}
        </p>
        {items.length > 0 && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={addManual}>
            <Plus className="h-3.5 w-3.5" />
            Agregar línea
          </button>
        )}
      </div>

      <Modal
        open={pickerOpen}
        onClose={() => {
          setPickerOpen(false);
          setAdded(0);
        }}
        title="Agregar del catálogo"
        description="Precios y costos se toman del catálogo maestro. Puedes ajustarlos después en la tabla."
        size="lg"
        footer={
          <>
            <span className="mr-auto text-xs text-slate-500">
              {added > 0 ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
                  <Check className="h-3.5 w-3.5" />
                  {added} ítem(s) agregado(s)
                </span>
              ) : (
                "Selecciona los servicios que necesites"
              )}
            </span>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setPickerOpen(false);
                setAdded(0);
              }}
            >
              Listo
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={pickerSearch}
              onChange={(event) => setPickerSearch(event.target.value)}
              className="input pl-9"
              placeholder="Buscar por nombre, categoría o descripción..."
              autoFocus
            />
          </div>

          <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setPickerCategory("")}
              className={`chip shrink-0 ${pickerCategory === "" ? "chip-active" : ""}`}
            >
              Todas
            </button>
            {categorias.map((categoria) => (
              <button
                key={categoria.id}
                type="button"
                onClick={() => setPickerCategory(categoria.id)}
                className={`chip shrink-0 ${pickerCategory === categoria.id ? "chip-active" : ""}`}
              >
                {categoria.nombre}
              </button>
            ))}
          </div>

          <div className="max-h-[48vh] divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
            {filteredCatalog.length === 0 ? (
              <EmptyState
                compact
                title="Sin resultados"
                description="Prueba con otra búsqueda o categoría."
              />
            ) : (
              filteredCatalog.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 px-4 py-3 transition hover:bg-brand-50/30 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                        {item.categoriaNombre}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.unidadMedida ?? "unidad"} · {reglaLabels[item.reglaCantidad]}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] font-medium text-slate-800">{item.nombre}</p>
                    {item.descripcion && (
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">{item.descripcion}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="text-right">
                      <p className="text-xs font-semibold text-ink">{money(item.precioVenta)}</p>
                      <p className="text-[10px] text-amber-700/70">Costo {money(item.costoInterno)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addCatalogItem(item)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-200 bg-brand-50 text-brand-700 transition hover:border-brand-500 hover:bg-brand-500 hover:text-white"
                      title={`Agregar ${item.nombre}`}
                      aria-label={`Agregar ${item.nombre}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <p className="text-[10px] text-slate-400">
            {filteredCatalog.length} servicio(s) disponible(s) · los importes se expresan en soles (S/).
          </p>
        </div>
      </Modal>
    </div>
  );
}

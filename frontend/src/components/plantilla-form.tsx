"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Loader2, Save, Sparkles } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { CatalogoItem, Categoria, Plantilla, PlantillaRequest } from "@/lib/types";
import { money } from "@/lib/format";
import { computeTotals, itemFromPlantilla, type ItemDraft } from "@/lib/items";
import { tiposEvento } from "@/lib/constants";
import { ErrorBlock, Field, LoadingBlock, PageHeader } from "@/components/ui";
import { ItemsEditor } from "@/components/items-editor";
import { useToast } from "@/components/toast";

export function PlantillaForm({ plantilla }: { plantilla?: Plantilla }) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(plantilla);
  const [nombre, setNombre] = useState(plantilla?.nombre ?? "");
  const [tipoEvento, setTipoEvento] = useState(plantilla?.tipoEvento ?? "");
  const [descripcion, setDescripcion] = useState(plantilla?.descripcion ?? "");
  const [incluyeIgv, setIncluyeIgv] = useState(Boolean(plantilla?.incluyeIgv));
  const [activo, setActivo] = useState(plantilla ? plantilla.activo : true);
  const [items, setItems] = useState<ItemDraft[]>(() =>
    plantilla ? plantilla.detalles.map(itemFromPlantilla) : [],
  );
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [catalogo, setCatalogo] = useState<CatalogoItem[]>([]);
  const [igvPct, setIgvPct] = useState(18);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [categories, catalog, empresa] = await Promise.all([
        api.categorias.listar(),
        api.catalogo.listar(),
        api.empresa.obtener(),
      ]);
      setCategorias(categories);
      setCatalogo(catalog);
      setIgvPct(Number(empresa.igvPorcentaje) || 18);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "No se pudieron cargar los datos de la plantilla.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => computeTotals(items, incluyeIgv, igvPct, 0), [items, incluyeIgv, igvPct]);

  async function save() {
    setFormError("");
    if (!nombre.trim()) {
      setFormError("El nombre de la plantilla es obligatorio.");
      return;
    }
    if (!tipoEvento.trim()) {
      setFormError("Indica el tipo de evento de la plantilla.");
      return;
    }
    if (items.length === 0) {
      setFormError("Agrega al menos una línea a la plantilla.");
      return;
    }
    const incomplete = items.find((item) => !item.descripcion.trim() || !item.categoriaNombre.trim());
    if (incomplete) {
      setFormError("Completa la categoría y descripción de todas las líneas.");
      return;
    }

    const payload: PlantillaRequest = {
      nombre: nombre.trim(),
      tipoEvento: tipoEvento.trim(),
      descripcion: descripcion.trim() || null,
      incluyeIgv,
      activo,
      detalles: items.map((item, index) => ({
        catalogoItemId: item.catalogoItemId,
        categoriaNombre: item.categoriaNombre.trim(),
        descripcion: item.descripcion.trim(),
        cantidadBase: Number(item.unidades) || 1,
        precioVenta: item.esSubitemInformativo ? 0 : Number(item.precioUnitarioVenta) || 0,
        costoInterno: item.esSubitemInformativo ? 0 : Number(item.costoUnitarioInterno) || 0,
        esSubitem: item.esSubitemInformativo,
        orden: index,
      })),
    };

    setSaving(true);
    try {
      const saved = plantilla
        ? await api.plantillas.actualizar(plantilla.id, payload)
        : await api.plantillas.crear(payload);
      toast.success(
        plantilla ? "Plantilla actualizada correctamente." : `Plantilla “${saved.nombre}” creada.`,
      );
      router.push("/plantillas");
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(Object.values(err.fields ?? {})[0] ?? err.message);
      } else {
        setFormError("No se pudo guardar la plantilla.");
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
        eyebrow={isEdit ? "Editar plantilla" : "Nueva plantilla"}
        title={isEdit ? plantilla?.nombre ?? "Editar plantilla" : "Nueva plantilla de evento"}
        description="Define una base reutilizable de servicios. Al aplicarla en una cotización, las cantidades se ajustan a los invitados."
        actions={
          <>
            <Link href="/plantillas" className="btn btn-outline">
              <ArrowLeft className="h-4 w-4" />
              Cancelar
            </Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear plantilla"}
            </button>
          </>
        }
      />

      {formError && (
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {formError}
        </div>
      )}

      <div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="card card-pad">
            <h2 className="mb-5 font-serif text-xl text-ink">Datos de la plantilla</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre" required className="sm:col-span-2">
                <input
                  value={nombre}
                  onChange={(event) => setNombre(event.target.value)}
                  className="input"
                  placeholder="Boda Elegante, Quinceañero Completo..."
                  autoFocus
                />
              </Field>
              <Field label="Tipo de evento" required>
                <input
                  list="mm-tipos-plantilla"
                  value={tipoEvento}
                  onChange={(event) => setTipoEvento(event.target.value)}
                  className="input"
                  placeholder="Boda, Corporativo..."
                />
                <datalist id="mm-tipos-plantilla">
                  {tiposEvento.map((tipo) => (
                    <option key={tipo} value={tipo} />
                  ))}
                </datalist>
              </Field>
              <Field label="Incluye IGV">
                <select
                  value={incluyeIgv ? "si" : "no"}
                  onChange={(event) => setIncluyeIgv(event.target.value === "si")}
                  className="select"
                >
                  <option value="no">No incluir IGV</option>
                  <option value="si">Sí, aplicar IGV</option>
                </select>
              </Field>
              <Field label="Descripción" className="sm:col-span-2">
                <textarea
                  value={descripcion}
                  onChange={(event) => setDescripcion(event.target.value)}
                  className="textarea"
                  placeholder="Para qué tipo de evento funciona mejor esta plantilla..."
                />
              </Field>
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(event) => setActivo(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-brand-600"
                />
                Plantilla activa y disponible en el cotizador
              </label>
            </div>
          </section>

          <section className="card card-pad">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <h2 className="font-serif text-xl text-ink">Líneas de la plantilla</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Agrega servicios del catálogo o líneas manuales. Las cantidades son una base editable.
                </p>
              </div>
              <span className="badge bg-brand-50 text-brand-800 ring-brand-200">
                <Sparkles className="h-3.5 w-3.5" />
                {items.length} línea(s)
              </span>
            </div>
            <ItemsEditor
              items={items}
              onChange={setItems}
              categorias={categorias}
              catalogo={catalogo}
              invitados={0}
              mode="plantilla"
            />
          </section>
        </div>

        <div className="space-y-5 xl:sticky xl:top-24">
          <section className="card overflow-hidden">
            <div className="bg-ink px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-300">Base estimada</p>
              <p className="mt-1 font-serif text-lg text-white">{nombre || "Nueva plantilla"}</p>
            </div>
            <div className="space-y-3 p-5">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Subtotal base</span>
                <span className="font-medium text-slate-700">{money(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>IGV ({igvPct}%)</span>
                <span className="font-medium text-slate-700">{money(totals.igv)}</span>
              </div>
              <div className="divider-gold" />
              <div className="flex items-end justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total base</span>
                <span className="font-serif text-2xl text-ink">{money(totals.total)}</span>
              </div>
              <div className="rounded-xl border border-amber-200/70 bg-amber-50/50 p-3 text-[11px]">
                <div className="mb-1.5 flex justify-between text-amber-900/70">
                  <span>Costo neto</span>
                  <span className="font-medium">{money(totals.costo)}</span>
                </div>
                <div className="flex justify-between text-amber-900/70">
                  <span>Margen</span>
                  <span className="font-semibold text-emerald-700">{totals.margen.toFixed(1)}%</span>
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear plantilla"}
              </button>
              <p className="text-center text-[10px] leading-relaxed text-slate-400">
                Los importes son referenciales. Al aplicar la plantilla se toman los precios actuales del catálogo.
              </p>
            </div>
          </section>
        </div>
      </div>
    </form>
  );
}

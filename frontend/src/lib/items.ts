import type {
  CatalogoItem,
  CotizacionDetalle,
  PlantillaDetalle,
  PlantillaAplicada,
} from "./types";

export interface ItemDraft {
  key: string;
  catalogoItemId: number | null;
  categoriaNombre: string;
  descripcion: string;
  unidades: string;
  precioUnitarioVenta: string;
  costoUnitarioInterno: string;
  esSubitemInformativo: boolean;
}

let counter = 0;

export function newKey(prefix = "item"): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

export function blankItem(categoriaNombre = "", catalogoItemId: number | null = null): ItemDraft {
  return {
    key: newKey(),
    catalogoItemId,
    categoriaNombre,
    descripcion: "",
    unidades: "1",
    precioUnitarioVenta: "",
    costoUnitarioInterno: "",
    esSubitemInformativo: false,
  };
}

export function itemFromApplied(detalle: PlantillaAplicada["detalles"][number]): ItemDraft {
  return {
    key: newKey(),
    catalogoItemId: detalle.catalogoItemId ?? null,
    categoriaNombre: detalle.categoriaNombre,
    descripcion: detalle.descripcion,
    unidades: String(detalle.cantidad ?? 1),
    precioUnitarioVenta: detalle.esSubitem ? "" : String(detalle.precioVenta ?? 0),
    costoUnitarioInterno: detalle.esSubitem ? "" : String(detalle.costoInterno ?? 0),
    esSubitemInformativo: Boolean(detalle.esSubitem),
  };
}

export function itemFromCotizacion(detalle: CotizacionDetalle): ItemDraft {
  return {
    key: newKey(),
    catalogoItemId: null,
    categoriaNombre: detalle.categoriaNombre,
    descripcion: detalle.descripcion,
    unidades: String(detalle.unidades ?? 1),
    precioUnitarioVenta: detalle.esSubitemInformativo ? "" : String(detalle.precioUnitarioVenta ?? 0),
    costoUnitarioInterno: detalle.esSubitemInformativo ? "" : String(detalle.costoUnitarioInterno ?? 0),
    esSubitemInformativo: Boolean(detalle.esSubitemInformativo),
  };
}

export function itemFromPlantilla(detalle: PlantillaDetalle): ItemDraft {
  return {
    key: newKey(),
    catalogoItemId: detalle.catalogoItemId ?? null,
    categoriaNombre: detalle.categoriaNombre,
    descripcion: detalle.descripcion,
    unidades: String(detalle.cantidadBase ?? 1),
    precioUnitarioVenta: detalle.esSubitem ? "" : String(detalle.precioVenta ?? 0),
    costoUnitarioInterno: detalle.esSubitem ? "" : String(detalle.costoInterno ?? 0),
    esSubitemInformativo: Boolean(detalle.esSubitem),
  };
}

function num(value: string): number {
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function itemSubtotal(item: ItemDraft): number {
  if (item.esSubitemInformativo) return 0;
  return num(item.unidades) * num(item.precioUnitarioVenta);
}

export function itemCost(item: ItemDraft): number {
  if (item.esSubitemInformativo) return 0;
  return num(item.unidades) * num(item.costoUnitarioInterno);
}

export interface Totals {
  subtotal: number;
  igv: number;
  total: number;
  costo: number;
  ganancia: number;
  margen: number;
  ticket: number;
}

export function computeTotals(
  items: ItemDraft[],
  incluyeIgv: boolean,
  igvPorcentaje: number,
  invitados: number,
): Totals {
  let subtotal = 0;
  let costo = 0;
  for (const item of items) {
    if (item.esSubitemInformativo) continue;
    subtotal += itemSubtotal(item);
    costo += itemCost(item);
  }
  subtotal = Math.round(subtotal * 100) / 100;
  costo = Math.round(costo * 100) / 100;
  const igv = incluyeIgv ? Math.round(subtotal * igvPorcentaje) / 100 : 0;
  const total = Math.round((subtotal + igv) * 100) / 100;
  const ganancia = Math.round((subtotal - costo) * 100) / 100;
  const margen = subtotal > 0 ? (ganancia / subtotal) * 100 : 0;
  const ticket = invitados > 0 ? total / invitados : 0;
  return { subtotal, igv, total, costo, ganancia, margen, ticket };
}

export function validItems(items: ItemDraft[]): boolean {
  return items.some(
    (item) => !item.esSubitemInformativo && item.descripcion.trim() !== "" && Number(item.unidades) > 0,
  );
}

export function catalogToDraft(item: CatalogoItem, invitados: number): ItemDraft {
  const rule = item.reglaCantidad;
  let cantidad = 1;
  if (rule === "POR_INVITADO") cantidad = Math.max(1, invitados);
  else if (rule === "POR_MESA") cantidad = Math.max(1, Math.ceil(invitados / 8));
  else if (rule === "POR_MOZO") cantidad = Math.max(2, Math.ceil(invitados / 20));

  return {
    key: newKey("cat"),
    catalogoItemId: item.id,
    categoriaNombre: item.categoriaNombre,
    descripcion: item.nombre,
    unidades: String(cantidad),
    precioUnitarioVenta: String(item.precioVenta ?? 0),
    costoUnitarioInterno: String(item.costoInterno ?? 0),
    esSubitemInformativo: false,
  };
}

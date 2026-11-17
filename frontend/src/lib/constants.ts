import type { EstadoCotizacion } from "./types";

export const estadoStyles: Record<
  EstadoCotizacion,
  { badge: string; dot: string; bar: string; barSoft: string; text: string }
> = {
  BORRADOR: {
    badge: "bg-slate-100 text-slate-600 ring-slate-200",
    dot: "bg-slate-400",
    bar: "bg-slate-400",
    barSoft: "bg-slate-300/60",
    text: "text-slate-600",
  },
  ENVIADA: {
    badge: "bg-sky-50 text-sky-700 ring-sky-200",
    dot: "bg-sky-500",
    bar: "bg-sky-500",
    barSoft: "bg-sky-300/60",
    text: "text-sky-700",
  },
  APROBADA: {
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
    barSoft: "bg-emerald-300/60",
    text: "text-emerald-700",
  },
  RECHAZADA: {
    badge: "bg-rose-50 text-rose-700 ring-rose-200",
    dot: "bg-rose-500",
    bar: "bg-rose-500",
    barSoft: "bg-rose-300/60",
    text: "text-rose-700",
  },
};

export const estados: EstadoCotizacion[] = ["BORRADOR", "ENVIADA", "APROBADA", "RECHAZADA"];

export const tiposEvento = [
  "Boda",
  "Quinceañero",
  "Corporativo",
  "Infantil",
  "Cumpleaños",
  "Bodas de Plata",
  "Aniversario",
  "Graduación",
  "Otro",
];

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/cotizaciones", label: "Cotizaciones", icon: "cotizaciones" },
  { href: "/clientes", label: "Clientes", icon: "clientes" },
  { href: "/catalogo", label: "Catálogo", icon: "catalogo" },
  { href: "/plantillas", label: "Plantillas", icon: "plantillas" },
  { href: "/configuracion", label: "Configuración", icon: "configuracion" },
] as const;

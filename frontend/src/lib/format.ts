import type { EstadoCotizacion, ReglaCantidad, TipoCliente } from "./types";

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const longDateFormatter = new Intl.DateTimeFormat("es-PE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function money(value: number | string | null | undefined): string {
  const number = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(number) ? (number as number) : 0);
}

export function number(value: number | string | null | undefined): string {
  const parsed = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 }).format(
    Number.isFinite(parsed) ? (parsed as number) : 0,
  );
}

export function percent(value: number | null | undefined, decimals = 1): string {
  return `${(Number(value) || 0).toFixed(decimals)}%`;
}

/** Fecha ISO (yyyy-mm-dd) sin desfase de zona horaria. */
export function formatDate(iso?: string | null): string {
  if (!iso) return "Por definir";
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return iso;
  return dateFormatter.format(new Date(year, month - 1, day));
}

export function formatLongDate(iso?: string | null): string {
  if (!iso) return "Por definir";
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return iso;
  const formatted = longDateFormatter.format(new Date(year, month - 1, day));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return dateTimeFormatter.format(parsed);
}

export function todayISO(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

export function addDaysISO(iso: string, days: number): string {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function daysUntil(iso?: string | null): number | null {
  if (!iso) return null;
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;
  const target = new Date(year, month - 1, day).getTime();
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round((target - start) / 86_400_000);
}

export function initials(name: string): string {
  return name
    .replace(/[()]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function marginPercent(sale: number, cost: number): number {
  if (!sale) return 0;
  return ((sale - cost) / sale) * 100;
}

export function suggestedQuantity(rule: ReglaCantidad, guests: number): number {
  switch (rule) {
    case "POR_INVITADO":
      return Math.max(1, guests);
    case "POR_MESA":
      return Math.max(1, Math.ceil(guests / 8));
    case "POR_MOZO":
      return Math.max(2, Math.ceil(guests / 20));
    default:
      return 1;
  }
}

export const estadoLabels: Record<EstadoCotizacion, string> = {
  BORRADOR: "Borrador",
  ENVIADA: "Enviada",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
};

export const estadoDescriptions: Record<EstadoCotizacion, string> = {
  BORRADOR: "En preparación",
  ENVIADA: "Esperando respuesta",
  APROBADA: "Ganada",
  RECHAZADA: "No concretada",
};

export const tipoClienteLabels: Record<TipoCliente, string> = {
  SOCIAL: "Social",
  CORPORATIVO: "Corporativo",
};

export const reglaLabels: Record<ReglaCantidad, string> = {
  NINGUNA: "Cantidad manual",
  POR_INVITADO: "Por invitado",
  POR_MESA: "Por mesa (8)",
  POR_MOZO: "Por mozo (20)",
};

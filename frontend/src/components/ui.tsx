"use client";

import { useEffect, type ReactNode } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Loader2,
  X,
} from "lucide-react";
import { estadoLabels, tipoClienteLabels } from "@/lib/format";
import { estadoStyles } from "@/lib/constants";
import type { EstadoCotizacion, TipoCliente } from "@/lib/types";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="font-serif text-[28px] leading-tight text-ink sm:text-[32px]">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-500">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EstadoBadge({ estado, className = "" }: { estado: EstadoCotizacion; className?: string }) {
  const style = estadoStyles[estado];
  return (
    <span className={`badge ${style.badge} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {estadoLabels[estado]}
    </span>
  );
}

export function TipoClienteBadge({ tipo }: { tipo: TipoCliente }) {
  const corporate = tipo === "CORPORATIVO";
  return (
    <span
      className={`badge ${
        corporate
          ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
          : "bg-brand-50 text-brand-800 ring-brand-200"
      }`}
    >
      {tipoClienteLabels[tipo]}
    </span>
  );
}

export function Field({
  label,
  hint,
  required,
  children,
  className = "",
  htmlFor,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={className}>
      <label className="field-label" htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">{hint}</p>}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="animate-fade absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`animate-scale relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl ${widths[size]}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="font-serif text-xl text-ink">{title}</h2>
            {description && <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>}
          </div>
          <button type="button" className="btn-icon -mr-1 -mt-1 shrink-0" onClick={onClose} aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  loading = false,
  tone = "danger",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  tone?: "danger" | "primary";
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button
            type="button"
            className={`btn ${tone === "danger" ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            tone === "danger" ? "bg-rose-50 text-rose-600" : "bg-brand-50 text-brand-700"
          }`}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="pt-1 text-sm leading-relaxed text-slate-600">{description}</p>
      </div>
    </Modal>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 text-center ${compact ? "py-10" : "py-16"}`}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <p className="font-serif text-lg text-ink">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingBlock({ rows = 5, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-3 p-5 ${className}`} aria-label="Cargando">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <div className="skeleton h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-1/3" />
            <div className="skeleton h-3 w-1/2" />
          </div>
          <div className="skeleton h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

export function ErrorBlock({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <p className="font-serif text-lg text-ink">No se pudo cargar la información</p>
      <p className="mt-1 max-w-lg text-sm leading-relaxed text-slate-500">{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-outline mt-5" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  totalElements,
  onChange,
}: {
  page: number;
  totalPages: number;
  totalElements: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-between px-4 py-3 text-xs text-slate-500">
        <span>{totalElements} registro(s)</span>
      </div>
    );
  }

  const pages: number[] = [];
  const start = Math.max(0, Math.min(page - 2, totalPages - 5));
  for (let index = start; index < Math.min(start + 5, totalPages); index++) {
    pages.push(index);
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
      <span className="text-xs text-slate-500">
        {totalElements} registro(s) · página {page + 1} de {totalPages}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="btn-icon h-8 w-8"
          onClick={() => onChange(Math.max(0, page - 1))}
          disabled={page === 0}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={`h-8 min-w-8 rounded-lg px-2 text-xs font-semibold transition ${
              item === page
                ? "bg-ink text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {item + 1}
          </button>
        ))}
        <button
          type="button"
          className="btn-icon h-8 w-8"
          onClick={() => onChange(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

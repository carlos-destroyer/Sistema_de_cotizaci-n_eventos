"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  push: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<ToastVariant, string> = {
  success: "border-emerald-200 bg-white text-emerald-900",
  error: "border-rose-200 bg-white text-rose-900",
  info: "border-sky-200 bg-white text-sky-900",
};

const iconStyles: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />,
  error: <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500" />,
  info: <Info className="h-5 w-5 shrink-0 text-sky-500" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      const id = nextId.current++;
      setToasts((current) => [...current.slice(-3), { id, message, variant }]);
      window.setTimeout(() => remove(id), 4600);
    },
    [remove],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      push,
      success: (message) => push(message, "success"),
      error: (message) => push(message, "error"),
      info: (message) => push(message, "info"),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[80] flex w-[min(92vw,380px)] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`animate-rise pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-[0_18px_40px_-18px_rgba(15,26,43,0.45)] ${variantStyles[toast.variant]}`}
          >
            {iconStyles[toast.variant]}
            <p className="flex-1 leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => remove(toast.id)}
              className="rounded-md p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Cerrar notificación"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe usarse dentro de ToastProvider");
  }
  return context;
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Boxes,
  CalendarDays,
  FileText,
  LayoutDashboard,
  LayoutTemplate,
  Menu,
  Plus,
  Settings,
  Sparkles,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { useAuth } from "./auth-provider";
import { formatLongDate, todayISO } from "@/lib/format";
import { ToastProvider } from "./toast";

const icons = {
  dashboard: LayoutDashboard,
  cotizaciones: FileText,
  clientes: Users,
  catalogo: Boxes,
  plantillas: LayoutTemplate,
  configuracion: Settings,
  usuarios: UserCog,
} as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarContent({
  pathname,
  onNavigate,
  user,
  onLogout,
}: {
  pathname: string;
  onNavigate?: () => void;
  user: { nombre: string; rol: string } | null;
  onLogout: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 pb-6 pt-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand-400/50 bg-brand-400/10 font-serif text-[15px] font-semibold tracking-tight text-brand-200">
          M&amp;M
        </div>
        <div className="min-w-0">
          <p className="truncate font-serif text-[17px] leading-tight text-white">M&amp;M Eventos</p>
          <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.24em] text-brand-200/60">
            Cotizaciones
          </p>
        </div>
      </div>

      <div className="mx-5 divider-gold opacity-40" />

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        <p className="px-3 pb-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Gestión
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = icons[item.icon];
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                active
                  ? "bg-brand-400/15 text-brand-100"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              {active && (
                <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-brand-400" />
              )}
              <Icon
                className={`h-[18px] w-[18px] transition ${active ? "text-brand-300" : "text-slate-500 group-hover:text-slate-300"}`}
                strokeWidth={1.8}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="pt-6">
          <p className="px-3 pb-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Acción rápida
          </p>
          <Link
            href="/cotizaciones/nueva"
            onClick={onNavigate}
            className="flex items-center gap-2.5 rounded-xl border border-dashed border-brand-400/30 bg-brand-400/5 px-3 py-2.5 text-[13px] font-medium text-brand-200/90 transition hover:border-brand-400/60 hover:bg-brand-400/10"
          >
            <Sparkles className="h-4 w-4 text-brand-300" strokeWidth={1.8} />
            Nueva cotización
          </Link>
        </div>
      </nav>

      <div className="px-4 pb-5">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-400/15 text-xs font-semibold text-brand-200">
              {(user?.nombre ?? "MM").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-200">{user?.nombre ?? "Invitado"}</p>
              <p className="text-[10px] text-slate-500">{user?.rol === "ADMIN" ? "Administrador" : "Usuario"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[11px] font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

function sectionLabel(pathname: string) {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/cotizaciones/nueva")) return "Cotizaciones / Nueva";
  if (pathname.startsWith("/cotizaciones/")) return "Cotizaciones / Detalle";
  if (pathname.startsWith("/cotizaciones")) return "Cotizaciones";
  if (pathname.startsWith("/clientes")) return "Clientes";
  if (pathname.startsWith("/catalogo")) return "Catálogo";
  if (pathname.startsWith("/plantillas")) return "Plantillas";
  if (pathname.startsWith("/configuracion")) return "Configuración";
  return "M&M Eventos";
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(formatLongDate(todayISO()));
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="text-sm text-slate-500">Cargando sesión…</div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen lg:pl-[272px]">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] border-r border-white/5 bg-ink lg:block">
          <SidebarContent pathname={pathname} user={user} onLogout={logout} />
        </aside>

        <div
          className={`fixed inset-0 z-50 lg:hidden ${mobileOpen ? "" : "pointer-events-none"}`}
          aria-hidden={!mobileOpen}
        >
          <div
            className={`absolute inset-0 bg-ink/60 backdrop-blur-sm transition-opacity ${mobileOpen ? "opacity-100" : "opacity-0"}`}
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className={`absolute inset-y-0 left-0 w-[280px] bg-ink shadow-2xl transition-transform duration-300 ${
              mobileOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <button
              type="button"
              className="absolute right-3 top-3 rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
              onClick={() => setMobileOpen(false)}
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} user={user} onLogout={logout} />
          </aside>
        </div>

        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-paper/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="btn-icon -ml-1 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1">
              <p className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 sm:block">
                M&amp;M Eventos
              </p>
              <p className="truncate text-[13px] font-semibold text-slate-700 sm:text-sm">
                {sectionLabel(pathname)}
              </p>
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[11px] text-slate-500 md:flex">
              <CalendarDays className="h-3.5 w-3.5 text-brand-600" />
              <span suppressHydrationWarning>{today || "Hoy"}</span>
            </div>

            <Link href="/cotizaciones/nueva" className="btn btn-primary btn-sm h-9 px-3.5">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nueva cotización</span>
              <span className="sm:hidden">Nueva</span>
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}

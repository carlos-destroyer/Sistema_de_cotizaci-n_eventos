"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-brand-400/40 bg-brand-400/10 font-serif text-lg font-semibold text-brand-700">
            M&amp;M
          </div>
          <h1 className="font-serif text-2xl text-ink">M&amp;M Eventos</h1>
          <p className="mt-1 text-sm text-slate-500">Sistema de cotizaciones · Iniciar sesión</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="card card-pad space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Usuario</label>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Contraseña</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 ring-1 ring-rose-200">
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Ingresando…" : "Ingresar"}
          </button>

          <p className="text-center text-[11px] text-slate-400">
            Usuario por defecto: <span className="font-semibold">admin</span>
          </p>
        </form>
      </div>
    </div>
  );
}
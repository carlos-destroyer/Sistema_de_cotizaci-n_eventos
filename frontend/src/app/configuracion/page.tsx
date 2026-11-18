"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  FileText,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Percent,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Empresa } from "@/lib/types";
import { ErrorBlock, Field, LoadingBlock, PageHeader } from "@/components/ui";
import { useToast } from "@/components/toast";

interface CompanyForm {
  razonSocial: string;
  nombreComercial: string;
  ruc: string;
  telefono: string;
  email: string;
  direccion: string;
  sitioWeb: string;
  logoUrl: string;
  igvPorcentaje: string;
  terminosCondiciones: string;
}

const emptyForm: CompanyForm = {
  razonSocial: "",
  nombreComercial: "",
  ruc: "",
  telefono: "",
  email: "",
  direccion: "",
  sitioWeb: "",
  logoUrl: "",
  igvPorcentaje: "18",
  terminosCondiciones: "",
};

export default function ConfiguracionPage() {
  const toast = useToast();
  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const empresa = await api.empresa.obtener();
      setForm({
        razonSocial: empresa.razonSocial,
        nombreComercial: empresa.nombreComercial ?? "",
        ruc: empresa.ruc ?? "",
        telefono: empresa.telefono ?? "",
        email: empresa.email ?? "",
        direccion: empresa.direccion ?? "",
        sitioWeb: empresa.sitioWeb ?? "",
        logoUrl: empresa.logoUrl ?? "",
        igvPorcentaje: String(empresa.igvPorcentaje ?? 18),
        terminosCondiciones: empresa.terminosCondiciones ?? "",
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar la configuración.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const initials = useMemo(() => {
    const source = form.nombreComercial || form.razonSocial || "M&M";
    return source
      .replace(/[^\p{L}\p{N}\s&]/gu, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [form.nombreComercial, form.razonSocial]);

  async function save() {
    setFormError("");
    if (!form.razonSocial.trim()) {
      setFormError("La razón social es obligatoria.");
      return;
    }
    const igv = Number(form.igvPorcentaje);
    if (!Number.isFinite(igv) || igv < 0) {
      setFormError("El porcentaje de IGV debe ser un número mayor o igual a cero.");
      return;
    }
    setSaving(true);
    try {
      const payload: Omit<Empresa, "id" | "actualizadoEn"> = {
        razonSocial: form.razonSocial.trim(),
        nombreComercial: form.nombreComercial.trim() || null,
        ruc: form.ruc.trim() || null,
        telefono: form.telefono.trim() || null,
        email: form.email.trim() || null,
        direccion: form.direccion.trim() || null,
        sitioWeb: form.sitioWeb.trim() || null,
        logoUrl: form.logoUrl.trim() || null,
        igvPorcentaje: igv,
        terminosCondiciones: form.terminosCondiciones.trim() || null,
      };
      const updated = await api.empresa.actualizar(payload);
      setForm({
        razonSocial: updated.razonSocial,
        nombreComercial: updated.nombreComercial ?? "",
        ruc: updated.ruc ?? "",
        telefono: updated.telefono ?? "",
        email: updated.email ?? "",
        direccion: updated.direccion ?? "",
        sitioWeb: updated.sitioWeb ?? "",
        logoUrl: updated.logoUrl ?? "",
        igvPorcentaje: String(updated.igvPorcentaje ?? 18),
        terminosCondiciones: updated.terminosCondiciones ?? "",
      });
      toast.success("Configuración de la empresa actualizada.");
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(Object.values(err.fields ?? {})[0] ?? err.message);
      } else {
        setFormError("No se pudo guardar la configuración.");
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

  if (error) {
    return (
      <div className="card">
        <ErrorBlock message={error} onRetry={load} />
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
        eyebrow="Identidad y parámetros"
        title="Configuración"
        description="Define los datos que aparecerán en las propuestas exportadas y el porcentaje de IGV del sistema."
        actions={
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Guardando..." : "Guardar configuración"}
          </button>
        }
      />

      {formError && (
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {formError}
        </div>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="card card-pad">
            <div className="mb-5 flex items-center justify-between gap-2">
              <div>
                <h2 className="font-serif text-xl text-ink">Datos de la empresa</h2>
                <p className="mt-1 text-xs text-slate-500">Información legal y de contacto que se imprime en la propuesta.</p>
              </div>
              <Building2 className="h-5 w-5 text-brand-500" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Razón social" required className="sm:col-span-2">
                <input
                  value={form.razonSocial}
                  onChange={(event) => setForm({ ...form, razonSocial: event.target.value })}
                  className="input"
                  placeholder="M&M Eventos - by Mariella Martinez"
                />
              </Field>
              <Field label="Nombre comercial">
                <input
                  value={form.nombreComercial}
                  onChange={(event) => setForm({ ...form, nombreComercial: event.target.value })}
                  className="input"
                  placeholder="M&M Eventos"
                />
              </Field>
              <Field label="RUC">
                <input
                  value={form.ruc}
                  onChange={(event) => setForm({ ...form, ruc: event.target.value })}
                  className="input"
                  placeholder="10429138430"
                />
              </Field>
              <Field label="Teléfono">
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={form.telefono}
                    onChange={(event) => setForm({ ...form, telefono: event.target.value })}
                    className="input pl-9"
                    placeholder="900 000 000"
                  />
                </div>
              </Field>
              <Field label="Correo electrónico">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    className="input pl-9"
                    placeholder="contacto@mmeventos.pe"
                  />
                </div>
              </Field>
              <Field label="Dirección" className="sm:col-span-2">
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={form.direccion}
                    onChange={(event) => setForm({ ...form, direccion: event.target.value })}
                    className="input pl-9"
                    placeholder="Piura - Perú"
                  />
                </div>
              </Field>
              <Field label="Sitio web">
                <div className="relative">
                  <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={form.sitioWeb}
                    onChange={(event) => setForm({ ...form, sitioWeb: event.target.value })}
                    className="input pl-9"
                    placeholder="www.mmeventos.pe"
                  />
                </div>
              </Field>
              <Field label="URL del logo" hint="Opcional. Debe ser una URL pública accesible desde el navegador.">
                <input
                  value={form.logoUrl}
                  onChange={(event) => setForm({ ...form, logoUrl: event.target.value })}
                  className="input"
                  placeholder="https://..."
                />
              </Field>
            </div>
          </section>

          <section className="card card-pad">
            <div className="mb-5 flex items-center justify-between gap-2">
              <div>
                <h2 className="font-serif text-xl text-ink">Impuestos</h2>
                <p className="mt-1 text-xs text-slate-500">Parámetro usado para calcular el IGV en cada cotización.</p>
              </div>
              <Percent className="h-5 w-5 text-brand-500" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Porcentaje de IGV" required hint="Perú: 18%. Se aplica solo cuando la cotización marca “Incluir IGV”.">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.igvPorcentaje}
                    onChange={(event) => setForm({ ...form, igvPorcentaje: event.target.value })}
                    className="input pr-9"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    %
                  </span>
                </div>
              </Field>
              <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 text-[11px] leading-relaxed text-brand-800">
                <p className="mb-1 flex items-center gap-1.5 font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Cálculo automático
                </p>
                El IGV se suma al subtotal de los ítems no informativos. Los costos internos y la ganancia no
                forman parte de la base imponible.
              </div>
            </div>
          </section>

          <section className="card card-pad">
            <div className="mb-5 flex items-center justify-between gap-2">
              <div>
                <h2 className="font-serif text-xl text-ink">Términos y condiciones</h2>
                <p className="mt-1 text-xs text-slate-500">Texto legal que se incluye al final de la propuesta en PDF.</p>
              </div>
              <FileText className="h-5 w-5 text-brand-500" />
            </div>
            <Field label="Condiciones de la propuesta">
              <textarea
                value={form.terminosCondiciones}
                onChange={(event) => setForm({ ...form, terminosCondiciones: event.target.value })}
                className="textarea min-h-[140px]"
                placeholder="La cotización está sujeta a disponibilidad de fecha, personal y stock de mobiliario..."
              />
            </Field>
          </section>
        </div>

        <div className="space-y-5 xl:sticky xl:top-24">
          <section className="card overflow-hidden">
            <div className="bg-ink px-5 py-6 text-center text-white">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-brand-400/50 bg-brand-400/10 font-serif text-lg text-brand-200">
                {initials || "M&M"}
              </div>
              <p className="mt-3 font-serif text-lg leading-tight">{form.nombreComercial || "M&M Eventos"}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-brand-300/80">
                Propuesta de evento
              </p>
            </div>
            <div className="space-y-2 p-5 text-[11px] text-slate-500">
              <p className="font-medium text-slate-700">{form.razonSocial || "Razón social"}</p>
              {form.ruc && <p>RUC {form.ruc}</p>}
              {form.telefono && (
                <p className="flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-brand-600" />
                  {form.telefono}
                </p>
              )}
              {form.email && (
                <p className="flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-brand-600" />
                  <span className="truncate">{form.email}</span>
                </p>
              )}
              {form.direccion && (
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-brand-600" />
                  {form.direccion}
                </p>
              )}
              {form.sitioWeb && (
                <p className="flex items-center gap-1.5">
                  <Globe className="h-3 w-3 text-brand-600" />
                  {form.sitioWeb}
                </p>
              )}
              <div className="divider-gold my-2" />
              <p className="text-[10px] leading-relaxed text-slate-400">
                Vista previa de la identidad que acompaña cada PDF y Excel exportado.
              </p>
            </div>
          </section>

          <section className="card card-pad">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-600" />
              <h2 className="font-serif text-base text-ink">Sobre el sistema</h2>
            </div>
            <div className="space-y-2 text-[11px] text-slate-500">
              <div className="flex items-center justify-between">
                <span>Versión</span>
                <span className="font-medium text-slate-700">1.0.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span>API</span>
                <span className="max-w-[170px] truncate font-mono text-[10px] text-slate-500">{api.url}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>IGV actual</span>
                <span className="font-medium text-slate-700">{form.igvPorcentaje || 0}%</span>
              </div>
              <div className="flex items-center gap-1.5 pt-1 text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                M&amp;M Eventos · Piura, Perú
              </div>
            </div>
          </section>

          <button type="submit" className="btn btn-primary w-full" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Guardando..." : "Guardar configuración"}
          </button>
        </div>
      </div>
    </form>
  );
}

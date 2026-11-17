"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Cotizacion } from "@/lib/types";
import { CotizacionForm } from "@/components/cotizacion-form";
import { ErrorBlock, LoadingBlock, PageHeader } from "@/components/ui";

export default function EditarCotizacionPage() {
  const params = useParams<{ id: string }>();
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCotizacion(await api.cotizaciones.obtener(params.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar la cotización.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="card">
        <LoadingBlock rows={9} />
      </div>
    );
  }

  if (error || !cotizacion) {
    return (
      <div className="card">
        <PageHeader
          title="Editar cotización"
          actions={
            <Link href="/cotizaciones" className="btn btn-outline">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
          }
        />
        <ErrorBlock message={error || "Cotización no encontrada."} onRetry={load} />
      </div>
    );
  }

  return <CotizacionForm cotizacion={cotizacion} />;
}

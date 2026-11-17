"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Plantilla } from "@/lib/types";
import { PlantillaForm } from "@/components/plantilla-form";
import { ErrorBlock, LoadingBlock, PageHeader } from "@/components/ui";

export default function EditarPlantillaPage() {
  const params = useParams<{ id: string }>();
  const [plantilla, setPlantilla] = useState<Plantilla | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setPlantilla(await api.plantillas.obtener(params.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar la plantilla.");
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
        <LoadingBlock rows={8} />
      </div>
    );
  }

  if (error || !plantilla) {
    return (
      <div className="card">
        <PageHeader
          title="Editar plantilla"
          actions={
            <Link href="/plantillas" className="btn btn-outline">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
          }
        />
        <ErrorBlock message={error || "Plantilla no encontrada."} onRetry={load} />
      </div>
    );
  }

  return <PlantillaForm plantilla={plantilla} />;
}

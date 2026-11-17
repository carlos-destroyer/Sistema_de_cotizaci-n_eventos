package pe.mmeventos.cotizaciones.plantilla;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class PlantillaDtos {

    private PlantillaDtos() {
    }

    public record DetalleRequest(
            Long catalogoItemId,
            @NotBlank(message = "La categoría es obligatoria") String categoriaNombre,
            @NotBlank(message = "La descripción es obligatoria") String descripcion,
            @NotNull(message = "La cantidad base es obligatoria")
            @DecimalMin(value = "0.00", message = "La cantidad no puede ser negativa")
            BigDecimal cantidadBase,
            BigDecimal precioVenta,
            BigDecimal costoInterno,
            Boolean esSubitem,
            Integer orden) {
    }

    public record Request(
            @NotBlank(message = "El nombre de la plantilla es obligatorio")
            @Size(max = 160) String nombre,
            @NotBlank(message = "El tipo de evento es obligatorio")
            @Size(max = 80) String tipoEvento,
            String descripcion,
            Boolean incluyeIgv,
            Boolean activo,
            @Valid List<DetalleRequest> detalles) {
    }

    public record DetalleResponse(
            Long id,
            Long catalogoItemId,
            String categoriaNombre,
            String descripcion,
            BigDecimal cantidadBase,
            BigDecimal precioVenta,
            BigDecimal costoInterno,
            Boolean esSubitem,
            Integer orden) {
    }

    public record Response(
            Long id,
            String nombre,
            String tipoEvento,
            String descripcion,
            Boolean incluyeIgv,
            Boolean activo,
            LocalDateTime creadoEn,
            List<DetalleResponse> detalles) {
    }

    public record DetalleAplicado(
            Long catalogoItemId,
            String categoriaNombre,
            String descripcion,
            BigDecimal cantidad,
            BigDecimal precioVenta,
            BigDecimal costoInterno,
            Boolean esSubitem,
            Integer orden) {
    }

    public record AplicadaResponse(
            Long plantillaId,
            String nombre,
            Boolean incluyeIgv,
            List<DetalleAplicado> detalles) {
    }
}

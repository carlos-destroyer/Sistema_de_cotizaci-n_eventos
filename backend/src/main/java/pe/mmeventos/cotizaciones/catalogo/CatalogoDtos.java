package pe.mmeventos.cotizaciones.catalogo;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class CatalogoDtos {

    private CatalogoDtos() {
    }

    public record CategoriaRequest(
            @NotBlank(message = "El nombre de la categoría es obligatorio")
            @Size(max = 120) String nombre,
            Integer orden,
            Boolean activo) {
    }

    public record CategoriaResponse(
            Long id,
            String nombre,
            Integer orden,
            Boolean activo,
            long items) {
    }

    public record ItemRequest(
            @NotNull(message = "La categoría es obligatoria") Long categoriaId,
            @NotBlank(message = "El nombre del ítem es obligatorio")
            @Size(max = 180) String nombre,
            String descripcion,
            @Size(max = 40) String unidadMedida,
            @NotNull(message = "El precio de venta es obligatorio")
            @DecimalMin(value = "0.00", message = "El precio no puede ser negativo")
            BigDecimal precioVenta,
            @NotNull(message = "El costo interno es obligatorio")
            @DecimalMin(value = "0.00", message = "El costo no puede ser negativo")
            BigDecimal costoInterno,
            Integer stockReferencial,
            @NotNull(message = "La regla de cantidad es obligatoria")
            ReglaCantidad reglaCantidad,
            Boolean activo) {
    }

    public record ItemResponse(
            Long id,
            Long categoriaId,
            String categoriaNombre,
            String nombre,
            String descripcion,
            String unidadMedida,
            BigDecimal precioVenta,
            BigDecimal costoInterno,
            Integer stockReferencial,
            ReglaCantidad reglaCantidad,
            Boolean activo,
            LocalDateTime actualizadoEn) {
    }
}

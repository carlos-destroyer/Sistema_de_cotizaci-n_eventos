package pe.mmeventos.cotizaciones.cotizacion;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import pe.mmeventos.cotizaciones.cliente.TipoCliente;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public final class CotizacionDtos {

    private CotizacionDtos() {
    }

    public record DetalleRequest(
            @NotBlank(message = "La categoría es obligatoria") String categoriaNombre,
            @NotBlank(message = "La descripción es obligatoria") String descripcion,
            @NotNull(message = "Las unidades son obligatorias")
            @DecimalMin(value = "0.00", message = "Las unidades no pueden ser negativas")
            BigDecimal unidades,
            @NotNull(message = "El precio unitario es obligatorio")
            @DecimalMin(value = "0.00", message = "El precio no puede ser negativo")
            BigDecimal precioUnitarioVenta,
            @DecimalMin(value = "0.00", message = "El costo no puede ser negativo")
            BigDecimal costoUnitarioInterno,
            Boolean esSubitemInformativo,
            Integer orden) {
    }

    public record Request(
            @NotNull(message = "El cliente es obligatorio") Long clienteId,
            String codigo,
            LocalDate fechaEmision,
            LocalDate validoHasta,
            LocalDate fechaEvento,
            String localEvento,
            @NotNull(message = "La cantidad de invitados es obligatoria")
            @Min(value = 0, message = "La cantidad de invitados no puede ser negativa")
            Integer cantidadInvitados,
            String tipoEvento,
            String tematica,
            String paletaColores,
            Boolean incluyeIgv,
            String notasCortesia,
            String notasInternas,
            EstadoCotizacion estado,
            @NotEmpty(message = "Agrega al menos un ítem a la cotización")
            @Valid List<DetalleRequest> detalles) {
    }

    public record EstadoRequest(@NotNull(message = "El estado es obligatorio") EstadoCotizacion estado) {
    }

    public record DetalleResponse(
            Long id,
            String categoriaNombre,
            Integer orden,
            String descripcion,
            Boolean esSubitemInformativo,
            BigDecimal unidades,
            BigDecimal precioUnitarioVenta,
            BigDecimal subtotalVenta,
            BigDecimal costoUnitarioInterno,
            BigDecimal subtotalCostoInterno) {
    }

    public record Response(
            Long id,
            String codigo,
            Long clienteId,
            String clienteNombre,
            TipoCliente clienteTipo,
            String clienteDocumento,
            String clienteTelefono,
            String clienteEmail,
            LocalDate fechaEmision,
            LocalDate validoHasta,
            LocalDate fechaEvento,
            String localEvento,
            Integer cantidadInvitados,
            String tipoEvento,
            String tematica,
            String paletaColores,
            Boolean incluyeIgv,
            String notasCortesia,
            String notasInternas,
            EstadoCotizacion estado,
            Integer version,
            Long cotizacionOrigenId,
            String codigoOrigen,
            BigDecimal subtotalVenta,
            BigDecimal montoIgv,
            BigDecimal totalVenta,
            BigDecimal costoInternoTotal,
            BigDecimal gananciaEstimada,
            BigDecimal ticketPorPersona,
            LocalDateTime creadoEn,
            LocalDateTime actualizadoEn,
            List<DetalleResponse> detalles) {
    }

    public record ListItem(
            Long id,
            String codigo,
            Long clienteId,
            String clienteNombre,
            TipoCliente clienteTipo,
            LocalDate fechaEmision,
            LocalDate fechaEvento,
            String localEvento,
            Integer cantidadInvitados,
            String tipoEvento,
            EstadoCotizacion estado,
            BigDecimal totalVenta,
            BigDecimal gananciaEstimada,
            Integer version,
            LocalDateTime creadoEn) {
    }

    public record Totales(
            BigDecimal subtotalVenta,
            BigDecimal montoIgv,
            BigDecimal totalVenta,
            BigDecimal costoInternoTotal,
            BigDecimal gananciaEstimada,
            BigDecimal ticketPorPersona) {
    }
}

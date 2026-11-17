package pe.mmeventos.cotizaciones.empresa;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class EmpresaDtos {

    private EmpresaDtos() {
    }

    public record Request(
            @NotBlank(message = "La razón social es obligatoria")
            @Size(max = 200, message = "Máximo 200 caracteres")
            String razonSocial,
            @Size(max = 200) String nombreComercial,
            @Size(max = 20) String ruc,
            @Size(max = 40) String telefono,
            @Email(message = "Correo inválido") @Size(max = 120) String email,
            @Size(max = 250) String direccion,
            @Size(max = 150) String sitioWeb,
            @Size(max = 300) String logoUrl,
            @NotNull(message = "El porcentaje de IGV es obligatorio")
            @DecimalMin(value = "0.00", message = "El IGV no puede ser negativo")
            BigDecimal igvPorcentaje,
            String terminosCondiciones) {
    }

    public record Response(
            Long id,
            String razonSocial,
            String nombreComercial,
            String ruc,
            String telefono,
            String email,
            String direccion,
            String sitioWeb,
            String logoUrl,
            BigDecimal igvPorcentaje,
            String terminosCondiciones,
            LocalDateTime actualizadoEn) {
    }
}

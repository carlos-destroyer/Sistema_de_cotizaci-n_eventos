package pe.mmeventos.cotizaciones.cliente;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class ClienteDtos {

    private ClienteDtos() {
    }

    public record Request(
            @NotBlank(message = "El nombre o razón social es obligatorio")
            @Size(max = 200, message = "Máximo 200 caracteres")
            String nombreRazonSocial,
            @NotNull(message = "El tipo de cliente es obligatorio")
            TipoCliente tipoCliente,
            @Size(max = 20) String documento,
            @Size(max = 40) String telefono,
            @Email(message = "Correo inválido") @Size(max = 120) String email,
            @Size(max = 250) String direccion,
            String notas,
            Boolean activo) {
    }

    public record Response(
            Long id,
            String nombreRazonSocial,
            TipoCliente tipoCliente,
            String documento,
            String telefono,
            String email,
            String direccion,
            String notas,
            Boolean activo,
            LocalDateTime creadoEn) {
    }

    public record Option(Long id, String nombre, TipoCliente tipoCliente) {
    }
}

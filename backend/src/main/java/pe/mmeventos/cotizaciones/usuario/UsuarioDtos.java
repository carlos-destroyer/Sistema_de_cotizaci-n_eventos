package pe.mmeventos.cotizaciones.usuario;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class UsuarioDtos {

    public record LoginRequest(
            @NotBlank String username,
            @NotBlank String password
    ) {}

    public record LoginResponse(
            String token,
            String tipo,
            long expiraEn,
            UsuarioResponse usuario
    ) {}

    public record UsuarioResponse(
            Long id,
            String username,
            String nombre,
            String email,
            RolUsuario rol,
            boolean activo
    ) {
        public static UsuarioResponse from(Usuario u) {
            return new UsuarioResponse(u.getId(), u.getUsername(), u.getNombre(), u.getEmail(), u.getRol(), u.isActivo());
        }
    }

    public record UsuarioRequest(
            @NotBlank @Size(min = 3, max = 60) String username,
            @NotBlank @Size(min = 6, max = 120) String password,
            @NotBlank @Size(max = 150) String nombre,
            String email,
            RolUsuario rol,
            Boolean activo
    ) {}

    public record UsuarioUpdateRequest(
            @Size(min = 6, max = 120) String password,
            @Size(max = 150) String nombre,
            String email,
            RolUsuario rol,
            Boolean activo
    ) {}

    private UsuarioDtos() {}
}
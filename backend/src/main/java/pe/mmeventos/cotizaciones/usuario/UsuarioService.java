package pe.mmeventos.cotizaciones.usuario;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UsuarioService {

    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<Usuario> listar() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public Usuario obtener(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado."));
    }

    @Transactional
    public Usuario crear(UsuarioDtos.UsuarioRequest req) {
        if (repository.existsByUsernameIgnoreCase(req.username())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El nombre de usuario ya existe.");
        }
        if (req.email() != null && !req.email().isBlank() && repository.existsByEmailIgnoreCase(req.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El correo ya está en uso.");
        }
        Usuario u = Usuario.builder()
                .username(req.username().trim())
                .passwordHash(passwordEncoder.encode(req.password()))
                .nombre(req.nombre().trim())
                .email(blankToNull(req.email()))
                .rol(req.rol() != null ? req.rol() : RolUsuario.USUARIO)
                .activo(req.activo() != null ? req.activo() : true)
                .build();
        return repository.save(u);
    }

    @Transactional
    public Usuario actualizar(Long id, UsuarioDtos.UsuarioUpdateRequest req) {
        Usuario u = obtener(id);
        if (req.password() != null && !req.password().isBlank()) {
            u.setPasswordHash(passwordEncoder.encode(req.password()));
        }
        if (req.nombre() != null && !req.nombre().isBlank()) {
            u.setNombre(req.nombre().trim());
        }
        if (req.email() != null) {
            String email = blankToNull(req.email());
            if (email != null && repository.existsByEmailIgnoreCase(email) && !email.equalsIgnoreCase(u.getEmail())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "El correo ya está en uso.");
            }
            u.setEmail(email);
        }
        if (req.rol() != null) {
            u.setRol(req.rol());
        }
        if (req.activo() != null) {
            u.setActivo(req.activo());
        }
        return repository.save(u);
    }

    @Transactional
    public void eliminar(Long id) {
        Usuario u = obtener(id);
        repository.delete(u);
    }

    private String blankToNull(String v) {
        if (v == null || v.isBlank()) return null;
        return v.trim();
    }
}
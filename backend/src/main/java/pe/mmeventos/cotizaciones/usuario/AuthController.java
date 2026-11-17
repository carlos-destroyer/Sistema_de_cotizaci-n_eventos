package pe.mmeventos.cotizaciones.usuario;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UsuarioRepository repository;

    public AuthController(AuthService authService, UsuarioRepository repository) {
        this.authService = authService;
        this.repository = repository;
    }

    @PostMapping("/login")
    public ResponseEntity<UsuarioDtos.LoginResponse> login(@Valid @RequestBody UsuarioDtos.LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioDtos.UsuarioResponse> me(Authentication authentication) {
        Usuario u = repository.findByUsernameIgnoreCase(authentication.getName())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Usuario no encontrado."));
        return ResponseEntity.ok(UsuarioDtos.UsuarioResponse.from(u));
    }
}
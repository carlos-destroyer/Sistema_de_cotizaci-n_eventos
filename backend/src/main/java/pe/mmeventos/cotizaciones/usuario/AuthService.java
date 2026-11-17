package pe.mmeventos.cotizaciones.usuario;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UsuarioRepository repository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public UsuarioDtos.LoginResponse login(UsuarioDtos.LoginRequest req) {
        Usuario u = repository.findByUsernameIgnoreCase(req.username())
                .orElseThrow(() -> new BadCredentialsException("Credenciales inválidas."));
        if (!u.isActivo()) {
            throw new BadCredentialsException("El usuario está desactivado.");
        }
        if (!passwordEncoder.matches(req.password(), u.getPasswordHash())) {
            throw new BadCredentialsException("Credenciales inválidas.");
        }
        String token = jwtService.generate(u);
        return new UsuarioDtos.LoginResponse(token, "Bearer", jwtService.getExpirationMs() / 1000,
                UsuarioDtos.UsuarioResponse.from(u));
    }
}
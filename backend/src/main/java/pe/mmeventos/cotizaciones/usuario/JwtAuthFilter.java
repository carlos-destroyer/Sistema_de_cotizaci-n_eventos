package pe.mmeventos.cotizaciones.usuario;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UsuarioRepository repository;

    public JwtAuthFilter(JwtService jwtService, UsuarioRepository repository) {
        this.jwtService = jwtService;
        this.repository = repository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                var claims = jwtService.parse(token);
                String username = claims.getSubject();
                repository.findByUsernameIgnoreCase(username).ifPresent(u -> {
                    if (u.isActivo()) {
                        var auth = new UsernamePasswordAuthenticationToken(
                                u.getUsername(), null,
                                java.util.List.of(new SimpleGrantedAuthority("ROLE_" + u.getRol().name())));
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    }
                });
            } catch (Exception ignored) {
                // token inválido: se deja sin autenticación
            }
        }
        filterChain.doFilter(request, response);
    }
}
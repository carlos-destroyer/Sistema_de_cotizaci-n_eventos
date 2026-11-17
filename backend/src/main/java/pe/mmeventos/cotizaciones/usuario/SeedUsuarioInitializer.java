package pe.mmeventos.cotizaciones.usuario;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = true)
public class SeedUsuarioInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SeedUsuarioInitializer.class);

    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;

    public SeedUsuarioInitializer(UsuarioRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (repository.existsByUsernameIgnoreCase("admin")) {
            return;
        }
        Usuario admin = Usuario.builder()
                .username("admin")
                .passwordHash(passwordEncoder.encode("admin123"))
                .nombre("Administrador M&M Eventos")
                .email("admin@mmeventos.local")
                .rol(RolUsuario.ADMIN)
                .activo(true)
                .build();
        repository.save(admin);
        log.info("Usuario administrador creado: admin / admin123");
    }
}
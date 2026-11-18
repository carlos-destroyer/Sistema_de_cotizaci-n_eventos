package pe.mmeventos.cotizaciones.usuario;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = true)
public class SeedUsuarioInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SeedUsuarioInitializer.class);

    @Value("${app.seed.admin.username:admin}")
    private String adminUsername;
    @Value("${app.seed.admin.password:admin123}")
    private String adminPassword;
    @Value("${app.seed.admin.nombre:Administrador M&M Eventos}")
    private String adminNombre;
    @Value("${app.seed.admin.email:admin@demo.local}")
    private String adminEmail;
    @Value("${app.seed.admin.rol:ADMIN}")
    private String adminRol;

    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;

    public SeedUsuarioInitializer(UsuarioRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (repository.existsByUsernameIgnoreCase(adminUsername)) {
            return;
        }
        Usuario admin = Usuario.builder()
                .username(adminUsername)
                .passwordHash(passwordEncoder.encode(adminPassword))
                .nombre(adminNombre)
                .email(adminEmail)
                .rol(RolUsuario.valueOf(adminRol))
                .activo(true)
                .build();
        repository.save(admin);
        log.info("Usuario administrador creado: {}", adminUsername);
    }
}
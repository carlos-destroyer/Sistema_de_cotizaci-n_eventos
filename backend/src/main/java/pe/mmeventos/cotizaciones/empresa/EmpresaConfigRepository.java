package pe.mmeventos.cotizaciones.empresa;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EmpresaConfigRepository extends JpaRepository<EmpresaConfig, Long> {
    Optional<EmpresaConfig> findFirstByOrderByIdAsc();
}

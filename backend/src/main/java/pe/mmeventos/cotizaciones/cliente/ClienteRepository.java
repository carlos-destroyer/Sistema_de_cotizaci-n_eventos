package pe.mmeventos.cotizaciones.cliente;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    List<Cliente> findAllByOrderByNombreRazonSocialAsc();
    List<Cliente> findAllByActivoTrueOrderByNombreRazonSocialAsc();
    long countByActivoTrue();
}

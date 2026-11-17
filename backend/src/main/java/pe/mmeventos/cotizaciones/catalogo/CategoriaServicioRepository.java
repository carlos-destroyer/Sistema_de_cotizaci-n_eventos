package pe.mmeventos.cotizaciones.catalogo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoriaServicioRepository extends JpaRepository<CategoriaServicio, Long> {
    List<CategoriaServicio> findAllByOrderByOrdenAscNombreAsc();
    List<CategoriaServicio> findAllByActivoTrueOrderByOrdenAscNombreAsc();
    boolean existsByNombreIgnoreCase(String nombre);
}

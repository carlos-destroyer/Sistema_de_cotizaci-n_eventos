package pe.mmeventos.cotizaciones.plantilla;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PlantillaEventoRepository extends JpaRepository<PlantillaEvento, Long> {
    List<PlantillaEvento> findAllByOrderByNombreAsc();
    List<PlantillaEvento> findAllByActivoTrueOrderByNombreAsc();
}

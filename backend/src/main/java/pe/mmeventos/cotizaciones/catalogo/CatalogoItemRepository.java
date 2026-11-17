package pe.mmeventos.cotizaciones.catalogo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CatalogoItemRepository extends JpaRepository<CatalogoItem, Long> {
    List<CatalogoItem> findAllByOrderByCategoriaOrdenAscNombreAsc();
    List<CatalogoItem> findAllByActivoTrueOrderByCategoriaOrdenAscNombreAsc();
    List<CatalogoItem> findAllByCategoriaIdOrderByNombreAsc(Long categoriaId);
    long countByCategoriaId(Long categoriaId);
}

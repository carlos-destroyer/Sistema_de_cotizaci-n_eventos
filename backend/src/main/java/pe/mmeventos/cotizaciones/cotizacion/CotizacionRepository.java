package pe.mmeventos.cotizaciones.cotizacion;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CotizacionRepository extends JpaRepository<Cotizacion, Long>, JpaSpecificationExecutor<Cotizacion> {

    @Override
    @EntityGraph(attributePaths = {"cliente"})
    Page<Cotizacion> findAll(org.springframework.data.jpa.domain.Specification<Cotizacion> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"cliente"})
    @Query("select c from Cotizacion c where c.id = :id")
    Optional<Cotizacion> findWithClienteById(@Param("id") Long id);

    Optional<Cotizacion> findTopByCodigoStartingWithOrderByCodigoDesc(String prefix);

    boolean existsByCodigo(String codigo);

    @Query("""
            select c.codigo
            from Cotizacion c
            where c.codigo like concat(:prefix, '%') and c.codigo not like '%-V%'
            order by c.codigo desc
            """)
    List<String> findCodigosBase(@Param("prefix") String prefix, Pageable pageable);

    @EntityGraph(attributePaths = {"cliente"})
    List<Cotizacion> findByCotizacionOrigenIdOrderByVersionDesc(Long origenId);

    long countByEstado(EstadoCotizacion estado);

    long countByFechaEmisionBetween(LocalDate desde, LocalDate hasta);

    long countByEstadoAndFechaEmisionBetween(EstadoCotizacion estado, LocalDate desde, LocalDate hasta);

    @Query("""
            select coalesce(sum(c.totalVenta), 0)
            from Cotizacion c
            where c.estado in :estados and c.fechaEmision between :desde and :hasta
            """)
    BigDecimal sumTotalVentaByEstadosAndRango(
            @Param("estados") List<EstadoCotizacion> estados,
            @Param("desde") LocalDate desde,
            @Param("hasta") LocalDate hasta);

    @Query("""
            select coalesce(sum(c.gananciaEstimada), 0)
            from Cotizacion c
            where c.estado = :estado
            """)
    BigDecimal sumGananciaByEstado(@Param("estado") EstadoCotizacion estado);

    @Query("""
            select coalesce(sum(c.gananciaEstimada), 0)
            from Cotizacion c
            where c.estado in :estados
            """)
    BigDecimal sumGananciaByEstados(@Param("estados") List<EstadoCotizacion> estados);

    @Query("""
            select coalesce(sum(c.totalVenta), 0)
            from Cotizacion c
            where c.estado = :estado
            """)
    BigDecimal sumTotalVentaByEstado(@Param("estado") EstadoCotizacion estado);

    @Query("""
            select c
            from Cotizacion c
            join fetch c.cliente
            where c.fechaEvento >= :hoy and c.estado <> :rechazada
            order by c.fechaEvento asc
            """)
    List<Cotizacion> findProximosEventos(
            @Param("hoy") LocalDate hoy,
            @Param("rechazada") EstadoCotizacion rechazada,
            Pageable pageable);

    @Query("""
            select c
            from Cotizacion c
            join fetch c.cliente
            order by c.creadoEn desc
            """)
    List<Cotizacion> findRecientes(Pageable pageable);

    @Query("""
            select c.fechaEmision, c.totalVenta, c.estado
            from Cotizacion c
            where c.fechaEmision between :desde and :hasta
            """)
    List<Object[]> findResumenPorFecha(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);

    @Query("""
            select d.categoriaNombre, coalesce(sum(d.subtotalVenta), 0)
            from CotizacionDetalle d
            where d.cotizacion.estado <> :rechazada and d.esSubitemInformativo = false
            group by d.categoriaNombre
            order by sum(d.subtotalVenta) desc
            """)
    List<Object[]> findTopCategorias(@Param("rechazada") EstadoCotizacion rechazada, Pageable pageable);
}

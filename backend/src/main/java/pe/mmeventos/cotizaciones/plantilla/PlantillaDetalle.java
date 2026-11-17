package pe.mmeventos.cotizaciones.plantilla;

import java.math.BigDecimal;

import pe.mmeventos.cotizaciones.catalogo.CatalogoItem;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "plantilla_detalles")
@Getter
@Setter
@NoArgsConstructor
public class PlantillaDetalle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plantilla_id", nullable = false)
    private PlantillaEvento plantilla;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "catalogo_item_id")
    private CatalogoItem catalogoItem;

    @Column(name = "categoria_nombre", nullable = false, length = 120)
    private String categoriaNombre;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "cantidad_base", nullable = false, precision = 12, scale = 2)
    private BigDecimal cantidadBase = BigDecimal.ONE;

    @Column(name = "precio_venta", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioVenta = BigDecimal.ZERO;

    @Column(name = "costo_interno", nullable = false, precision = 12, scale = 2)
    private BigDecimal costoInterno = BigDecimal.ZERO;

    @Column(name = "es_subitem", nullable = false)
    private Boolean esSubitem = false;

    @Column(nullable = false)
    private Integer orden = 0;
}

package pe.mmeventos.cotizaciones.cotizacion;

import java.math.BigDecimal;

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
@Table(name = "cotizacion_detalles")
@Getter
@Setter
@NoArgsConstructor
public class CotizacionDetalle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cotizacion_id", nullable = false)
    private Cotizacion cotizacion;

    @Column(name = "categoria_nombre", nullable = false, length = 120)
    private String categoriaNombre;

    @Column(nullable = false)
    private Integer orden = 0;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "es_subitem_informativo", nullable = false)
    private Boolean esSubitemInformativo = false;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal unidades = BigDecimal.ONE;

    @Column(name = "precio_unitario_venta", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioUnitarioVenta = BigDecimal.ZERO;

    @Column(name = "subtotal_venta", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotalVenta = BigDecimal.ZERO;

    @Column(name = "costo_unitario_interno", nullable = false, precision = 12, scale = 2)
    private BigDecimal costoUnitarioInterno = BigDecimal.ZERO;

    @Column(name = "subtotal_costo_interno", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotalCostoInterno = BigDecimal.ZERO;
}

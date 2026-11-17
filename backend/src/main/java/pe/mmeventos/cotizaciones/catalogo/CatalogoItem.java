package pe.mmeventos.cotizaciones.catalogo;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "catalogo_items")
@Getter
@Setter
@NoArgsConstructor
public class CatalogoItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "categoria_id", nullable = false)
    private CategoriaServicio categoria;

    @Column(nullable = false, length = 180)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "unidad_medida", nullable = false, length = 40)
    private String unidadMedida = "Unidad";

    @Column(name = "precio_venta", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioVenta = BigDecimal.ZERO;

    @Column(name = "costo_interno", nullable = false, precision = 12, scale = 2)
    private BigDecimal costoInterno = BigDecimal.ZERO;

    @Column(name = "stock_referencial")
    private Integer stockReferencial;

    @Enumerated(EnumType.STRING)
    @Column(name = "regla_cantidad", nullable = false, length = 20)
    private ReglaCantidad reglaCantidad = ReglaCantidad.NINGUNA;

    @Column(nullable = false)
    private Boolean activo = true;

    @Column(name = "creado_en", nullable = false)
    private LocalDateTime creadoEn = LocalDateTime.now();

    @Column(name = "actualizado_en", nullable = false)
    private LocalDateTime actualizadoEn = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.actualizadoEn = LocalDateTime.now();
    }
}

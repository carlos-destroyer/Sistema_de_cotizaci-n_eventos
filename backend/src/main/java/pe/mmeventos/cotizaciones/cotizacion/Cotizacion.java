package pe.mmeventos.cotizaciones.cotizacion;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import pe.mmeventos.cotizaciones.cliente.Cliente;
import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "cotizaciones")
@Getter
@Setter
@NoArgsConstructor
public class Cotizacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String codigo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @Column(name = "fecha_emision", nullable = false)
    private LocalDate fechaEmision = LocalDate.now();

    @Column(name = "valido_hasta")
    private LocalDate validoHasta;

    @Column(name = "fecha_evento")
    private LocalDate fechaEvento;

    @Column(name = "local_evento", length = 220)
    private String localEvento;

    @Column(name = "cantidad_invitados", nullable = false)
    private Integer cantidadInvitados = 0;

    @Column(name = "tipo_evento", length = 80)
    private String tipoEvento;

    @Column(length = 220)
    private String tematica;

    @Column(name = "paleta_colores", length = 220)
    private String paletaColores;

    @Column(name = "incluye_igv", nullable = false)
    private Boolean incluyeIgv = false;

    @Column(name = "notas_cortesia", columnDefinition = "TEXT")
    private String notasCortesia;

    @Column(name = "notas_internas", columnDefinition = "TEXT")
    private String notasInternas;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoCotizacion estado = EstadoCotizacion.BORRADOR;

    @Column(nullable = false)
    private Integer version = 1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cotizacion_origen_id")
    private Cotizacion cotizacionOrigen;

    @Column(name = "subtotal_venta", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotalVenta = BigDecimal.ZERO;

    @Column(name = "monto_igv", nullable = false, precision = 12, scale = 2)
    private BigDecimal montoIgv = BigDecimal.ZERO;

    @Column(name = "total_venta", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalVenta = BigDecimal.ZERO;

    @Column(name = "costo_interno_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal costoInternoTotal = BigDecimal.ZERO;

    @Column(name = "ganancia_estimada", nullable = false, precision = 12, scale = 2)
    private BigDecimal gananciaEstimada = BigDecimal.ZERO;

    @Column(name = "ticket_por_persona", nullable = false, precision = 12, scale = 2)
    private BigDecimal ticketPorPersona = BigDecimal.ZERO;

    @Column(name = "creado_en", nullable = false)
    private LocalDateTime creadoEn = LocalDateTime.now();

    @Column(name = "actualizado_en", nullable = false)
    private LocalDateTime actualizadoEn = LocalDateTime.now();

    @OneToMany(mappedBy = "cotizacion", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orden ASC")
    private List<CotizacionDetalle> detalles = new ArrayList<>();

    @PreUpdate
    public void preUpdate() {
        this.actualizadoEn = LocalDateTime.now();
    }

    public void addDetalle(CotizacionDetalle detalle) {
        detalle.setCotizacion(this);
        this.detalles.add(detalle);
    }

    public void reemplazarDetalles(List<CotizacionDetalle> nuevos) {
        this.detalles.clear();
        nuevos.forEach(this::addDetalle);
    }
}

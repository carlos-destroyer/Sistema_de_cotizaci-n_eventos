package pe.mmeventos.cotizaciones.empresa;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "empresa_config")
@Getter
@Setter
@NoArgsConstructor
public class EmpresaConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "razon_social", nullable = false, length = 200)
    private String razonSocial;

    @Column(name = "nombre_comercial", length = 200)
    private String nombreComercial;

    @Column(length = 20)
    private String ruc;

    @Column(length = 40)
    private String telefono;

    @Column(length = 120)
    private String email;

    @Column(length = 250)
    private String direccion;

    @Column(name = "sitio_web", length = 150)
    private String sitioWeb;

    @Column(name = "logo_url", length = 300)
    private String logoUrl;

    @Column(name = "igv_porcentaje", nullable = false, precision = 5, scale = 2)
    private BigDecimal igvPorcentaje = new BigDecimal("18.00");

    @Column(name = "terminos_condiciones", columnDefinition = "TEXT")
    private String terminosCondiciones;

    @Column(name = "actualizado_en", nullable = false)
    private LocalDateTime actualizadoEn = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.actualizadoEn = LocalDateTime.now();
    }
}

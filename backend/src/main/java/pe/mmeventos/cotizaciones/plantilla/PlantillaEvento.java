package pe.mmeventos.cotizaciones.plantilla;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "plantillas_evento")
@Getter
@Setter
@NoArgsConstructor
public class PlantillaEvento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String nombre;

    @Column(name = "tipo_evento", nullable = false, length = 80)
    private String tipoEvento;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "incluye_igv", nullable = false)
    private Boolean incluyeIgv = false;

    @Column(nullable = false)
    private Boolean activo = true;

    @Column(name = "creado_en", nullable = false)
    private LocalDateTime creadoEn = LocalDateTime.now();

    @OneToMany(mappedBy = "plantilla", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orden ASC")
    private List<PlantillaDetalle> detalles = new ArrayList<>();

    public void addDetalle(PlantillaDetalle detalle) {
        detalle.setPlantilla(this);
        this.detalles.add(detalle);
    }
}

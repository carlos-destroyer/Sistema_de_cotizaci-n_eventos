package pe.mmeventos.cotizaciones.cliente;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "clientes")
@Getter
@Setter
@NoArgsConstructor
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre_razon_social", nullable = false, length = 200)
    private String nombreRazonSocial;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_cliente", nullable = false, length = 20)
    private TipoCliente tipoCliente = TipoCliente.SOCIAL;

    @Column(length = 20)
    private String documento;

    @Column(length = 40)
    private String telefono;

    @Column(length = 120)
    private String email;

    @Column(length = 250)
    private String direccion;

    @Column(columnDefinition = "TEXT")
    private String notas;

    @Column(nullable = false)
    private Boolean activo = true;

    @Column(name = "creado_en", nullable = false)
    private LocalDateTime creadoEn = LocalDateTime.now();
}

package pe.mmeventos.cotizaciones.empresa;

import java.math.BigDecimal;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import pe.mmeventos.cotizaciones.common.NotFoundException;

@Service
public class EmpresaConfigService {

    private final EmpresaConfigRepository repository;

    @Value("${app.seed.empresa.razon-social:M&M Eventos - by Mariella Martinez}")
    private String defaultRazonSocial;
    @Value("${app.seed.empresa.nombre-comercial:M&M Eventos}")
    private String defaultNombreComercial;
    @Value("${app.seed.empresa.ruc:10429138430}")
    private String defaultRuc;
    @Value("${app.seed.empresa.telefono:900 000 000}")
    private String defaultTelefono;
    @Value("${app.seed.empresa.igv:18.00}")
    private String defaultIgv;

    public EmpresaConfigService(EmpresaConfigRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public EmpresaDtos.Response obtener() {
        EmpresaConfig config = repository.findFirstByOrderByIdAsc()
                .orElseThrow(() -> new NotFoundException("No existe configuración de la empresa"));
        return map(config);
    }

    @Transactional(readOnly = true)
    public EmpresaConfig obtenerEntidad() {
        return repository.findFirstByOrderByIdAsc()
                .orElseGet(this::configPorDefecto);
    }

    @Transactional
    public EmpresaDtos.Response actualizar(EmpresaDtos.Request request) {
        EmpresaConfig config = repository.findFirstByOrderByIdAsc()
                .orElseGet(EmpresaConfig::new);
        config.setRazonSocial(request.razonSocial().trim());
        config.setNombreComercial(request.nombreComercial());
        config.setRuc(request.ruc());
        config.setTelefono(request.telefono());
        config.setEmail(request.email());
        config.setDireccion(request.direccion());
        config.setSitioWeb(request.sitioWeb());
        config.setLogoUrl(request.logoUrl());
        config.setIgvPorcentaje(request.igvPorcentaje() == null ? new BigDecimal("18.00") : request.igvPorcentaje());
        config.setTerminosCondiciones(request.terminosCondiciones());
        return map(repository.save(config));
    }

    private EmpresaConfig configPorDefecto() {
        EmpresaConfig config = new EmpresaConfig();
        config.setRazonSocial(defaultRazonSocial);
        config.setNombreComercial(defaultNombreComercial);
        config.setRuc(defaultRuc);
        config.setTelefono(defaultTelefono);
        config.setDireccion("Piura - Perú");
        config.setIgvPorcentaje(new BigDecimal(defaultIgv));
        return config;
    }

    private EmpresaDtos.Response map(EmpresaConfig c) {
        return new EmpresaDtos.Response(
                c.getId(), c.getRazonSocial(), c.getNombreComercial(), c.getRuc(), c.getTelefono(),
                c.getEmail(), c.getDireccion(), c.getSitioWeb(), c.getLogoUrl(), c.getIgvPorcentaje(),
                c.getTerminosCondiciones(), c.getActualizadoEn());
    }
}

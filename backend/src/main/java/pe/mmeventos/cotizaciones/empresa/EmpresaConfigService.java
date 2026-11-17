package pe.mmeventos.cotizaciones.empresa;

import java.math.BigDecimal;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import pe.mmeventos.cotizaciones.common.NotFoundException;

@Service
public class EmpresaConfigService {

    private final EmpresaConfigRepository repository;

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
        config.setRazonSocial("M&M Eventos - by Mariella Martinez");
        config.setNombreComercial("M&M Eventos");
        config.setRuc("10429138430");
        config.setTelefono("939 811 591");
        config.setDireccion("Piura - Perú");
        config.setIgvPorcentaje(new BigDecimal("18.00"));
        return config;
    }

    private EmpresaDtos.Response map(EmpresaConfig c) {
        return new EmpresaDtos.Response(
                c.getId(), c.getRazonSocial(), c.getNombreComercial(), c.getRuc(), c.getTelefono(),
                c.getEmail(), c.getDireccion(), c.getSitioWeb(), c.getLogoUrl(), c.getIgvPorcentaje(),
                c.getTerminosCondiciones(), c.getActualizadoEn());
    }
}

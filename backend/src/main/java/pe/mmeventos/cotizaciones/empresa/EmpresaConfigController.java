package pe.mmeventos.cotizaciones.empresa;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/empresa")
public class EmpresaConfigController {

    private final EmpresaConfigService service;

    public EmpresaConfigController(EmpresaConfigService service) {
        this.service = service;
    }

    @GetMapping
    public EmpresaDtos.Response obtener() {
        return service.obtener();
    }

    @PutMapping
    public EmpresaDtos.Response actualizar(@Valid @RequestBody EmpresaDtos.Request request) {
        return service.actualizar(request);
    }
}

package pe.mmeventos.cotizaciones.plantilla;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/plantillas")
public class PlantillaController {

    private final PlantillaService service;

    public PlantillaController(PlantillaService service) {
        this.service = service;
    }

    @GetMapping
    public List<PlantillaDtos.Response> listar(@RequestParam(defaultValue = "false") boolean incluirInactivas) {
        return service.listar(incluirInactivas);
    }

    @GetMapping("/{id}")
    public PlantillaDtos.Response obtener(@PathVariable Long id) {
        return service.obtener(id);
    }

    @GetMapping("/{id}/aplicar")
    public PlantillaDtos.AplicadaResponse aplicar(@PathVariable Long id,
            @RequestParam(defaultValue = "0") int invitados) {
        return service.aplicar(id, invitados);
    }

    @PostMapping
    public PlantillaDtos.Response crear(@Valid @RequestBody PlantillaDtos.Request request) {
        return service.crear(request);
    }

    @PutMapping("/{id}")
    public PlantillaDtos.Response actualizar(@PathVariable Long id, @Valid @RequestBody PlantillaDtos.Request request) {
        return service.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        service.eliminar(id);
    }
}

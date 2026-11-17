package pe.mmeventos.cotizaciones.cliente;

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
@RequestMapping("/api/clientes")
public class ClienteController {

    private final ClienteService service;

    public ClienteController(ClienteService service) {
        this.service = service;
    }

    @GetMapping
    public List<ClienteDtos.Response> listar(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) TipoCliente tipo,
            @RequestParam(defaultValue = "false") boolean incluirInactivos) {
        return service.listar(q, tipo, incluirInactivos);
    }

    @GetMapping("/opciones")
    public List<ClienteDtos.Option> opciones() {
        return service.opciones();
    }

    @GetMapping("/{id}")
    public ClienteDtos.Response obtener(@PathVariable Long id) {
        return service.obtener(id);
    }

    @PostMapping
    public ClienteDtos.Response crear(@Valid @RequestBody ClienteDtos.Request request) {
        return service.crear(request);
    }

    @PutMapping("/{id}")
    public ClienteDtos.Response actualizar(@PathVariable Long id, @Valid @RequestBody ClienteDtos.Request request) {
        return service.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public void desactivar(@PathVariable Long id) {
        service.desactivar(id);
    }
}

package pe.mmeventos.cotizaciones.usuario;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService service;

    public UsuarioController(UsuarioService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<UsuarioDtos.UsuarioResponse>> listar() {
        List<UsuarioDtos.UsuarioResponse> result = service.listar().stream()
                .map(UsuarioDtos.UsuarioResponse::from)
                .toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioDtos.UsuarioResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(UsuarioDtos.UsuarioResponse.from(service.obtener(id)));
    }

    @PostMapping
    public ResponseEntity<UsuarioDtos.UsuarioResponse> crear(@Valid @RequestBody UsuarioDtos.UsuarioRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(UsuarioDtos.UsuarioResponse.from(service.crear(req)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UsuarioDtos.UsuarioResponse> actualizar(@PathVariable Long id,
            @RequestBody UsuarioDtos.UsuarioUpdateRequest req) {
        return ResponseEntity.ok(UsuarioDtos.UsuarioResponse.from(service.actualizar(id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
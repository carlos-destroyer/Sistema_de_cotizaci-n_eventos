package pe.mmeventos.cotizaciones.catalogo;

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
@RequestMapping("/api")
public class CatalogoController {

    private final CatalogoService service;

    public CatalogoController(CatalogoService service) {
        this.service = service;
    }

    @GetMapping("/categorias")
    public List<CatalogoDtos.CategoriaResponse> categorias(
            @RequestParam(defaultValue = "false") boolean incluirInactivas) {
        return service.categorias(incluirInactivas);
    }

    @PostMapping("/categorias")
    public CatalogoDtos.CategoriaResponse crearCategoria(@Valid @RequestBody CatalogoDtos.CategoriaRequest request) {
        return service.crearCategoria(request);
    }

    @PutMapping("/categorias/{id}")
    public CatalogoDtos.CategoriaResponse actualizarCategoria(@PathVariable Long id,
            @Valid @RequestBody CatalogoDtos.CategoriaRequest request) {
        return service.actualizarCategoria(id, request);
    }

    @DeleteMapping("/categorias/{id}")
    public void desactivarCategoria(@PathVariable Long id) {
        service.desactivarCategoria(id);
    }

    @GetMapping("/catalogo")
    public List<CatalogoDtos.ItemResponse> items(
            @RequestParam(required = false) Long categoriaId,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "false") boolean incluirInactivos) {
        return service.items(categoriaId, q, incluirInactivos);
    }

    @GetMapping("/catalogo/{id}")
    public CatalogoDtos.ItemResponse obtener(@PathVariable Long id) {
        return service.obtenerItem(id);
    }

    @PostMapping("/catalogo")
    public CatalogoDtos.ItemResponse crear(@Valid @RequestBody CatalogoDtos.ItemRequest request) {
        return service.crearItem(request);
    }

    @PutMapping("/catalogo/{id}")
    public CatalogoDtos.ItemResponse actualizar(@PathVariable Long id,
            @Valid @RequestBody CatalogoDtos.ItemRequest request) {
        return service.actualizarItem(id, request);
    }

    @DeleteMapping("/catalogo/{id}")
    public void desactivar(@PathVariable Long id) {
        service.desactivarItem(id);
    }
}

package pe.mmeventos.cotizaciones.catalogo;

import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import pe.mmeventos.cotizaciones.common.BusinessException;
import pe.mmeventos.cotizaciones.common.NotFoundException;

@Service
public class CatalogoService {

    private final CategoriaServicioRepository categoriaRepository;
    private final CatalogoItemRepository itemRepository;

    public CatalogoService(CategoriaServicioRepository categoriaRepository, CatalogoItemRepository itemRepository) {
        this.categoriaRepository = categoriaRepository;
        this.itemRepository = itemRepository;
    }

    @Transactional(readOnly = true)
    public List<CatalogoDtos.CategoriaResponse> categorias(boolean incluirInactivas) {
        return (incluirInactivas ? categoriaRepository.findAllByOrderByOrdenAscNombreAsc()
                : categoriaRepository.findAllByActivoTrueOrderByOrdenAscNombreAsc())
                .stream()
                .map(c -> new CatalogoDtos.CategoriaResponse(c.getId(), c.getNombre(), c.getOrden(),
                        c.getActivo(), itemRepository.countByCategoriaId(c.getId())))
                .toList();
    }

    @Transactional
    public CatalogoDtos.CategoriaResponse crearCategoria(CatalogoDtos.CategoriaRequest request) {
        if (categoriaRepository.existsByNombreIgnoreCase(request.nombre().trim())) {
            throw new BusinessException("Ya existe una categoría con ese nombre.");
        }
        CategoriaServicio categoria = new CategoriaServicio();
        categoria.setNombre(request.nombre().trim());
        categoria.setOrden(request.orden() == null ? 99 : request.orden());
        categoria.setActivo(request.activo() == null || request.activo());
        return mapCategoria(categoriaRepository.save(categoria));
    }

    @Transactional
    public CatalogoDtos.CategoriaResponse actualizarCategoria(Long id, CatalogoDtos.CategoriaRequest request) {
        CategoriaServicio categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> NotFoundException.de("Categoría", id));
        categoria.setNombre(request.nombre().trim());
        if (request.orden() != null) {
            categoria.setOrden(request.orden());
        }
        if (request.activo() != null) {
            categoria.setActivo(request.activo());
        }
        return mapCategoria(categoriaRepository.save(categoria));
    }

    @Transactional
    public void desactivarCategoria(Long id) {
        CategoriaServicio categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> NotFoundException.de("Categoría", id));
        if (itemRepository.countByCategoriaId(id) > 0) {
            throw new BusinessException("La categoría tiene ítems asociados. Desactívala en lugar de eliminarla.");
        }
        categoria.setActivo(false);
        categoriaRepository.save(categoria);
    }

    @Transactional(readOnly = true)
    public List<CatalogoDtos.ItemResponse> items(Long categoriaId, String q, boolean incluirInactivos) {
        String termino = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
        return (incluirInactivos ? itemRepository.findAllByOrderByCategoriaOrdenAscNombreAsc()
                : itemRepository.findAllByActivoTrueOrderByCategoriaOrdenAscNombreAsc())
                .stream()
                .filter(i -> categoriaId == null || i.getCategoria().getId().equals(categoriaId))
                .filter(i -> termino.isEmpty()
                        || contiene(i.getNombre(), termino)
                        || contiene(i.getDescripcion(), termino)
                        || contiene(i.getCategoria().getNombre(), termino))
                .map(this::mapItem)
                .toList();
    }

    @Transactional(readOnly = true)
    public CatalogoDtos.ItemResponse obtenerItem(Long id) {
        return mapItem(buscarItem(id));
    }

    @Transactional
    public CatalogoDtos.ItemResponse crearItem(CatalogoDtos.ItemRequest request) {
        CatalogoItem item = new CatalogoItem();
        aplicar(item, request);
        return mapItem(itemRepository.save(item));
    }

    @Transactional
    public CatalogoDtos.ItemResponse actualizarItem(Long id, CatalogoDtos.ItemRequest request) {
        CatalogoItem item = buscarItem(id);
        aplicar(item, request);
        return mapItem(itemRepository.save(item));
    }

    @Transactional
    public void desactivarItem(Long id) {
        CatalogoItem item = buscarItem(id);
        item.setActivo(false);
        itemRepository.save(item);
    }

    @Transactional(readOnly = true)
    public CatalogoItem buscarItem(Long id) {
        return itemRepository.findById(id).orElseThrow(() -> NotFoundException.de("Ítem de catálogo", id));
    }

    private void aplicar(CatalogoItem item, CatalogoDtos.ItemRequest request) {
        CategoriaServicio categoria = categoriaRepository.findById(request.categoriaId())
                .orElseThrow(() -> NotFoundException.de("Categoría", request.categoriaId()));
        item.setCategoria(categoria);
        item.setNombre(request.nombre().trim());
        item.setDescripcion(request.descripcion());
        item.setUnidadMedida(request.unidadMedida() == null || request.unidadMedida().isBlank()
                ? "Unidad" : request.unidadMedida().trim());
        item.setPrecioVenta(request.precioVenta());
        item.setCostoInterno(request.costoInterno());
        item.setStockReferencial(request.stockReferencial());
        item.setReglaCantidad(request.reglaCantidad() == null ? ReglaCantidad.NINGUNA : request.reglaCantidad());
        if (request.activo() != null) {
            item.setActivo(request.activo());
        }
    }

    private boolean contiene(String valor, String termino) {
        return valor != null && valor.toLowerCase(Locale.ROOT).contains(termino);
    }

    private CatalogoDtos.CategoriaResponse mapCategoria(CategoriaServicio c) {
        return new CatalogoDtos.CategoriaResponse(c.getId(), c.getNombre(), c.getOrden(), c.getActivo(),
                itemRepository.countByCategoriaId(c.getId()));
    }

    private CatalogoDtos.ItemResponse mapItem(CatalogoItem i) {
        return new CatalogoDtos.ItemResponse(i.getId(), i.getCategoria().getId(), i.getCategoria().getNombre(),
                i.getNombre(), i.getDescripcion(), i.getUnidadMedida(), i.getPrecioVenta(), i.getCostoInterno(),
                i.getStockReferencial(), i.getReglaCantidad(), i.getActivo(), i.getActualizadoEn());
    }
}

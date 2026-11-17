package pe.mmeventos.cotizaciones.plantilla;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import pe.mmeventos.cotizaciones.catalogo.CatalogoItem;
import pe.mmeventos.cotizaciones.catalogo.CatalogoItemRepository;
import pe.mmeventos.cotizaciones.catalogo.ReglaCantidad;
import pe.mmeventos.cotizaciones.common.NotFoundException;

@Service
public class PlantillaService {

    private final PlantillaEventoRepository repository;
    private final CatalogoItemRepository catalogoRepository;

    public PlantillaService(PlantillaEventoRepository repository, CatalogoItemRepository catalogoRepository) {
        this.repository = repository;
        this.catalogoRepository = catalogoRepository;
    }

    @Transactional(readOnly = true)
    public List<PlantillaDtos.Response> listar(boolean incluirInactivas) {
        return (incluirInactivas ? repository.findAllByOrderByNombreAsc()
                : repository.findAllByActivoTrueOrderByNombreAsc())
                .stream().map(this::map).toList();
    }

    @Transactional(readOnly = true)
    public PlantillaDtos.Response obtener(Long id) {
        return map(buscar(id));
    }

    @Transactional
    public PlantillaDtos.Response crear(PlantillaDtos.Request request) {
        PlantillaEvento plantilla = new PlantillaEvento();
        aplicarCabecera(plantilla, request);
        aplicarDetalles(plantilla, request.detalles());
        return map(repository.save(plantilla));
    }

    @Transactional
    public PlantillaDtos.Response actualizar(Long id, PlantillaDtos.Request request) {
        PlantillaEvento plantilla = buscar(id);
        aplicarCabecera(plantilla, request);
        plantilla.getDetalles().clear();
        aplicarDetalles(plantilla, request.detalles());
        return map(repository.save(plantilla));
    }

    @Transactional
    public void eliminar(Long id) {
        PlantillaEvento plantilla = buscar(id);
        repository.delete(plantilla);
    }

    @Transactional(readOnly = true)
    public PlantillaDtos.AplicadaResponse aplicar(Long id, int invitados) {
        PlantillaEvento plantilla = buscar(id);
        List<PlantillaDtos.DetalleAplicado> detalles = new ArrayList<>();
        int orden = 0;
        for (PlantillaDetalle detalle : plantilla.getDetalles()) {
            BigDecimal cantidad = calcularCantidad(detalle, invitados);
            BigDecimal precio = detalle.getPrecioVenta();
            BigDecimal costo = detalle.getCostoInterno();
            if (detalle.getCatalogoItem() != null) {
                precio = detalle.getCatalogoItem().getPrecioVenta();
                costo = detalle.getCatalogoItem().getCostoInterno();
            }
            detalles.add(new PlantillaDtos.DetalleAplicado(
                    detalle.getCatalogoItem() == null ? null : detalle.getCatalogoItem().getId(),
                    detalle.getCategoriaNombre(),
                    detalle.getDescripcion(),
                    cantidad,
                    Boolean.TRUE.equals(detalle.getEsSubitem()) ? BigDecimal.ZERO : precio,
                    Boolean.TRUE.equals(detalle.getEsSubitem()) ? BigDecimal.ZERO : costo,
                    Boolean.TRUE.equals(detalle.getEsSubitem()),
                    detalle.getOrden() == null ? orden : detalle.getOrden()));
            orden++;
        }
        return new PlantillaDtos.AplicadaResponse(plantilla.getId(), plantilla.getNombre(),
                plantilla.getIncluyeIgv(), detalles);
    }

    private BigDecimal calcularCantidad(PlantillaDetalle detalle, int invitados) {
        if (Boolean.TRUE.equals(detalle.getEsSubitem()) || invitados <= 0 || detalle.getCatalogoItem() == null) {
            return detalle.getCantidadBase();
        }
        ReglaCantidad regla = detalle.getCatalogoItem().getReglaCantidad();
        return switch (regla) {
            case POR_INVITADO -> BigDecimal.valueOf(invitados);
            case POR_MESA -> BigDecimal.valueOf((int) Math.ceil(invitados / 8.0));
            case POR_MOZO -> BigDecimal.valueOf(Math.max(2, (int) Math.ceil(invitados / 20.0)));
            case NINGUNA -> detalle.getCantidadBase();
        };
    }

    private void aplicarCabecera(PlantillaEvento plantilla, PlantillaDtos.Request request) {
        plantilla.setNombre(request.nombre().trim());
        plantilla.setTipoEvento(request.tipoEvento().trim());
        plantilla.setDescripcion(request.descripcion());
        plantilla.setIncluyeIgv(Boolean.TRUE.equals(request.incluyeIgv()));
        if (request.activo() != null) {
            plantilla.setActivo(request.activo());
        }
    }

    private void aplicarDetalles(PlantillaEvento plantilla, List<PlantillaDtos.DetalleRequest> detalles) {
        if (detalles == null) {
            return;
        }
        int orden = 0;
        for (PlantillaDtos.DetalleRequest d : detalles) {
            PlantillaDetalle detalle = new PlantillaDetalle();
            CatalogoItem item = null;
            if (d.catalogoItemId() != null) {
                item = catalogoRepository.findById(d.catalogoItemId())
                        .orElseThrow(() -> NotFoundException.de("Ítem de catálogo", d.catalogoItemId()));
            }
            detalle.setCatalogoItem(item);
            detalle.setCategoriaNombre(d.categoriaNombre());
            detalle.setDescripcion(d.descripcion());
            detalle.setCantidadBase(d.cantidadBase() == null ? BigDecimal.ONE : d.cantidadBase());
            detalle.setPrecioVenta(d.precioVenta() != null ? d.precioVenta()
                    : (item != null ? item.getPrecioVenta() : BigDecimal.ZERO));
            detalle.setCostoInterno(d.costoInterno() != null ? d.costoInterno()
                    : (item != null ? item.getCostoInterno() : BigDecimal.ZERO));
            detalle.setEsSubitem(Boolean.TRUE.equals(d.esSubitem()));
            detalle.setOrden(d.orden() == null ? orden : d.orden());
            plantilla.addDetalle(detalle);
            orden++;
        }
    }

    private PlantillaEvento buscar(Long id) {
        return repository.findById(id).orElseThrow(() -> NotFoundException.de("Plantilla", id));
    }

    private PlantillaDtos.Response map(PlantillaEvento p) {
        List<PlantillaDtos.DetalleResponse> detalles = p.getDetalles().stream()
                .map(d -> new PlantillaDtos.DetalleResponse(
                        d.getId(),
                        d.getCatalogoItem() == null ? null : d.getCatalogoItem().getId(),
                        d.getCategoriaNombre(),
                        d.getDescripcion(),
                        d.getCantidadBase(),
                        d.getPrecioVenta(),
                        d.getCostoInterno(),
                        d.getEsSubitem(),
                        d.getOrden()))
                .toList();
        return new PlantillaDtos.Response(p.getId(), p.getNombre(), p.getTipoEvento(), p.getDescripcion(),
                p.getIncluyeIgv(), p.getActivo(), p.getCreadoEn(), detalles);
    }
}

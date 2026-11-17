package pe.mmeventos.cotizaciones.cotizacion;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import pe.mmeventos.cotizaciones.cliente.Cliente;
import pe.mmeventos.cotizaciones.cliente.ClienteService;
import pe.mmeventos.cotizaciones.common.BusinessException;
import pe.mmeventos.cotizaciones.common.NotFoundException;
import pe.mmeventos.cotizaciones.common.PageResponse;
import pe.mmeventos.cotizaciones.cotizacion.CotizacionDtos.DetalleRequest;
import pe.mmeventos.cotizaciones.empresa.EmpresaConfig;
import pe.mmeventos.cotizaciones.empresa.EmpresaConfigService;
import pe.mmeventos.cotizaciones.export.ExcelExportService;
import pe.mmeventos.cotizaciones.export.PdfExportService;

@Service
public class CotizacionService {

    private final CotizacionRepository repository;
    private final ClienteService clienteService;
    private final EmpresaConfigService empresaService;
    private final CalculadoraCotizacion calculadora;
    private final PdfExportService pdfExportService;
    private final ExcelExportService excelExportService;

    public CotizacionService(CotizacionRepository repository, ClienteService clienteService,
            EmpresaConfigService empresaService, CalculadoraCotizacion calculadora,
            PdfExportService pdfExportService, ExcelExportService excelExportService) {
        this.repository = repository;
        this.clienteService = clienteService;
        this.empresaService = empresaService;
        this.calculadora = calculadora;
        this.pdfExportService = pdfExportService;
        this.excelExportService = excelExportService;
    }

    @Transactional(readOnly = true)
    public PageResponse<CotizacionDtos.ListItem> listar(String q, EstadoCotizacion estado, Long clienteId,
            LocalDate desde, LocalDate hasta, int page, int size, String sort, String dir) {
        Specification<Cotizacion> spec = construirFiltro(q, estado, clienteId, desde, hasta);
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), construirOrden(sort, dir));
        Page<Cotizacion> resultado = repository.findAll(spec, pageable);
        return PageResponse.from(resultado, this::mapItem);
    }

    @Transactional(readOnly = true)
    public CotizacionDtos.Response obtener(Long id) {
        return map(cargarCompleta(id));
    }

    @Transactional
    public CotizacionDtos.Response crear(CotizacionDtos.Request request) {
        Cliente cliente = clienteService.buscar(request.clienteId());
        Cotizacion cotizacion = new Cotizacion();
        cotizacion.setCliente(cliente);
        LocalDate emision = request.fechaEmision() == null ? LocalDate.now() : request.fechaEmision();
        cotizacion.setFechaEmision(emision);
        cotizacion.setCodigo(generarCodigo(request.codigo(), emision));
        aplicarCabecera(cotizacion, request);
        cotizacion.setEstado(request.estado() == null ? EstadoCotizacion.BORRADOR : request.estado());
        cotizacion.setVersion(1);
        cotizacion.reemplazarDetalles(construirDetalles(request.detalles()));
        recalcular(cotizacion);
        return map(repository.save(cotizacion));
    }

    @Transactional
    public CotizacionDtos.Response actualizar(Long id, CotizacionDtos.Request request) {
        Cotizacion cotizacion = cargarCompleta(id);
        cotizacion.setCliente(clienteService.buscar(request.clienteId()));
        aplicarCabecera(cotizacion, request);
        if (request.estado() != null) {
            cotizacion.setEstado(request.estado());
        }
        cotizacion.reemplazarDetalles(construirDetalles(request.detalles()));
        recalcular(cotizacion);
        return map(repository.save(cotizacion));
    }

    @Transactional
    public CotizacionDtos.Response cambiarEstado(Long id, EstadoCotizacion estado) {
        Cotizacion cotizacion = cargarCompleta(id);
        cotizacion.setEstado(estado);
        return map(repository.save(cotizacion));
    }

    @Transactional
    public CotizacionDtos.Response duplicar(Long id) {
        Cotizacion original = cargarCompleta(id);
        Cotizacion raiz = original.getCotizacionOrigen() != null ? original.getCotizacionOrigen() : original;
        List<Cotizacion> versiones = repository.findByCotizacionOrigenIdOrderByVersionDesc(raiz.getId());
        int maximaVersion = raiz.getVersion() == null ? 1 : raiz.getVersion();
        for (Cotizacion v : versiones) {
            maximaVersion = Math.max(maximaVersion, v.getVersion() == null ? 1 : v.getVersion());
        }
        int nuevaVersion = maximaVersion + 1;
        String codigoBase = quitarSufijoVersion(raiz.getCodigo());
        String nuevoCodigo = codigoBase + "-V" + nuevaVersion;
        while (repository.existsByCodigo(nuevoCodigo)) {
            nuevaVersion++;
            nuevoCodigo = codigoBase + "-V" + nuevaVersion;
        }

        Cotizacion copia = new Cotizacion();
        copia.setCodigo(nuevoCodigo);
        copia.setCliente(original.getCliente());
        copia.setFechaEmision(LocalDate.now());
        copia.setValidoHasta(original.getValidoHasta());
        copia.setFechaEvento(original.getFechaEvento());
        copia.setLocalEvento(original.getLocalEvento());
        copia.setCantidadInvitados(original.getCantidadInvitados());
        copia.setTipoEvento(original.getTipoEvento());
        copia.setTematica(original.getTematica());
        copia.setPaletaColores(original.getPaletaColores());
        copia.setIncluyeIgv(original.getIncluyeIgv());
        copia.setNotasCortesia(original.getNotasCortesia());
        copia.setNotasInternas(original.getNotasInternas());
        copia.setEstado(EstadoCotizacion.BORRADOR);
        copia.setVersion(nuevaVersion);
        copia.setCotizacionOrigen(raiz);
        copia.setSubtotalVenta(original.getSubtotalVenta());
        copia.setMontoIgv(original.getMontoIgv());
        copia.setTotalVenta(original.getTotalVenta());
        copia.setCostoInternoTotal(original.getCostoInternoTotal());
        copia.setGananciaEstimada(original.getGananciaEstimada());
        copia.setTicketPorPersona(original.getTicketPorPersona());

        List<CotizacionDetalle> copiados = new ArrayList<>();
        for (CotizacionDetalle d : original.getDetalles()) {
            CotizacionDetalle nd = new CotizacionDetalle();
            nd.setCategoriaNombre(d.getCategoriaNombre());
            nd.setOrden(d.getOrden());
            nd.setDescripcion(d.getDescripcion());
            nd.setEsSubitemInformativo(d.getEsSubitemInformativo());
            nd.setUnidades(d.getUnidades());
            nd.setPrecioUnitarioVenta(d.getPrecioUnitarioVenta());
            nd.setSubtotalVenta(d.getSubtotalVenta());
            nd.setCostoUnitarioInterno(d.getCostoUnitarioInterno());
            nd.setSubtotalCostoInterno(d.getSubtotalCostoInterno());
            copiados.add(nd);
        }
        copia.reemplazarDetalles(copiados);
        return map(repository.save(copia));
    }

    @Transactional
    public void eliminar(Long id) {
        Cotizacion cotizacion = cargarCompleta(id);
        if (cotizacion.getEstado() != EstadoCotizacion.BORRADOR) {
            throw new BusinessException("Solo se pueden eliminar cotizaciones en estado Borrador. Cambia el estado o conserva el historial.");
        }
        repository.delete(cotizacion);
    }

    @Transactional(readOnly = true)
    public byte[] exportarPdf(Long id) {
        Cotizacion cotizacion = cargarCompleta(id);
        EmpresaConfig empresa = empresaService.obtenerEntidad();
        return pdfExportService.generar(cotizacion, empresa);
    }

    @Transactional(readOnly = true)
    public byte[] exportarExcel(Long id, String tipo) {
        Cotizacion cotizacion = cargarCompleta(id);
        EmpresaConfig empresa = empresaService.obtenerEntidad();
        return excelExportService.generar(cotizacion, empresa, tipo);
    }

    @Transactional(readOnly = true)
    public Cotizacion cargarCompleta(Long id) {
        Cotizacion cotizacion = repository.findWithClienteById(id)
                .orElseThrow(() -> NotFoundException.de("Cotización", id));
        cotizacion.getDetalles().size();
        return cotizacion;
    }

    private Specification<Cotizacion> construirFiltro(String q, EstadoCotizacion estado, Long clienteId,
            LocalDate desde, LocalDate hasta) {
        String termino = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
        return (root, query, cb) -> {
            List<Predicate> predicados = new ArrayList<>();
            Join<Cotizacion, Cliente> cliente = root.join("cliente", JoinType.INNER);
            if (!termino.isEmpty()) {
                String like = "%" + termino + "%";
                predicados.add(cb.or(
                        cb.like(cb.lower(root.get("codigo")), like),
                        cb.like(cb.lower(cliente.get("nombreRazonSocial")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("localEvento"), "")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("tematica"), "")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("tipoEvento"), "")), like)));
            }
            if (estado != null) {
                predicados.add(cb.equal(root.get("estado"), estado));
            }
            if (clienteId != null) {
                predicados.add(cb.equal(cliente.get("id"), clienteId));
            }
            if (desde != null) {
                predicados.add(cb.greaterThanOrEqualTo(root.get("fechaEvento"), desde));
            }
            if (hasta != null) {
                predicados.add(cb.lessThanOrEqualTo(root.get("fechaEvento"), hasta));
            }
            return cb.and(predicados.toArray(Predicate[]::new));
        };
    }

    private Sort construirOrden(String sort, String dir) {
        String propiedad = switch (sort == null ? "" : sort) {
            case "codigo", "fechaEvento", "totalVenta", "fechaEmision", "cliente" -> sort;
            default -> "creadoEn";
        };
        Sort.Direction direccion = "asc".equalsIgnoreCase(dir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(direccion, propiedad);
    }

    private void aplicarCabecera(Cotizacion cotizacion, CotizacionDtos.Request request) {
        cotizacion.setValidoHasta(request.validoHasta() == null
                ? cotizacion.getFechaEmision().plusDays(10) : request.validoHasta());
        cotizacion.setFechaEvento(request.fechaEvento());
        cotizacion.setLocalEvento(request.localEvento());
        cotizacion.setCantidadInvitados(request.cantidadInvitados() == null ? 0 : request.cantidadInvitados());
        cotizacion.setTipoEvento(request.tipoEvento());
        cotizacion.setTematica(request.tematica());
        cotizacion.setPaletaColores(request.paletaColores());
        cotizacion.setIncluyeIgv(Boolean.TRUE.equals(request.incluyeIgv()));
        cotizacion.setNotasCortesia(request.notasCortesia());
        cotizacion.setNotasInternas(request.notasInternas());
    }

    private List<CotizacionDetalle> construirDetalles(List<DetalleRequest> solicitudes) {
        List<CotizacionDetalle> detalles = new ArrayList<>();
        int indice = 0;
        for (DetalleRequest d : solicitudes) {
            CotizacionDetalle detalle = new CotizacionDetalle();
            detalle.setCategoriaNombre(d.categoriaNombre().trim());
            detalle.setDescripcion(d.descripcion().trim());
            detalle.setOrden(d.orden() == null ? indice : d.orden());
            detalle.setEsSubitemInformativo(Boolean.TRUE.equals(d.esSubitemInformativo()));
            detalle.setUnidades(d.unidades() == null ? BigDecimal.ONE : d.unidades());
            detalle.setPrecioUnitarioVenta(d.precioUnitarioVenta() == null ? BigDecimal.ZERO : d.precioUnitarioVenta());
            detalle.setCostoUnitarioInterno(d.costoUnitarioInterno() == null ? BigDecimal.ZERO : d.costoUnitarioInterno());
            calculadora.aplicarCalculos(detalle);
            detalles.add(detalle);
            indice++;
        }
        return detalles;
    }

    private void recalcular(Cotizacion cotizacion) {
        BigDecimal igvPct = empresaService.obtenerEntidad().getIgvPorcentaje();
        CotizacionDtos.Totales totales = calculadora.calcularTotales(
                cotizacion.getDetalles(),
                Boolean.TRUE.equals(cotizacion.getIncluyeIgv()),
                igvPct,
                cotizacion.getCantidadInvitados() == null ? 0 : cotizacion.getCantidadInvitados());
        cotizacion.setSubtotalVenta(totales.subtotalVenta());
        cotizacion.setMontoIgv(totales.montoIgv());
        cotizacion.setTotalVenta(totales.totalVenta());
        cotizacion.setCostoInternoTotal(totales.costoInternoTotal());
        cotizacion.setGananciaEstimada(totales.gananciaEstimada());
        cotizacion.setTicketPorPersona(totales.ticketPorPersona());
    }

    private String generarCodigo(String codigoSolicitado, LocalDate emision) {
        if (codigoSolicitado != null && !codigoSolicitado.isBlank()) {
            String limpio = codigoSolicitado.trim().toUpperCase(Locale.ROOT);
            if (repository.existsByCodigo(limpio)) {
                throw new BusinessException("Ya existe una cotización con el código " + limpio + ".");
            }
            return limpio;
        }
        String prefijo = "COT-" + emision.getYear() + "-";
        List<String> codigos = repository.findCodigosBase(prefijo, PageRequest.of(0, 1));
        int siguiente = 1;
        if (!codigos.isEmpty()) {
            String ultimo = codigos.get(0);
            try {
                siguiente = Integer.parseInt(ultimo.substring(prefijo.length())) + 1;
            } catch (NumberFormatException ignored) {
                siguiente = 1;
            }
        }
        String nuevo = prefijo + String.format("%03d", siguiente);
        while (repository.existsByCodigo(nuevo)) {
            siguiente++;
            nuevo = prefijo + String.format("%03d", siguiente);
        }
        return nuevo;
    }

    private String quitarSufijoVersion(String codigo) {
        return codigo == null ? "COT" : codigo.replaceFirst("-V\\d+$", "");
    }

    private CotizacionDtos.Response map(Cotizacion c) {
        List<CotizacionDtos.DetalleResponse> detalles = c.getDetalles().stream()
                .map(d -> new CotizacionDtos.DetalleResponse(
                        d.getId(), d.getCategoriaNombre(), d.getOrden(), d.getDescripcion(),
                        d.getEsSubitemInformativo(), d.getUnidades(), d.getPrecioUnitarioVenta(),
                        d.getSubtotalVenta(), d.getCostoUnitarioInterno(), d.getSubtotalCostoInterno()))
                .toList();
        return new CotizacionDtos.Response(
                c.getId(), c.getCodigo(), c.getCliente().getId(), c.getCliente().getNombreRazonSocial(),
                c.getCliente().getTipoCliente(), c.getCliente().getDocumento(), c.getCliente().getTelefono(),
                c.getCliente().getEmail(), c.getFechaEmision(), c.getValidoHasta(), c.getFechaEvento(),
                c.getLocalEvento(), c.getCantidadInvitados(), c.getTipoEvento(), c.getTematica(),
                c.getPaletaColores(), c.getIncluyeIgv(), c.getNotasCortesia(), c.getNotasInternas(),
                c.getEstado(), c.getVersion(),
                c.getCotizacionOrigen() == null ? null : c.getCotizacionOrigen().getId(),
                c.getCotizacionOrigen() == null ? null : c.getCotizacionOrigen().getCodigo(),
                c.getSubtotalVenta(), c.getMontoIgv(), c.getTotalVenta(), c.getCostoInternoTotal(),
                c.getGananciaEstimada(), c.getTicketPorPersona(), c.getCreadoEn(), c.getActualizadoEn(),
                detalles);
    }

    private CotizacionDtos.ListItem mapItem(Cotizacion c) {
        return new CotizacionDtos.ListItem(
                c.getId(), c.getCodigo(), c.getCliente().getId(), c.getCliente().getNombreRazonSocial(),
                c.getCliente().getTipoCliente(), c.getFechaEmision(), c.getFechaEvento(), c.getLocalEvento(),
                c.getCantidadInvitados(), c.getTipoEvento(), c.getEstado(), c.getTotalVenta(),
                c.getGananciaEstimada(), c.getVersion(), c.getCreadoEn());
    }
}

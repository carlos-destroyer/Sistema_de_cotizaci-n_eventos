package pe.mmeventos.cotizaciones.dashboard;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import pe.mmeventos.cotizaciones.cliente.ClienteRepository;
import pe.mmeventos.cotizaciones.cotizacion.Cotizacion;
import pe.mmeventos.cotizaciones.cotizacion.CotizacionDtos;
import pe.mmeventos.cotizaciones.cotizacion.CotizacionRepository;
import pe.mmeventos.cotizaciones.cotizacion.EstadoCotizacion;

@Service
public class DashboardService {

    private static final DateTimeFormatter MES_CORTO = DateTimeFormatter.ofPattern("MMM", new Locale("es", "PE"));

    private final CotizacionRepository cotizacionRepository;
    private final ClienteRepository clienteRepository;

    public DashboardService(CotizacionRepository cotizacionRepository, ClienteRepository clienteRepository) {
        this.cotizacionRepository = cotizacionRepository;
        this.clienteRepository = clienteRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse obtener() {
        LocalDate hoy = LocalDate.now();
        YearMonth mesActual = YearMonth.from(hoy);
        LocalDate inicioMes = mesActual.atDay(1);
        LocalDate finMes = mesActual.atEndOfMonth();
        LocalDate inicioAnio = LocalDate.of(hoy.getYear(), 1, 1);
        LocalDate finAnio = LocalDate.of(hoy.getYear(), 12, 31);

        long total = cotizacionRepository.count();
        long mes = cotizacionRepository.countByFechaEmisionBetween(inicioMes, finMes);
        long aprobadasMes = cotizacionRepository.countByEstadoAndFechaEmisionBetween(EstadoCotizacion.APROBADA, inicioMes, finMes);
        long aprobadasAnio = cotizacionRepository.countByEstadoAndFechaEmisionBetween(EstadoCotizacion.APROBADA, inicioAnio, finAnio);
        long enviadasAnio = cotizacionRepository.countByEstadoAndFechaEmisionBetween(EstadoCotizacion.ENVIADA, inicioAnio, finAnio);
        long rechazadasAnio = cotizacionRepository.countByEstadoAndFechaEmisionBetween(EstadoCotizacion.RECHAZADA, inicioAnio, finAnio);

        BigDecimal montoMes = cotizacionRepository.sumTotalVentaByEstadosAndRango(
                List.of(EstadoCotizacion.ENVIADA, EstadoCotizacion.APROBADA), inicioMes, finMes);
        BigDecimal ganancia = cotizacionRepository.sumGananciaByEstados(
                List.of(EstadoCotizacion.ENVIADA, EstadoCotizacion.APROBADA));
        BigDecimal ventaAprobada = cotizacionRepository.sumTotalVentaByEstado(EstadoCotizacion.APROBADA);
        long totalAprobadas = cotizacionRepository.countByEstado(EstadoCotizacion.APROBADA);
        BigDecimal ticketPromedio = totalAprobadas > 0
                ? ventaAprobada.divide(BigDecimal.valueOf(totalAprobadas), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        long oportunidades = aprobadasAnio + enviadasAnio + rechazadasAnio;
        double tasaCierre = oportunidades > 0
                ? Math.round((aprobadasAnio * 10000.0 / oportunidades)) / 100.0
                : 0;

        DashboardResponse.Kpis kpis = new DashboardResponse.Kpis(
                total, mes, aprobadasMes, redondear(montoMes), tasaCierre, redondear(ganancia),
                ticketPromedio, clienteRepository.countByActivoTrue());

        Map<EstadoCotizacion, Long> cantidades = new EnumMap<>(EstadoCotizacion.class);
        for (EstadoCotizacion estado : EstadoCotizacion.values()) {
            cantidades.put(estado, cotizacionRepository.countByEstado(estado));
        }
        List<DashboardResponse.EstadoResumen> pipeline = new ArrayList<>();
        for (EstadoCotizacion estado : EstadoCotizacion.values()) {
            pipeline.add(new DashboardResponse.EstadoResumen(
                    estado,
                    cantidades.get(estado),
                    redondear(cotizacionRepository.sumTotalVentaByEstado(estado))));
        }

        List<CotizacionDtos.ListItem> recientes = cotizacionRepository
                .findRecientes(PageRequest.of(0, 5)).stream().map(this::mapItem).toList();
        List<CotizacionDtos.ListItem> proximos = cotizacionRepository
                .findProximosEventos(hoy, EstadoCotizacion.RECHAZADA, PageRequest.of(0, 5))
                .stream().map(this::mapItem).toList();

        return new DashboardResponse(kpis, pipeline, recientes, proximos,
                serieMensual(mesActual), topCategorias());
    }

    private List<DashboardResponse.SerieMensual> serieMensual(YearMonth mesActual) {
        YearMonth inicio = mesActual.minusMonths(5);
        LocalDate desde = inicio.atDay(1);
        LocalDate hasta = mesActual.atEndOfMonth();
        Map<YearMonth, BigDecimal> totales = new LinkedHashMap<>();
        Map<YearMonth, Long> cantidades = new LinkedHashMap<>();
        for (int i = 0; i < 6; i++) {
            YearMonth ym = inicio.plusMonths(i);
            totales.put(ym, BigDecimal.ZERO);
            cantidades.put(ym, 0L);
        }
        for (Object[] fila : cotizacionRepository.findResumenPorFecha(desde, hasta)) {
            LocalDate fecha = (LocalDate) fila[0];
            BigDecimal monto = fila[1] == null ? BigDecimal.ZERO : (BigDecimal) fila[1];
            EstadoCotizacion estado = (EstadoCotizacion) fila[2];
            if (estado == EstadoCotizacion.RECHAZADA) {
                continue;
            }
            YearMonth ym = YearMonth.from(fecha);
            if (totales.containsKey(ym)) {
                totales.put(ym, totales.get(ym).add(monto));
                cantidades.put(ym, cantidades.get(ym) + 1);
            }
        }
        List<DashboardResponse.SerieMensual> serie = new ArrayList<>();
        totales.forEach((ym, monto) -> {
            String etiqueta = MES_CORTO.format(ym.atDay(1));
            etiqueta = etiqueta.substring(0, 1).toUpperCase(Locale.ROOT) + etiqueta.substring(1).replace(".", "");
            serie.add(new DashboardResponse.SerieMensual(ym.toString(), etiqueta, redondear(monto), cantidades.get(ym)));
        });
        return serie;
    }

    private List<DashboardResponse.CategoriaResumen> topCategorias() {
        List<Object[]> filas = cotizacionRepository.findTopCategorias(EstadoCotizacion.RECHAZADA, PageRequest.of(0, 5));
        BigDecimal total = filas.stream()
                .map(f -> f[1] == null ? BigDecimal.ZERO : (BigDecimal) f[1])
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        List<DashboardResponse.CategoriaResumen> resultado = new ArrayList<>();
        for (Object[] fila : filas) {
            BigDecimal monto = fila[1] == null ? BigDecimal.ZERO : (BigDecimal) fila[1];
            double porcentaje = total.compareTo(BigDecimal.ZERO) > 0
                    ? Math.round(monto.doubleValue() * 1000.0 / total.doubleValue()) / 10.0
                    : 0;
            resultado.add(new DashboardResponse.CategoriaResumen((String) fila[0], redondear(monto), porcentaje));
        }
        return resultado;
    }

    private CotizacionDtos.ListItem mapItem(Cotizacion c) {
        return new CotizacionDtos.ListItem(
                c.getId(), c.getCodigo(), c.getCliente().getId(), c.getCliente().getNombreRazonSocial(),
                c.getCliente().getTipoCliente(), c.getFechaEmision(), c.getFechaEvento(), c.getLocalEvento(),
                c.getCantidadInvitados(), c.getTipoEvento(), c.getEstado(), c.getTotalVenta(),
                c.getGananciaEstimada(), c.getVersion(), c.getCreadoEn());
    }

    private BigDecimal redondear(BigDecimal valor) {
        return (valor == null ? BigDecimal.ZERO : valor).setScale(2, RoundingMode.HALF_UP);
    }
}

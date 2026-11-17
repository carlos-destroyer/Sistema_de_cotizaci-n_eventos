package pe.mmeventos.cotizaciones.dashboard;

import java.math.BigDecimal;
import java.util.List;

import pe.mmeventos.cotizaciones.cotizacion.CotizacionDtos;
import pe.mmeventos.cotizaciones.cotizacion.EstadoCotizacion;

public record DashboardResponse(
        Kpis kpis,
        List<EstadoResumen> pipeline,
        List<CotizacionDtos.ListItem> recientes,
        List<CotizacionDtos.ListItem> proximosEventos,
        List<SerieMensual> serieMensual,
        List<CategoriaResumen> topCategorias) {

    public record Kpis(
            long cotizacionesTotal,
            long cotizacionesMes,
            long aprobadasMes,
            BigDecimal montoCotizadoMes,
            double tasaCierre,
            BigDecimal gananciaProyectada,
            BigDecimal ticketPromedio,
            long clientesActivos) {
    }

    public record EstadoResumen(EstadoCotizacion estado, long cantidad, BigDecimal monto) {
    }

    public record SerieMensual(String clave, String etiqueta, BigDecimal total, long cantidad) {
    }

    public record CategoriaResumen(String categoria, BigDecimal total, double porcentaje) {
    }
}

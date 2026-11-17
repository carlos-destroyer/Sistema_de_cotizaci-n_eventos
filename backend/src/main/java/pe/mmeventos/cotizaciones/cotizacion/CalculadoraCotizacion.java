package pe.mmeventos.cotizaciones.cotizacion;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.stereotype.Component;

import pe.mmeventos.cotizaciones.cotizacion.CotizacionDtos.Totales;

@Component
public class CalculadoraCotizacion {

    private static final BigDecimal CIEN = new BigDecimal("100");

    public void aplicarCalculos(CotizacionDetalle detalle) {
        BigDecimal unidades = nz(detalle.getUnidades());
        BigDecimal precio = nz(detalle.getPrecioUnitarioVenta());
        BigDecimal costo = nz(detalle.getCostoUnitarioInterno());

        if (Boolean.TRUE.equals(detalle.getEsSubitemInformativo())) {
            detalle.setPrecioUnitarioVenta(BigDecimal.ZERO);
            detalle.setCostoUnitarioInterno(BigDecimal.ZERO);
            detalle.setSubtotalVenta(BigDecimal.ZERO);
            detalle.setSubtotalCostoInterno(BigDecimal.ZERO);
            return;
        }

        detalle.setSubtotalVenta(redondear(unidades.multiply(precio)));
        detalle.setSubtotalCostoInterno(redondear(unidades.multiply(costo)));
    }

    public Totales calcularTotales(List<CotizacionDetalle> detalles, boolean incluyeIgv,
            BigDecimal igvPorcentaje, int invitados) {
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal costo = BigDecimal.ZERO;
        for (CotizacionDetalle d : detalles) {
            if (Boolean.TRUE.equals(d.getEsSubitemInformativo())) {
                continue;
            }
            subtotal = subtotal.add(nz(d.getSubtotalVenta()));
            costo = costo.add(nz(d.getSubtotalCostoInterno()));
        }
        subtotal = redondear(subtotal);
        costo = redondear(costo);
        BigDecimal igv = incluyeIgv
                ? redondear(subtotal.multiply(nz(igvPorcentaje)).divide(CIEN, 6, RoundingMode.HALF_UP))
                : BigDecimal.ZERO;
        BigDecimal total = redondear(subtotal.add(igv));
        BigDecimal ganancia = redondear(subtotal.subtract(costo));
        BigDecimal ticket = invitados > 0
                ? redondear(total.divide(BigDecimal.valueOf(invitados), 6, RoundingMode.HALF_UP))
                : BigDecimal.ZERO;
        return new Totales(subtotal, igv, total, costo, ganancia, ticket);
    }

    public BigDecimal redondear(BigDecimal valor) {
        return nz(valor).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal nz(BigDecimal valor) {
        return valor == null ? BigDecimal.ZERO : valor;
    }
}

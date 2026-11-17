package pe.mmeventos.cotizaciones.export;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import pe.mmeventos.cotizaciones.common.BusinessException;
import pe.mmeventos.cotizaciones.cotizacion.Cotizacion;
import pe.mmeventos.cotizaciones.cotizacion.CotizacionDetalle;
import pe.mmeventos.cotizaciones.empresa.EmpresaConfig;

@Service
public class ExcelExportService {

    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public byte[] generar(Cotizacion c, EmpresaConfig empresa, String tipo) {
        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Estilos estilos = crearEstilos(wb);
            crearHojaCliente(wb, c, empresa, estilos);
            if ("interno".equalsIgnoreCase(tipo)) {
                crearHojaInterna(wb, c, estilos);
            }
            wb.write(out);
            return out.toByteArray();
        } catch (IOException ex) {
            throw new BusinessException("No se pudo generar el archivo Excel de la cotización.");
        }
    }

    private void crearHojaCliente(Workbook wb, Cotizacion c, EmpresaConfig e, Estilos st) {
        Sheet sheet = wb.createSheet("Cotización " + c.getCodigo());
        sheet.setColumnWidth(0, 62 * 256);
        sheet.setColumnWidth(1, 11 * 256);
        sheet.setColumnWidth(2, 16 * 256);
        sheet.setColumnWidth(3, 17 * 256);
        sheet.setDisplayGridlines(false);

        int row = 0;
        Row titulo = sheet.createRow(row++);
        titulo.setHeightInPoints(34);
        celda(titulo, 0, "M&M EVENTOS", st.titulo());
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 3));

        Row subtitulo = sheet.createRow(row++);
        subtitulo.setHeightInPoints(25);
        celda(subtitulo, 0, "COTIZACIÓN " + c.getCodigo(), st.marca());
        sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 3));

        row++;
        info(sheet, row++, "Cliente", c.getCliente().getNombreRazonSocial(), st);
        info(sheet, row++, "Tipo de evento", valor(c.getTipoEvento()), st);
        info(sheet, row++, "Fecha de emisión", c.getFechaEmision().format(FECHA), st);
        info(sheet, row++, "Válida hasta", c.getValidoHasta() == null ? "—" : c.getValidoHasta().format(FECHA), st);
        info(sheet, row++, "Fecha del evento", c.getFechaEvento() == null ? "Por confirmar" : c.getFechaEvento().format(FECHA), st);
        info(sheet, row++, "Local", valor(c.getLocalEvento()), st);
        info(sheet, row++, "N° de invitados", String.valueOf(c.getCantidadInvitados()), st);
        info(sheet, row++, "Temática / paleta", valor(c.getTematica()) + " · " + valor(c.getPaletaColores()), st);
        info(sheet, row++, "RUC / Teléfono", valor(e.getRuc()) + " · " + valor(e.getTelefono()), st);
        row++;

        Row header = sheet.createRow(row++);
        header.setHeightInPoints(22);
        celda(header, 0, "DESCRIPCIÓN", st.encabezado());
        celda(header, 1, "UNIDADES", st.encabezado());
        celda(header, 2, "P. UNITARIO", st.encabezado());
        celda(header, 3, "TOTAL", st.encabezado());

        Map<String, List<CotizacionDetalle>> grupos = agrupar(c.getDetalles());
        int primeraFilaItem = row;
        for (Map.Entry<String, List<CotizacionDetalle>> grupo : grupos.entrySet()) {
            Row categoria = sheet.createRow(row++);
            categoria.setHeightInPoints(18);
            celda(categoria, 0, grupo.getKey().toUpperCase(Locale.ROOT), st.categoria());
            for (int i = 1; i <= 3; i++) {
                celda(categoria, i, "", st.categoria());
            }
            sheet.addMergedRegion(new CellRangeAddress(categoria.getRowNum(), categoria.getRowNum(), 0, 3));

            for (CotizacionDetalle d : grupo.getValue()) {
                Row fila = sheet.createRow(row++);
                fila.setHeightInPoints(28);
                boolean subitem = Boolean.TRUE.equals(d.getEsSubitemInformativo());
                celda(fila, 0, subitem ? "    •  " + d.getDescripcion() : d.getDescripcion(),
                        subitem ? st.subitem() : st.texto());
                if (subitem) {
                    celda(fila, 1, "", st.textoCentro());
                    celda(fila, 2, "", st.dinero());
                    celda(fila, 3, "", st.dinero());
                } else {
                    celdaNumero(fila, 1, d.getUnidades(), st.numero());
                    celdaNumero(fila, 2, d.getPrecioUnitarioVenta(), st.dinero());
                    Cell total = fila.createCell(3);
                    total.setCellFormula("B" + (fila.getRowNum() + 1) + "*C" + (fila.getRowNum() + 1));
                    total.setCellStyle(st.dinero());
                }
            }
        }
        int ultimaFilaItem = row - 1;
        row++;

        int filaSubtotal = row;
        Row subtotal = sheet.createRow(row++);
        celda(subtotal, 2, "SUBTOTAL", st.totalEtiqueta());
        Cell valorSubtotal = subtotal.createCell(3);
        valorSubtotal.setCellFormula(primeraFilaItem <= ultimaFilaItem
                ? "SUM(D" + (primeraFilaItem + 1) + ":D" + (ultimaFilaItem + 1) + ")" : "0");
        valorSubtotal.setCellStyle(st.totalValor());

        int filaTotal = filaSubtotal;
        if (Boolean.TRUE.equals(c.getIncluyeIgv())) {
            Row igv = sheet.createRow(row++);
            celda(igv, 2, "IGV 18%", st.totalEtiqueta());
            Cell valorIgv = igv.createCell(3);
            valorIgv.setCellFormula("D" + (filaSubtotal + 1) + "*" + igvFactor(c) + "/100");
            valorIgv.setCellStyle(st.totalValor());
            filaTotal = igv.getRowNum();
        }
        Row total = sheet.createRow(row++);
        total.setHeightInPoints(23);
        celda(total, 2, "TOTAL GENERAL", st.totalEtiquetaFuerte());
        Cell valorTotal = total.createCell(3);
        valorTotal.setCellFormula("SUM(D" + (filaSubtotal + 1) + ":D" + (filaTotal + 1) + ")");
        valorTotal.setCellStyle(st.totalValorFuerte());

        row++;
        Row porPersona = sheet.createRow(row++);
        celda(porPersona, 2, "Ticket por persona", st.nota());
        Cell valorPersona = porPersona.createCell(3);
        valorPersona.setCellStyle(st.dinero());
        valorPersona.setCellValue(c.getTicketPorPersona() == null ? 0 : c.getTicketPorPersona().doubleValue());

        if (c.getNotasCortesia() != null && !c.getNotasCortesia().isBlank()) {
            row++;
            Row cortesiaTitulo = sheet.createRow(row++);
            celda(cortesiaTitulo, 0, "CORTESÍAS Y CONSIDERACIONES", st.categoria());
            sheet.addMergedRegion(new CellRangeAddress(cortesiaTitulo.getRowNum(), cortesiaTitulo.getRowNum(), 0, 3));
            Row cortesia = sheet.createRow(row++);
            cortesia.setHeightInPoints(40);
            celda(cortesia, 0, c.getNotasCortesia(), st.textoWrap());
            sheet.addMergedRegion(new CellRangeAddress(cortesia.getRowNum(), cortesia.getRowNum(), 0, 3));
        }

        row += 2;
        Row firma = sheet.createRow(row);
        celda(firma, 2, "______________________________", st.textoCentro());
        Row nombre = sheet.createRow(++row);
        celda(nombre, 2, "Mariella Martinez", st.negrita());
        Row cargo = sheet.createRow(++row);
        celda(cargo, 2, "Gerente General · M&M Eventos", st.notaCentro());

        sheet.setPrintGridlines(false);
        sheet.getPrintSetup().setPaperSize(org.apache.poi.ss.usermodel.PrintSetup.A4_PAPERSIZE);
        sheet.getPrintSetup().setFitWidth((short) 1);
        sheet.getPrintSetup().setFitHeight((short) 0);
        sheet.setFitToPage(true);
        sheet.setAutobreaks(true);
    }

    private void crearHojaInterna(Workbook wb, Cotizacion c, Estilos st) {
        Sheet sheet = wb.createSheet("Análisis interno");
        int[] anchos = { 25, 55, 10, 14, 15, 15, 15, 16 };
        for (int i = 0; i < anchos.length; i++) {
            sheet.setColumnWidth(i, anchos[i] * 256);
        }
        sheet.setDisplayGridlines(false);

        int row = 0;
        Row titulo = sheet.createRow(row++);
        titulo.setHeightInPoints(30);
        celda(titulo, 0, "ANÁLISIS INTERNO · " + c.getCodigo(), st.titulo());
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 7));

        Row meta = sheet.createRow(row++);
        celda(meta, 0, "Cliente: " + c.getCliente().getNombreRazonSocial()
                + "   |   Evento: " + valor(c.getFechaEvento() == null ? null : c.getFechaEvento().format(FECHA))
                + "   |   Invitados: " + c.getCantidadInvitados(), st.nota());
        sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 7));

        row++;
        Row header = sheet.createRow(row++);
        header.setHeightInPoints(24);
        celda(header, 0, "CATEGORÍA", st.encabezado());
        celda(header, 1, "DESCRIPCIÓN", st.encabezado());
        celda(header, 2, "UNIDADES", st.encabezado());
        celda(header, 3, "P. UNIT. VENTA", st.encabezado());
        celda(header, 4, "TOTAL VENTA", st.encabezado());
        celda(header, 5, "COSTO UNIT.", st.encabezado());
        celda(header, 6, "COSTO TOTAL", st.encabezado());
        celda(header, 7, "GANANCIA", st.encabezado());

        Map<String, List<CotizacionDetalle>> grupos = agrupar(c.getDetalles());
        int primeraFila = row;
        for (Map.Entry<String, List<CotizacionDetalle>> grupo : grupos.entrySet()) {
            Row categoria = sheet.createRow(row++);
            celda(categoria, 0, grupo.getKey().toUpperCase(Locale.ROOT), st.categoria());
            for (int i = 1; i <= 7; i++) {
                celda(categoria, i, "", st.categoria());
            }
            sheet.addMergedRegion(new CellRangeAddress(categoria.getRowNum(), categoria.getRowNum(), 0, 7));

            for (CotizacionDetalle d : grupo.getValue()) {
                Row fila = sheet.createRow(row++);
                fila.setHeightInPoints(26);
                boolean subitem = Boolean.TRUE.equals(d.getEsSubitemInformativo());
                celda(fila, 0, grupo.getKey(), st.texto());
                celda(fila, 1, subitem ? "    •  " + d.getDescripcion() : d.getDescripcion(),
                        subitem ? st.subitem() : st.texto());
                if (subitem) {
                    for (int i = 2; i <= 7; i++) {
                        celda(fila, i, "", st.texto());
                    }
                } else {
                    int n = fila.getRowNum() + 1;
                    celdaNumero(fila, 2, d.getUnidades(), st.numero());
                    celdaNumero(fila, 3, d.getPrecioUnitarioVenta(), st.dinero());
                    Cell totalVenta = fila.createCell(4);
                    totalVenta.setCellFormula("C" + n + "*D" + n);
                    totalVenta.setCellStyle(st.dinero());
                    celdaNumero(fila, 5, d.getCostoUnitarioInterno(), st.dinero());
                    Cell costoTotal = fila.createCell(6);
                    costoTotal.setCellFormula("C" + n + "*F" + n);
                    costoTotal.setCellStyle(st.dinero());
                    Cell ganancia = fila.createCell(7);
                    ganancia.setCellFormula("E" + n + "-G" + n);
                    ganancia.setCellStyle(st.dinero());
                }
            }
        }
        int ultimaFila = row - 1;
        row++;

        int filaSubtotal = row;
        Row subtotal = sheet.createRow(row++);
        celda(subtotal, 3, "TOTALES", st.totalEtiqueta());
        Cell venta = subtotal.createCell(4);
        venta.setCellFormula(primeraFila <= ultimaFila ? "SUM(E" + (primeraFila + 1) + ":E" + (ultimaFila + 1) + ")" : "0");
        venta.setCellStyle(st.totalValor());
        Cell costo = subtotal.createCell(6);
        costo.setCellFormula(primeraFila <= ultimaFila ? "SUM(G" + (primeraFila + 1) + ":G" + (ultimaFila + 1) + ")" : "0");
        costo.setCellStyle(st.totalValor());
        Cell ganancia = subtotal.createCell(7);
        ganancia.setCellFormula(primeraFila <= ultimaFila ? "SUM(H" + (primeraFila + 1) + ":H" + (ultimaFila + 1) + ")" : "0");
        ganancia.setCellStyle(st.totalValor());

        Row margen = sheet.createRow(row++);
        celda(margen, 3, "MARGEN %", st.totalEtiqueta());
        Cell porcentaje = margen.createCell(7);
        porcentaje.setCellFormula("IF(E" + (filaSubtotal + 1) + "=0,0,H" + (filaSubtotal + 1) + "/E" + (filaSubtotal + 1) + ")");
        porcentaje.setCellStyle(st.porcentaje());

        Row ticket = sheet.createRow(row++);
        celda(ticket, 3, "TICKET POR PERSONA", st.totalEtiqueta());
        Cell ticketValor = ticket.createCell(7);
        ticketValor.setCellFormula("IF(" + c.getCantidadInvitados() + "=0,0,E" + (filaSubtotal + 1) + "/" + c.getCantidadInvitados() + ")");
        ticketValor.setCellStyle(st.dinero());

        sheet.createFreezePane(0, 4);
        sheet.getPrintSetup().setPaperSize(org.apache.poi.ss.usermodel.PrintSetup.A4_PAPERSIZE);
        sheet.getPrintSetup().setFitWidth((short) 1);
        sheet.getPrintSetup().setFitHeight((short) 0);
        sheet.setFitToPage(true);
    }

    private void info(Sheet sheet, int fila, String etiqueta, String valor, Estilos st) {
        Row row = sheet.createRow(fila);
        Cell label = row.createCell(0);
        label.setCellValue(etiqueta);
        label.setCellStyle(st.etiqueta());
        Cell dato = row.createCell(1);
        dato.setCellValue(valor);
        dato.setCellStyle(st.texto());
        sheet.addMergedRegion(new CellRangeAddress(fila, fila, 1, 3));
    }

    private Map<String, List<CotizacionDetalle>> agrupar(List<CotizacionDetalle> detalles) {
        Map<String, List<CotizacionDetalle>> grupos = new LinkedHashMap<>();
        for (CotizacionDetalle d : detalles) {
            grupos.computeIfAbsent(d.getCategoriaNombre(), k -> new java.util.ArrayList<>()).add(d);
        }
        return grupos;
    }

    private void celda(Row row, int col, String valor, CellStyle estilo) {
        Cell cell = row.createCell(col);
        cell.setCellValue(valor);
        cell.setCellStyle(estilo);
    }

    private void celdaNumero(Row row, int col, BigDecimal valor, CellStyle estilo) {
        Cell cell = row.createCell(col);
        cell.setCellValue(valor == null ? 0 : valor.doubleValue());
        cell.setCellStyle(estilo);
    }

    private String valor(String texto) {
        return texto == null || texto.isBlank() ? "—" : texto;
    }

    private String igvFactor(Cotizacion c) {
        // El porcentaje se puede ajustar en configuración; el valor guardado ya refleja el monto final.
        if (c.getSubtotalVenta() == null || c.getSubtotalVenta().compareTo(BigDecimal.ZERO) == 0
                || c.getMontoIgv() == null) {
            return "18";
        }
        return c.getMontoIgv()
                .multiply(new BigDecimal("100"))
                .divide(c.getSubtotalVenta(), 2, RoundingMode.HALF_UP)
                .stripTrailingZeros().toPlainString();
    }

    private Estilos crearEstilos(Workbook wb) {
        Font base = fuente(wb, false, 9, IndexedColors.BLACK);
        Font negrita = fuente(wb, true, 9, IndexedColors.BLACK);
        Font blanco = fuente(wb, true, 9, IndexedColors.WHITE);
        Font blancoGrande = fuente(wb, true, 17, IndexedColors.WHITE);
        Font blancoMedio = fuente(wb, true, 11, IndexedColors.WHITE);
        Font nota = fuente(wb, false, 8, IndexedColors.GREY_50_PERCENT);
        Font subitem = fuente(wb, false, 8, IndexedColors.GREY_50_PERCENT);

        CellStyle texto = estiloBase(wb, base);
        texto.setVerticalAlignment(VerticalAlignment.CENTER);
        texto.setWrapText(true);

        CellStyle textoCentro = estiloBase(wb, base);
        textoCentro.setAlignment(HorizontalAlignment.CENTER);

        CellStyle textoWrap = estiloBase(wb, base);
        textoWrap.setWrapText(true);
        textoWrap.setVerticalAlignment(VerticalAlignment.TOP);

        CellStyle subitemStyle = estiloBase(wb, subitem);
        subitemStyle.setWrapText(true);
        subitemStyle.setVerticalAlignment(VerticalAlignment.CENTER);

        CellStyle titulo = estiloBase(wb, blancoGrande);
        titulo.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        titulo.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        titulo.setAlignment(HorizontalAlignment.CENTER);
        titulo.setVerticalAlignment(VerticalAlignment.CENTER);

        CellStyle marca = estiloBase(wb, blancoMedio);
        marca.setFillForegroundColor(IndexedColors.GOLD.getIndex());
        marca.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        marca.setAlignment(HorizontalAlignment.CENTER);
        marca.setVerticalAlignment(VerticalAlignment.CENTER);

        CellStyle encabezado = estiloBase(wb, blanco);
        encabezado.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        encabezado.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        encabezado.setAlignment(HorizontalAlignment.CENTER);
        encabezado.setVerticalAlignment(VerticalAlignment.CENTER);
        encabezado.setWrapText(true);

        CellStyle categoria = estiloBase(wb, negrita);
        categoria.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
        categoria.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        categoria.setVerticalAlignment(VerticalAlignment.CENTER);

        CellStyle numero = estiloBase(wb, base);
        numero.setAlignment(HorizontalAlignment.CENTER);
        numero.setDataFormat(wb.createDataFormat().getFormat("#,##0.##"));

        CellStyle dinero = estiloBase(wb, base);
        dinero.setDataFormat(wb.createDataFormat().getFormat("#,##0.00"));
        dinero.setAlignment(HorizontalAlignment.RIGHT);

        CellStyle porcentaje = estiloBase(wb, negrita);
        porcentaje.setDataFormat(wb.createDataFormat().getFormat("0.00%"));
        porcentaje.setAlignment(HorizontalAlignment.RIGHT);
        porcentaje.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
        porcentaje.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        CellStyle etiqueta = estiloBase(wb, negrita);
        etiqueta.setVerticalAlignment(VerticalAlignment.CENTER);

        CellStyle notaStyle = estiloBase(wb, nota);
        notaStyle.setWrapText(true);

        CellStyle notaCentro = estiloBase(wb, nota);
        notaCentro.setAlignment(HorizontalAlignment.CENTER);

        CellStyle negritaStyle = estiloBase(wb, negrita);
        negritaStyle.setAlignment(HorizontalAlignment.CENTER);

        CellStyle totalEtiqueta = estiloBase(wb, negrita);
        totalEtiqueta.setAlignment(HorizontalAlignment.RIGHT);
        totalEtiqueta.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        totalEtiqueta.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        CellStyle totalValor = estiloBase(wb, negrita);
        totalValor.setDataFormat(wb.createDataFormat().getFormat("#,##0.00"));
        totalValor.setAlignment(HorizontalAlignment.RIGHT);
        totalValor.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        totalValor.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        CellStyle totalEtiquetaFuerte = estiloBase(wb, blancoMedio);
        totalEtiquetaFuerte.setAlignment(HorizontalAlignment.RIGHT);
        totalEtiquetaFuerte.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        totalEtiquetaFuerte.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        CellStyle totalValorFuerte = estiloBase(wb, blancoMedio);
        totalValorFuerte.setDataFormat(wb.createDataFormat().getFormat("#,##0.00"));
        totalValorFuerte.setAlignment(HorizontalAlignment.RIGHT);
        totalValorFuerte.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        totalValorFuerte.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        return new Estilos(titulo, marca, encabezado, categoria, texto, textoCentro, textoWrap,
                subitemStyle, numero, dinero, totalEtiqueta, totalValor, totalEtiquetaFuerte,
                totalValorFuerte, porcentaje, etiqueta, notaStyle, notaCentro, negritaStyle);
    }

    private Font fuente(Workbook wb, boolean negrita, int tamano, IndexedColors color) {
        Font font = wb.createFont();
        font.setFontName("Arial");
        font.setBold(negrita);
        font.setFontHeightInPoints((short) tamano);
        font.setColor(color.getIndex());
        return font;
    }

    private CellStyle estiloBase(Workbook wb, Font font) {
        CellStyle style = wb.createCellStyle();
        style.setFont(font);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        short colorBorde = IndexedColors.GREY_25_PERCENT.getIndex();
        style.setTopBorderColor(colorBorde);
        style.setBottomBorderColor(colorBorde);
        style.setLeftBorderColor(colorBorde);
        style.setRightBorderColor(colorBorde);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }

    private record Estilos(
            CellStyle titulo, CellStyle marca, CellStyle encabezado, CellStyle categoria,
            CellStyle texto, CellStyle textoCentro, CellStyle textoWrap, CellStyle subitem,
            CellStyle numero, CellStyle dinero, CellStyle totalEtiqueta, CellStyle totalValor,
            CellStyle totalEtiquetaFuerte, CellStyle totalValorFuerte, CellStyle porcentaje,
            CellStyle etiqueta, CellStyle nota, CellStyle notaCentro, CellStyle negrita) {
    }
}

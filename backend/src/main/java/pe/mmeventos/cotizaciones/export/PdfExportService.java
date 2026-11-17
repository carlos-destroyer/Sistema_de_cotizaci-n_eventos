package pe.mmeventos.cotizaciones.export;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfWriter;

import pe.mmeventos.cotizaciones.common.BusinessException;
import pe.mmeventos.cotizaciones.cotizacion.Cotizacion;
import pe.mmeventos.cotizaciones.cotizacion.CotizacionDetalle;
import pe.mmeventos.cotizaciones.empresa.EmpresaConfig;

@Service
public class PdfExportService {

    private static final Color GOLD = new Color(180, 138, 62);
    private static final Color GOLD_LIGHT = new Color(248, 243, 233);
    private static final Color SLATE = new Color(15, 23, 42);
    private static final Color SLATE_SOFT = new Color(71, 85, 105);
    private static final Color BORDER = new Color(226, 232, 240);
    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DecimalFormat MONTO = new DecimalFormat("#,##0.00");

    public byte[] generar(Cotizacion c, EmpresaConfig empresa) {
        Document document = new Document(PageSize.A4, 34, 34, 34, 42);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new PiePagina(empresa.getNombreComercial()));
            document.open();
            agregarEncabezado(document, c, empresa);
            agregarResumenEvento(document, c);
            agregarItems(document, c);
            agregarTotales(document, c);
            if (c.getNotasCortesia() != null && !c.getNotasCortesia().isBlank()) {
                agregarCortesias(document, c.getNotasCortesia());
            }
            agregarTerminosYFirma(document, c, empresa);
            document.close();
        } catch (DocumentException ex) {
            throw new BusinessException("No se pudo generar el PDF de la cotización.");
        }
        return out.toByteArray();
    }

    private void agregarEncabezado(Document document, Cotizacion c, EmpresaConfig e) throws DocumentException {
        PdfPTable tabla = new PdfPTable(new float[] { 3.2f, 2.2f });
        tabla.setWidthPercentage(100);

        PdfPCell izquierda = new PdfPCell();
        izquierda.setBorder(Rectangle.NO_BORDER);
        izquierda.setPadding(0);
        izquierda.addElement(new Paragraph(
                valor(e.getNombreComercial(), e.getRazonSocial(), "M&M Eventos"),
                FontFactory.getFont(FontFactory.TIMES_BOLD, 21, GOLD)));
        izquierda.addElement(new Paragraph("by Mariella Martinez", FontFactory.getFont(FontFactory.TIMES_ITALIC, 10, SLATE_SOFT)));
        izquierda.addElement(new Paragraph("RUC " + valor(e.getRuc(), "10429138430"), FontFactory.getFont(FontFactory.HELVETICA, 8, SLATE_SOFT)));
        izquierda.addElement(new Paragraph("Tel. " + valor(e.getTelefono(), "939 811 591")
                + (e.getDireccion() == null ? "" : "  |  " + e.getDireccion()), FontFactory.getFont(FontFactory.HELVETICA, 8, SLATE_SOFT)));
        if (e.getEmail() != null) {
            izquierda.addElement(new Paragraph(e.getEmail(), FontFactory.getFont(FontFactory.HELVETICA, 8, SLATE_SOFT)));
        }
        tabla.addCell(izquierda);

        PdfPCell derecha = new PdfPCell();
        derecha.setBorder(Rectangle.NO_BORDER);
        derecha.setHorizontalAlignment(Element.ALIGN_RIGHT);
        derecha.setPadding(0);
        Paragraph titulo = new Paragraph("COTIZACIÓN", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 19, SLATE));
        titulo.setAlignment(Element.ALIGN_RIGHT);
        derecha.addElement(titulo);
        Paragraph codigo = new Paragraph(c.getCodigo(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, GOLD));
        codigo.setAlignment(Element.ALIGN_RIGHT);
        derecha.addElement(codigo);
        Paragraph fechas = new Paragraph(
                "Emitida: " + c.getFechaEmision().format(FECHA)
                        + (c.getValidoHasta() == null ? "" : "   |   Válida hasta: " + c.getValidoHasta().format(FECHA)),
                FontFactory.getFont(FontFactory.HELVETICA, 8, SLATE_SOFT));
        fechas.setAlignment(Element.ALIGN_RIGHT);
        derecha.addElement(fechas);
        if (c.getVersion() != null && c.getVersion() > 1) {
            Paragraph version = new Paragraph("Versión " + c.getVersion(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, SLATE_SOFT));
            version.setAlignment(Element.ALIGN_RIGHT);
            derecha.addElement(version);
        }
        tabla.addCell(derecha);
        document.add(tabla);

        PdfPTable linea = new PdfPTable(1);
        linea.setWidthPercentage(100);
        linea.setSpacingBefore(8);
        linea.setSpacingAfter(12);
        PdfPCell celda = new PdfPCell(new Phrase(" "));
        celda.setBackgroundColor(GOLD);
        celda.setBorder(Rectangle.NO_BORDER);
        celda.setFixedHeight(2);
        linea.addCell(celda);
        document.add(linea);
    }

    private void agregarResumenEvento(Document document, Cotizacion c) throws DocumentException {
        PdfPTable tabla = new PdfPTable(new float[] { 1.25f, 3.0f, 1.25f, 3.0f });
        tabla.setWidthPercentage(100);
        tabla.setSpacingAfter(12);

        filaResumen(tabla, "Cliente", c.getCliente().getNombreRazonSocial());
        filaResumen(tabla, "Tipo de evento", valor(c.getTipoEvento(), "—"));
        filaResumen(tabla, "Fecha del evento", c.getFechaEvento() == null ? "Por confirmar" : c.getFechaEvento().format(FECHA));
        filaResumen(tabla, "Local", valor(c.getLocalEvento(), "Por confirmar"));
        filaResumen(tabla, "N° de invitados", String.valueOf(c.getCantidadInvitados()));
        filaResumen(tabla, "Temática", valor(c.getTematica(), "—"));
        filaResumen(tabla, "Paleta de colores", valor(c.getPaletaColores(), "—"));
        filaResumen(tabla, "Validez", c.getValidoHasta() == null ? "—" : c.getValidoHasta().format(FECHA));
        document.add(tabla);
    }

    private void filaResumen(PdfPTable tabla, String etiqueta, String valor) {
        PdfPCell label = new PdfPCell(new Phrase(etiqueta.toUpperCase(Locale.ROOT),
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7, SLATE_SOFT)));
        label.setBorder(Rectangle.BOTTOM);
        label.setBorderColor(BORDER);
        label.setBackgroundColor(new Color(248, 250, 252));
        label.setPadding(5);
        tabla.addCell(label);

        PdfPCell dato = new PdfPCell(new Phrase(valor, FontFactory.getFont(FontFactory.HELVETICA, 8.5f, SLATE)));
        dato.setBorder(Rectangle.BOTTOM);
        dato.setBorderColor(BORDER);
        dato.setPadding(5);
        tabla.addCell(dato);
    }

    private void agregarItems(Document document, Cotizacion c) throws DocumentException {
        Map<String, List<CotizacionDetalle>> grupos = new LinkedHashMap<>();
        for (CotizacionDetalle detalle : c.getDetalles()) {
            grupos.computeIfAbsent(detalle.getCategoriaNombre(), k -> new java.util.ArrayList<>()).add(detalle);
        }

        PdfPTable tabla = new PdfPTable(new float[] { 5.3f, 0.95f, 1.35f, 1.5f });
        tabla.setWidthPercentage(100);
        tabla.setHeaderRows(1);
        encabezadoItem(tabla, "DESCRIPCIÓN", Element.ALIGN_LEFT);
        encabezadoItem(tabla, "UNID.", Element.ALIGN_CENTER);
        encabezadoItem(tabla, "P. UNIT.", Element.ALIGN_RIGHT);
        encabezadoItem(tabla, "TOTAL", Element.ALIGN_RIGHT);

        for (Map.Entry<String, List<CotizacionDetalle>> grupo : grupos.entrySet()) {
            PdfPCell categoria = new PdfPCell(new Phrase(grupo.getKey().toUpperCase(Locale.ROOT),
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, GOLD)));
            categoria.setColspan(4);
            categoria.setBackgroundColor(GOLD_LIGHT);
            categoria.setBorderColor(BORDER);
            categoria.setPadding(5);
            tabla.addCell(categoria);

            for (CotizacionDetalle d : grupo.getValue()) {
                boolean subitem = Boolean.TRUE.equals(d.getEsSubitemInformativo());
                String texto = subitem ? "•  " + d.getDescripcion() : d.getDescripcion();
                Font fuente = subitem
                        ? FontFactory.getFont(FontFactory.HELVETICA, 7.8f, SLATE_SOFT)
                        : FontFactory.getFont(FontFactory.HELVETICA, 8.3f, SLATE);
                PdfPCell desc = new PdfPCell(new Paragraph(texto, fuente));
                desc.setBorderColor(BORDER);
                desc.setPadding(4.5f);
                if (subitem) {
                    desc.setPaddingLeft(14);
                }
                tabla.addCell(desc);
                tabla.addCell(celdaItem(subitem ? "" : cantidad(d.getUnidades()), Element.ALIGN_CENTER, subitem));
                tabla.addCell(celdaItem(subitem ? "" : "S/ " + MONTO.format(d.getPrecioUnitarioVenta()), Element.ALIGN_RIGHT, subitem));
                tabla.addCell(celdaItem(subitem ? "" : "S/ " + MONTO.format(d.getSubtotalVenta()), Element.ALIGN_RIGHT, subitem));
            }
        }
        document.add(tabla);
    }

    private void encabezadoItem(PdfPTable tabla, String texto, int alineacion) {
        PdfPCell cell = new PdfPCell(new Phrase(texto, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7, Color.WHITE)));
        cell.setBackgroundColor(SLATE);
        cell.setBorderColor(SLATE);
        cell.setHorizontalAlignment(alineacion);
        cell.setPadding(6);
        tabla.addCell(cell);
    }

    private PdfPCell celdaItem(String texto, int alineacion, boolean subitem) {
        PdfPCell cell = new PdfPCell(new Phrase(texto,
                FontFactory.getFont(FontFactory.HELVETICA, subitem ? 7.8f : 8.3f, subitem ? SLATE_SOFT : SLATE)));
        cell.setBorderColor(BORDER);
        cell.setHorizontalAlignment(alineacion);
        cell.setPadding(4.5f);
        return cell;
    }

    private void agregarTotales(Document document, Cotizacion c) throws DocumentException {
        PdfPTable contenedor = new PdfPTable(new float[] { 1f, 1f });
        contenedor.setWidthPercentage(100);
        contenedor.setSpacingBefore(10);

        PdfPCell vacio = new PdfPCell();
        vacio.setBorder(Rectangle.NO_BORDER);
        contenedor.addCell(vacio);

        PdfPCell derecha = new PdfPCell();
        derecha.setBorder(Rectangle.NO_BORDER);
        derecha.setPadding(0);
        PdfPTable totales = new PdfPTable(new float[] { 1.6f, 1.1f });
        totales.setWidthPercentage(100);
        filaTotal(totales, "Subtotal", "S/ " + MONTO.format(c.getSubtotalVenta()), false);
        if (Boolean.TRUE.equals(c.getIncluyeIgv())) {
            filaTotal(totales, "IGV (18%)", "S/ " + MONTO.format(c.getMontoIgv()), false);
        }
        filaTotal(totales, "TOTAL GENERAL", "S/ " + MONTO.format(c.getTotalVenta()), true);
        derecha.addElement(totales);
        if (c.getCantidadInvitados() != null && c.getCantidadInvitados() > 0) {
            Paragraph porPersona = new Paragraph(
                    "Ticket por persona: S/ " + MONTO.format(c.getTicketPorPersona()),
                    FontFactory.getFont(FontFactory.HELVETICA, 7.5f, SLATE_SOFT));
            porPersona.setAlignment(Element.ALIGN_RIGHT);
            porPersona.setSpacingBefore(4);
            derecha.addElement(porPersona);
        }
        Paragraph nota = new Paragraph("Precios expresados en Soles (PEN).",
                FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 7, SLATE_SOFT));
        nota.setAlignment(Element.ALIGN_RIGHT);
        nota.setSpacingBefore(2);
        derecha.addElement(nota);
        contenedor.addCell(derecha);
        document.add(contenedor);
    }

    private void filaTotal(PdfPTable tabla, String etiqueta, String valor, boolean destacado) {
        Font fuente = FontFactory.getFont(destacado ? FontFactory.HELVETICA_BOLD : FontFactory.HELVETICA,
                destacado ? 9 : 8, destacado ? Color.WHITE : SLATE);
        PdfPCell label = new PdfPCell(new Phrase(etiqueta, fuente));
        label.setHorizontalAlignment(Element.ALIGN_RIGHT);
        label.setPadding(6);
        label.setBackgroundColor(destacado ? SLATE : new Color(248, 250, 252));
        label.setBorderColor(BORDER);
        tabla.addCell(label);

        PdfPCell dato = new PdfPCell(new Phrase(valor, fuente));
        dato.setHorizontalAlignment(Element.ALIGN_RIGHT);
        dato.setPadding(6);
        dato.setBackgroundColor(destacado ? SLATE : new Color(248, 250, 252));
        dato.setBorderColor(BORDER);
        tabla.addCell(dato);
    }

    private void agregarCortesias(Document document, String cortesias) throws DocumentException {
        PdfPTable tabla = new PdfPTable(1);
        tabla.setWidthPercentage(100);
        tabla.setSpacingBefore(12);
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(new Color(255, 251, 235));
        cell.setBorderColor(new Color(245, 222, 179));
        cell.setPadding(8);
        cell.addElement(new Paragraph("CORTESÍAS Y CONSIDERACIONES",
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7.5f, GOLD)));
        Paragraph texto = new Paragraph(cortesias, FontFactory.getFont(FontFactory.HELVETICA, 8, SLATE));
        texto.setSpacingBefore(3);
        cell.addElement(texto);
        tabla.addCell(cell);
        document.add(tabla);
    }

    private void agregarTerminosYFirma(Document document, Cotizacion c, EmpresaConfig e) throws DocumentException {
        Paragraph terminosTitulo = new Paragraph("TÉRMINOS Y CONDICIONES",
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7.5f, SLATE_SOFT));
        terminosTitulo.setSpacingBefore(14);
        document.add(terminosTitulo);

        String terminos = e.getTerminosCondiciones();
        if (terminos == null || terminos.isBlank()) {
            terminos = "La cotización está sujeta a disponibilidad de fecha, personal y stock de mobiliario. "
                    + "Forma de pago: 50% de adelanto para reservar la fecha y 50% antes del evento. "
                    + "Los servicios adicionales no incluidos en esta propuesta se cotizan por separado.";
        }
        Paragraph texto = new Paragraph(terminos, FontFactory.getFont(FontFactory.HELVETICA, 7.3f, SLATE_SOFT));
        texto.setLeading(9.5f);
        document.add(texto);

        PdfPTable firma = new PdfPTable(new float[] { 1f, 1f });
        firma.setWidthPercentage(100);
        firma.setSpacingBefore(28);
        PdfPCell vacio = new PdfPCell();
        vacio.setBorder(Rectangle.NO_BORDER);
        firma.addCell(vacio);

        PdfPCell derecha = new PdfPCell();
        derecha.setBorder(Rectangle.NO_BORDER);
        derecha.setHorizontalAlignment(Element.ALIGN_CENTER);
        Paragraph linea = new Paragraph("______________________________",
                FontFactory.getFont(FontFactory.HELVETICA, 9, SLATE_SOFT));
        linea.setAlignment(Element.ALIGN_CENTER);
        derecha.addElement(linea);
        Paragraph nombre = new Paragraph("Mariella Martinez",
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, SLATE));
        nombre.setAlignment(Element.ALIGN_CENTER);
        derecha.addElement(nombre);
        Paragraph cargo = new Paragraph("Gerente General · M&M Eventos",
                FontFactory.getFont(FontFactory.HELVETICA, 7.5f, SLATE_SOFT));
        cargo.setAlignment(Element.ALIGN_CENTER);
        derecha.addElement(cargo);
        firma.addCell(derecha);
        document.add(firma);
    }

    private String valor(String... opciones) {
        for (String opcion : opciones) {
            if (opcion != null && !opcion.isBlank()) {
                return opcion;
            }
        }
        return "—";
    }

    private String cantidad(BigDecimal valor) {
        if (valor == null) {
            return "0";
        }
        if (valor.stripTrailingZeros().scale() <= 0) {
            return valor.toBigInteger().toString();
        }
        return valor.stripTrailingZeros().toPlainString();
    }

    private static class PiePagina extends PdfPageEventHelper {
        private final String empresa;

        PiePagina(String empresa) {
            this.empresa = empresa;
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            PdfPTable footer = new PdfPTable(new float[] { 3f, 1f });
            footer.setTotalWidth(document.right() - document.left());
            footer.setLockedWidth(true);
            Font font = FontFactory.getFont(FontFactory.HELVETICA, 6.8f, SLATE_SOFT);

            PdfPCell izquierda = new PdfPCell(new Phrase(
                    (empresa == null ? "M&M Eventos" : empresa) + " · Hacemos realidad cada detalle de tu celebración.",
                    font));
            izquierda.setBorder(Rectangle.TOP);
            izquierda.setBorderColor(BORDER);
            izquierda.setPaddingTop(4);
            footer.addCell(izquierda);

            PdfPCell derecha = new PdfPCell(new Phrase("Página " + writer.getPageNumber(), font));
            derecha.setBorder(Rectangle.TOP);
            derecha.setBorderColor(BORDER);
            derecha.setPaddingTop(4);
            derecha.setHorizontalAlignment(Element.ALIGN_RIGHT);
            footer.addCell(derecha);

            footer.writeSelectedRows(0, -1, document.left(), document.bottom() - 12, writer.getDirectContent());
        }
    }
}

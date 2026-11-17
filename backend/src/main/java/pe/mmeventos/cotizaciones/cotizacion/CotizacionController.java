package pe.mmeventos.cotizaciones.cotizacion;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import pe.mmeventos.cotizaciones.common.PageResponse;

@RestController
@RequestMapping("/api/cotizaciones")
public class CotizacionController {

    private final CotizacionService service;

    public CotizacionController(CotizacionService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<CotizacionDtos.ListItem> listar(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) EstadoCotizacion estado,
            @RequestParam(required = false) Long clienteId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "creadoEn") String sort,
            @RequestParam(defaultValue = "desc") String dir) {
        return service.listar(q, estado, clienteId, desde, hasta, page, size, sort, dir);
    }

    @GetMapping("/{id}")
    public CotizacionDtos.Response obtener(@PathVariable Long id) {
        return service.obtener(id);
    }

    @PostMapping
    public CotizacionDtos.Response crear(@Valid @RequestBody CotizacionDtos.Request request) {
        return service.crear(request);
    }

    @PutMapping("/{id}")
    public CotizacionDtos.Response actualizar(@PathVariable Long id,
            @Valid @RequestBody CotizacionDtos.Request request) {
        return service.actualizar(id, request);
    }

    @PatchMapping("/{id}/estado")
    public CotizacionDtos.Response cambiarEstado(@PathVariable Long id,
            @Valid @RequestBody CotizacionDtos.EstadoRequest request) {
        return service.cambiarEstado(id, request.estado());
    }

    @PostMapping("/{id}/duplicar")
    public CotizacionDtos.Response duplicar(@PathVariable Long id) {
        return service.duplicar(id);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        service.eliminar(id);
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> pdf(@PathVariable Long id) {
        byte[] contenido = service.exportarPdf(id);
        return descarga(contenido, "application/pdf", "cotizacion-" + id + ".pdf");
    }

    @GetMapping("/{id}/excel")
    public ResponseEntity<byte[]> excel(@PathVariable Long id,
            @RequestParam(defaultValue = "cliente") String tipo) {
        byte[] contenido = service.exportarExcel(id, tipo);
        String sufijo = "interno".equalsIgnoreCase(tipo) ? "-interno" : "";
        return descarga(contenido,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "cotizacion-" + id + sufijo + ".xlsx");
    }

    private ResponseEntity<byte[]> descarga(byte[] contenido, String contentType, String nombre) {
        String nombreCodificado = URLEncoder.encode(nombre, StandardCharsets.UTF_8).replace("+", "%20");
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(contentType));
        headers.setContentDisposition(ContentDisposition.attachment().filename(nombreCodificado).build());
        headers.setContentLength(contenido.length);
        return ResponseEntity.ok().headers(headers).body(contenido);
    }
}

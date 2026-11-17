package pe.mmeventos.cotizaciones.cliente;

import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import pe.mmeventos.cotizaciones.common.NotFoundException;

@Service
public class ClienteService {

    private final ClienteRepository repository;

    public ClienteService(ClienteRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ClienteDtos.Response> listar(String q, TipoCliente tipo, boolean incluirInactivos) {
        String termino = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
        return (incluirInactivos ? repository.findAllByOrderByNombreRazonSocialAsc()
                : repository.findAllByActivoTrueOrderByNombreRazonSocialAsc())
                .stream()
                .filter(c -> tipo == null || c.getTipoCliente() == tipo)
                .filter(c -> termino.isEmpty()
                        || contiene(c.getNombreRazonSocial(), termino)
                        || contiene(c.getDocumento(), termino)
                        || contiene(c.getEmail(), termino)
                        || contiene(c.getTelefono(), termino))
                .map(this::map)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ClienteDtos.Option> opciones() {
        return repository.findAllByActivoTrueOrderByNombreRazonSocialAsc().stream()
                .map(c -> new ClienteDtos.Option(c.getId(), c.getNombreRazonSocial(), c.getTipoCliente()))
                .toList();
    }

    @Transactional(readOnly = true)
    public ClienteDtos.Response obtener(Long id) {
        return map(buscar(id));
    }

    @Transactional
    public ClienteDtos.Response crear(ClienteDtos.Request request) {
        Cliente cliente = new Cliente();
        aplicar(cliente, request);
        return map(repository.save(cliente));
    }

    @Transactional
    public ClienteDtos.Response actualizar(Long id, ClienteDtos.Request request) {
        Cliente cliente = buscar(id);
        aplicar(cliente, request);
        return map(repository.save(cliente));
    }

    @Transactional
    public void desactivar(Long id) {
        Cliente cliente = buscar(id);
        cliente.setActivo(false);
        repository.save(cliente);
    }

    @Transactional(readOnly = true)
    public Cliente buscar(Long id) {
        return repository.findById(id).orElseThrow(() -> NotFoundException.de("Cliente", id));
    }

    private void aplicar(Cliente cliente, ClienteDtos.Request request) {
        cliente.setNombreRazonSocial(request.nombreRazonSocial().trim());
        cliente.setTipoCliente(request.tipoCliente() == null ? TipoCliente.SOCIAL : request.tipoCliente());
        cliente.setDocumento(request.documento());
        cliente.setTelefono(request.telefono());
        cliente.setEmail(request.email());
        cliente.setDireccion(request.direccion());
        cliente.setNotas(request.notas());
        if (request.activo() != null) {
            cliente.setActivo(request.activo());
        }
    }

    private boolean contiene(String valor, String termino) {
        return valor != null && valor.toLowerCase(Locale.ROOT).contains(termino);
    }

    private ClienteDtos.Response map(Cliente c) {
        return new ClienteDtos.Response(c.getId(), c.getNombreRazonSocial(), c.getTipoCliente(),
                c.getDocumento(), c.getTelefono(), c.getEmail(), c.getDireccion(), c.getNotas(),
                c.getActivo(), c.getCreadoEn());
    }
}

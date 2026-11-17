package pe.mmeventos.cotizaciones.common;

public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }

    public static NotFoundException de(String entidad, Object id) {
        return new NotFoundException(entidad + " no encontrado(a) con id " + id);
    }
}

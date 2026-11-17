package pe.mmeventos.cotizaciones.common;

public class BusinessException extends RuntimeException {
    public BusinessException(String message) {
        super(message);
    }
}

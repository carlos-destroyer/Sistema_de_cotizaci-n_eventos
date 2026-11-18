package pe.mmeventos.cotizaciones.seed;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import pe.mmeventos.cotizaciones.catalogo.CatalogoDtos;
import pe.mmeventos.cotizaciones.catalogo.CatalogoItem;
import pe.mmeventos.cotizaciones.catalogo.CatalogoItemRepository;
import pe.mmeventos.cotizaciones.catalogo.CatalogoService;
import pe.mmeventos.cotizaciones.catalogo.CategoriaServicio;
import pe.mmeventos.cotizaciones.catalogo.CategoriaServicioRepository;
import pe.mmeventos.cotizaciones.catalogo.ReglaCantidad;
import pe.mmeventos.cotizaciones.cliente.ClienteDtos;
import pe.mmeventos.cotizaciones.cliente.ClienteRepository;
import pe.mmeventos.cotizaciones.cliente.ClienteService;
import pe.mmeventos.cotizaciones.cliente.TipoCliente;
import pe.mmeventos.cotizaciones.cotizacion.CotizacionDtos;
import pe.mmeventos.cotizaciones.cotizacion.CotizacionService;
import pe.mmeventos.cotizaciones.cotizacion.EstadoCotizacion;
import pe.mmeventos.cotizaciones.empresa.EmpresaConfig;
import pe.mmeventos.cotizaciones.empresa.EmpresaConfigRepository;
import pe.mmeventos.cotizaciones.plantilla.PlantillaDtos;
import pe.mmeventos.cotizaciones.plantilla.PlantillaService;

@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = true)
public class SeedDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SeedDataInitializer.class);
    private static final BigDecimal CERO = BigDecimal.ZERO;

    @Value("${app.seed.empresa.razon-social:M&M Eventos - by Mariella Martinez}")
    private String seedRazonSocial;
    @Value("${app.seed.empresa.nombre-comercial:M&M Eventos}")
    private String seedNombreComercial;
    @Value("${app.seed.empresa.ruc:10429138430}")
    private String seedRuc;
    @Value("${app.seed.empresa.telefono:900 000 000}")
    private String seedTelefono;
    @Value("${app.seed.empresa.direccion:Piura - Perú}")
    private String seedDireccion;
    @Value("${app.seed.empresa.email:}")
    private String seedEmail;
    @Value("${app.seed.empresa.igv:18.00}")
    private String seedIgv;

    private final EmpresaConfigRepository empresaRepository;
    private final CategoriaServicioRepository categoriaRepository;
    private final CatalogoItemRepository catalogoRepository;
    private final ClienteRepository clienteRepository;
    private final ClienteService clienteService;
    private final CatalogoService catalogoService;
    private final PlantillaService plantillaService;
    private final CotizacionService cotizacionService;

    private final Map<String, CatalogoItem> items = new LinkedHashMap<>();
    private final Map<String, CategoriaServicio> categorias = new LinkedHashMap<>();
    private final Map<String, Long> plantillas = new LinkedHashMap<>();
    private final Map<String, Long> clientes = new LinkedHashMap<>();

    public SeedDataInitializer(EmpresaConfigRepository empresaRepository,
            CategoriaServicioRepository categoriaRepository, CatalogoItemRepository catalogoRepository,
            ClienteRepository clienteRepository, ClienteService clienteService, CatalogoService catalogoService,
            PlantillaService plantillaService, CotizacionService cotizacionService) {
        this.empresaRepository = empresaRepository;
        this.categoriaRepository = categoriaRepository;
        this.catalogoRepository = catalogoRepository;
        this.clienteRepository = clienteRepository;
        this.clienteService = clienteService;
        this.catalogoService = catalogoService;
        this.plantillaService = plantillaService;
        this.cotizacionService = cotizacionService;
    }

    @Override
    public void run(String... args) {
        if (categoriaRepository.count() > 0) {
            log.info("Datos semilla ya existentes. No se vuelven a cargar.");
            return;
        }
        log.info("Cargando catálogo, plantillas, clientes y cotizaciones de ejemplo...");
        crearEmpresa();
        crearCategorias();
        crearCatalogo();
        crearPlantillas();
        crearClientes();
        crearCotizacionesEjemplo();
        log.info("Datos semilla cargados: {} categorías, {} ítems, {} plantillas, {} clientes.",
                categorias.size(), items.size(), plantillas.size(), clientes.size());
    }

    private void crearEmpresa() {
        if (empresaRepository.count() > 0) {
            return;
        }
        EmpresaConfig empresa = new EmpresaConfig();
        empresa.setRazonSocial(seedRazonSocial);
        empresa.setNombreComercial(seedNombreComercial);
        empresa.setRuc(seedRuc);
        empresa.setTelefono(seedTelefono);
        empresa.setDireccion(seedDireccion);
        empresa.setSitioWeb(null);
        empresa.setEmail(seedEmail.isBlank() ? null : seedEmail);
        empresa.setIgvPorcentaje(new BigDecimal(seedIgv));
        empresa.setTerminosCondiciones("La cotización está sujeta a disponibilidad de fecha, personal y stock de mobiliario. "
                + "Forma de pago: 50% de adelanto para reservar la fecha y 50% antes del evento. "
                + "Los servicios adicionales no incluidos en esta propuesta se cotizan por separado.");
        empresaRepository.save(empresa);
    }

    private void crearCategorias() {
        crearCategoria("instalaciones", "Instalaciones y Permisos", 1);
        crearCategoria("decoracion", "Decoración y Ambientación", 2);
        crearCategoria("mobiliario", "Mobiliario", 3);
        crearCategoria("iluminacion", "Iluminación y Estructuras", 4);
        crearCategoria("catering", "Catering y Bebidas", 5);
        crearCategoria("bar", "Open Bar", 6);
        crearCategoria("menajeria", "Menajería", 7);
        crearCategoria("sonido", "Sonido y Show", 8);
        crearCategoria("personal", "Personal", 9);
        crearCategoria("filmacion", "Filmación y Fotografía", 10);
        crearCategoria("multimedia", "Equipos Multimedia", 11);
    }

    private void crearCategoria(String key, String nombre, int orden) {
        CategoriaServicio categoria = new CategoriaServicio();
        categoria.setNombre(nombre);
        categoria.setOrden(orden);
        categoria.setActivo(true);
        categorias.put(key, categoriaRepository.save(categoria));
    }

    private void crearCatalogo() {
        // Instalaciones y permisos
        item("instalaciones", "instalacion_local", "Instalaciones del local con exclusividad",
                "Uso exclusivo del local durante el evento, con servicios generales debidamente organizados.",
                "Global", "2500.00", "1800.00", ReglaCantidad.NINGUNA, null);
        item("instalaciones", "apdayc", "Pago de derechos APDAYC",
                "Pago de derechos de comunicación pública para la música utilizada durante el evento.",
                "Global", "700.00", "500.00", ReglaCantidad.NINGUNA, null);
        item("instalaciones", "toldo_tubular", "Toldo tubular 20x20 con techo estrellado",
                "Instalación de toldo tubular perimetral de 20x20, iluminado con techo estrellado, columnas rectangulares y pista de baile.",
                "Global", "6000.00", "2000.00", ReglaCantidad.NINGUNA, null);
        item("instalaciones", "toldo_estructural", "Toldo estructural a dos niveles 18x24",
                "Toldo estructural a dos niveles con luces lineales y cadenetas de focos empavonados, según temática del cliente.",
                "Global", "12800.00", "11000.00", ReglaCantidad.NINGUNA, null);
        item("instalaciones", "tarima_escenario", "Tarima de escenario 7.20 x 3.60 m",
                "Tarima de escenario tapizada en negro con gradas de acceso, altura de 0.60 m.",
                "Global", "2500.00", "1500.00", ReglaCantidad.NINGUNA, null);

        // Decoración
        item("decoracion", "backing", "Backing principal temático con mobiliario decorativo",
                "Backing decorado según temática y paleta: ventanales, follaje, mesas, cristalería, candelabros, arreglos florales y luminaria.",
                "Global", "1800.00", "1000.00", ReglaCantidad.NINGUNA, null);
        item("decoracion", "escenografia", "Escenografía principal temática",
                "Fondo estructural, arcos orgánicos, pedestales y arreglo floral natural o artificial de lujo.",
                "Global", "2400.00", "1350.00", ReglaCantidad.NINGUNA, null);
        item("decoracion", "mesa_novios", "Mesa principal para los novios o quinceañera",
                "Mesa de honor con respaldar de columnas, lámpara de cristal, arreglos florales, candelabros y sillas principales.",
                "Global", "1500.00", "800.00", ReglaCantidad.NINGUNA, null);
        item("decoracion", "altar", "Altar o pérgola para ceremonia",
                "Pérgola con arco de flores, iluminación específica, mesa y sillas para los novios y el oficiante.",
                "Global", "2000.00", "400.00", ReglaCantidad.NINGUNA, null);
        item("decoracion", "tunel", "Túnel de ingreso decorado con alfombra roja",
                "Portal de ingreso decorado, con iluminación cálida, alfombra roja y detalles de lámparas y tapetes.",
                "Global", "1000.00", "500.00", ReglaCantidad.NINGUNA, null);
        item("decoracion", "instagram", "Zona instagrameable para invitados",
                "Espacio temático para fotografías, con backing iluminado y accesorios decorativos.",
                "Global", "800.00", "200.00", ReglaCantidad.NINGUNA, null);
        item("decoracion", "bienvenida", "Estación de bienvenida con espejo selfie",
                "Estación de recepción con espejo selfie y mensaje personalizado para los invitados.",
                "Global", "300.00", "200.00", ReglaCantidad.NINGUNA, null);
        item("decoracion", "photobooth", "Photobooth con cámara giratoria 360°",
                "Cabina 360° con iluminación, accesorios y entrega digital de las fotografías.",
                "Global", "900.00", "500.00", ReglaCantidad.NINGUNA, null);
        item("decoracion", "estacion_shots", "Estación de shots de bienvenida",
                "Estación de shots instalada al ingreso para el recibimiento de los invitados.",
                "Global", "700.00", "300.00", ReglaCantidad.NINGUNA, null);
        item("decoracion", "chisperos", "Chisperos para ingreso y baile",
                "Chisperos fríos para el momento de ingreso y baile, previa coordinación con los anfitriones.",
                "Unidad", "70.00", "20.00", ReglaCantidad.NINGUNA, null);
        item("decoracion", "iglesia", "Decoración de iglesia coordinada con la paleta",
                "Arreglo principal del altar, pedestales florales, camino nupcial y decoración de bancas con tul y flores.",
                "Global", "1500.00", "700.00", ReglaCantidad.NINGUNA, null);
        item("decoracion", "cortinas", "Cortinaje y techo blondeado para ambiente",
                "Techos y cortinas en tonos de la temática para ambientar el local.",
                "Global", "500.00", "200.00", ReglaCantidad.NINGUNA, null);
        item("decoracion", "portatorta", "Lámpara de cristal colgante para torta",
                "Lámpara de cristal colgante para iluminar y destacar la mesa de la torta.",
                "Global", "300.00", "200.00", ReglaCantidad.NINGUNA, null);
        item("decoracion", "letras_led", "Letras gigantes luminosas con iniciales",
                "Letras LED personalizadas con las iniciales o el número del evento.",
                "Global", "400.00", "150.00", ReglaCantidad.NINGUNA, null);
        item("decoracion", "centro_mesa", "Centro de mesa con arreglo floral",
                "Centro de mesa alto o bajo con bases doradas y follaje floral según la paleta de colores.",
                "Unidad", "30.00", "15.00", ReglaCantidad.POR_MESA, null);
        item("decoracion", "camino_mesa", "Camino de mesa decorativo",
                "Camino de mesa en tela fina a tono con la decoración general.",
                "Unidad", "10.00", "4.00", ReglaCantidad.POR_MESA, null);
        item("decoracion", "servilletas", "Servilletas de tela brocadas",
                "Servilleta de tela brocada, disponible en la paleta de colores elegida.",
                "Unidad", "1.00", "0.40", ReglaCantidad.POR_INVITADO, null);

        // Mobiliario
        item("mobiliario", "silla_tiffany", "Silla Tiffany dorada o blanca con cojín",
                "Silla Tiffany dorada o blanca con cojín acolchado, instalada y distribuida en el local.",
                "Unidad", "5.00", "2.50", ReglaCantidad.POR_INVITADO, 200);
        item("mobiliario", "silla_plastica", "Silla plástica blanca",
                "Silla plástica blanca reforzada para eventos sociales y corporativos.",
                "Unidad", "3.00", "1.50", ReglaCantidad.POR_INVITADO, 250);
        item("mobiliario", "mesa_redonda", "Mesa redonda con mantel brocado",
                "Mesa redonda para 8 a 10 personas, vestida con mantel brocado y camino de mesa.",
                "Unidad", "30.00", "15.00", ReglaCantidad.POR_MESA, 40);
        item("mobiliario", "mesa_honor", "Mesa principal de honor o torta",
                "Mesa principal en acero dorado y espejo, acondicionada para la torta o la mesa de honor.",
                "Global", "380.00", "180.00", ReglaCantidad.NINGUNA, 2);
        item("mobiliario", "lounge", "Sala lounge completa",
                "Sofá de tres cuerpos, dos puffs y mesa de centro para zona lounge.",
                "Unidad", "320.00", "160.00", ReglaCantidad.NINGUNA, 6);
        item("mobiliario", "mesa_cubo", "Mesa cubo de madera",
                "Mesa cubo de madera natural para ambientación de zonas lounge o buffet.",
                "Unidad", "45.00", "20.00", ReglaCantidad.NINGUNA, 6);
        item("mobiliario", "mesa_espejo", "Mesa espejada",
                "Mesa espejada de diferentes alturas para decoración de zonas especiales.",
                "Unidad", "250.00", "100.00", ReglaCantidad.NINGUNA, 3);
        item("mobiliario", "mesa_acrilico", "Mesa acrílica cuadrada o hexagonal",
                "Mesa acrílica transparente para ambientación moderna.",
                "Unidad", "150.00", "70.00", ReglaCantidad.NINGUNA, 4);
        item("mobiliario", "cilindro_madera", "Cilindro de madera",
                "Cilindro de madera decorativo para centros de mesa o ambientación.",
                "Unidad", "80.00", "35.00", ReglaCantidad.NINGUNA, 6);

        // Iluminación y estructuras
        item("iluminacion", "cadeneta", "Cadeneta de focos empavonados",
                "Cadeneta de focos empavonados con luz cálida para ambientación del local, por metro instalado.",
                "Metro", "3.00", "1.20", ReglaCantidad.NINGUNA, 200);
        item("iluminacion", "parled", "Parled LED",
                "Parled LED para iluminación de ambientación y pista de baile.",
                "Unidad", "40.00", "20.00", ReglaCantidad.NINGUNA, 24);
        item("iluminacion", "arania", "Araña mediana decorativa",
                "Araña mediana de cristal para iluminación decorativa de zonas principales.",
                "Unidad", "500.00", "250.00", ReglaCantidad.NINGUNA, 3);
        item("iluminacion", "lampara_cristal", "Lámpara de cristal de mesa",
                "Lámpara de cristal de mesa para la mesa principal o zona de torta.",
                "Unidad", "1200.00", "600.00", ReglaCantidad.NINGUNA, 1);
        item("iluminacion", "lampara_led", "Lámpara LED decorativa 3 m",
                "Lámpara LED decorativa de 3 metros de diámetro para ambientación.",
                "Global", "1000.00", "500.00", ReglaCantidad.NINGUNA, 1);
        item("iluminacion", "luces_lineales", "Luces lineales LED 100 m",
                "Set de luces lineales LED de 100 metros (1000 focos) para ambientación perimetral.",
                "Set", "100.00", "50.00", ReglaCantidad.NINGUNA, 6);
        item("iluminacion", "focos_tira", "Tira de focos empavonados 30 m",
                "Tira de 30 metros de focos empavonados para ambientación cálida.",
                "Unidad", "300.00", "150.00", ReglaCantidad.NINGUNA, 8);
        item("iluminacion", "estructura_tubular", "Estructura tubular de 4 a 6 m de altura",
                "Estructura tubular de 1.5 pulgadas de diámetro y 2.5 mm de espesor, según requerimiento del local.",
                "Unidad", "100.00", "50.00", ReglaCantidad.NINGUNA, 60);
        item("iluminacion", "parlante", "Parlante profesional",
                "Parlante profesional amplificado para refuerzo de sonido.",
                "Unidad", "300.00", "150.00", ReglaCantidad.NINGUNA, 12);

        // Catering
        item("catering", "cena", "Cena de gala (entrada + plato de fondo)",
                "Cena servida a la mesa con entrada y plato de fondo gourmet, a elección previa degustación.",
                "Unidad", "25.00", "15.00", ReglaCantidad.POR_INVITADO, null);
        item("catering", "bocaditos", "Bocaditos gourmet en cajita personalizada",
                "Ronda de bocaditos salados y dulces gourmet en cajita personalizada con sticker.",
                "Unidad", "12.00", "7.00", ReglaCantidad.POR_INVITADO, null);
        item("catering", "chocolateria", "Bocaditos de chocolatería fina para buffet",
                "Selección de yemitas, chocolates con frutos secos, castillos de cereza, pecanas y trufas para el buffet principal.",
                "Centenar", "150.00", "80.00", ReglaCantidad.NINGUNA, null);
        item("catering", "torta", "Torta temática 2 kg de masa elástica",
                "Torta de 2 kg en masa elástica o buttercream, decorada según la temática del evento.",
                "Global", "700.00", "420.00", ReglaCantidad.NINGUNA, null);
        item("catering", "gaseosa", "Gaseosa (3 jarras por mesa)",
                "Servicio de gaseosa durante la cena, calculado por mesa.",
                "Global", "150.00", "70.00", ReglaCantidad.NINGUNA, null);
        item("catering", "agua", "Agua ilimitada",
                "Servicio de agua ilimitada durante todo el evento.",
                "Global", "50.00", "20.00", ReglaCantidad.NINGUNA, null);
        item("catering", "brindis", "Brindis con champagne",
                "Copa de champagne para el brindis de honor, coordinada con el momento del evento.",
                "Global", "200.00", "100.00", ReglaCantidad.NINGUNA, null);

        // Open Bar
        item("bar", "open_bar", "Open Bar ilimitado 5 horas",
                "Barra iluminada, bartender, cristalería, utensilios de bar, hielo y carta de tragos a elección.",
                "Global", "1400.00", "820.00", ReglaCantidad.NINGUNA, null);
        item("bar", "trago", "Trago de open bar",
                "Trago preparado por el bartender dentro de la carta contratada.",
                "Trago", "7.00", "3.00", ReglaCantidad.NINGUNA, null);
        item("bar", "barra", "Barra capitoné iluminada",
                "Barra capitoné iluminada con acabados elegantes para el servicio de open bar.",
                "Global", "600.00", "300.00", ReglaCantidad.NINGUNA, null);

        // Menajería
        item("menajeria", "menaje", "Juego de menaje completo por persona",
                "Jarras, vasos, copas de champagne, copa de vino, plato de sitio, plato de fondo, cuchillo y tenedor hotelero.",
                "Unidad", "6.00", "3.00", ReglaCantidad.POR_INVITADO, null);
        item("menajeria", "menaje_premium", "Menaje premium con plato base dorado",
                "Juego de menaje premium con plato base dorado, plato de fondo, cubiertos dorados y cristalería fina.",
                "Unidad", "10.00", "5.00", ReglaCantidad.POR_INVITADO, null);

        // Sonido y show
        item("sonido", "sonido_dj", "Sonido profesional con DJ (7 horas)",
                "Parlantes profesionales amplificados, cabina para DJ, consola, micrófonos inalámbricos y DJ profesional por 7 horas.",
                "Global", "1300.00", "800.00", ReglaCantidad.NINGUNA, null);
        item("sonido", "maestro_ceremonia", "Maestro de ceremonia",
                "Locución y conducción del evento a cargo de maestro de ceremonia.",
                "Global", "250.00", "150.00", ReglaCantidad.NINGUNA, null);
        item("sonido", "hora_loca", "Hora loca temática con bailarines y cotillón",
                "Show temático con bailarines, robot LED, cotillón, accesorios y juegos de entretenimiento.",
                "Global", "1200.00", "700.00", ReglaCantidad.NINGUNA, null);
        item("sonido", "orquesta", "Orquesta con 10 músicos en escena",
                "Orquesta con 10 músicos, 3 cantantes y animador, con repertorio variado e instrumentos en vivo.",
                "Global", "2500.00", "1800.00", ReglaCantidad.NINGUNA, null);

        // Personal
        item("personal", "organizadora", "Organizadora general del evento",
                "Coordinación cuidadosa del timing antes y durante el evento.",
                "Global", "300.00", "150.00", ReglaCantidad.NINGUNA, null);
        item("personal", "anfitriona", "Anfitriona de recepción",
                "Anfitriona para recepción y orientación de los invitados durante el evento.",
                "Global", "100.00", "50.00", ReglaCantidad.NINGUNA, null);
        item("personal", "mozo", "Mozo uniformado",
                "Personal de servicio uniformado, calculado según el número de invitados (1 mozo por cada 20 personas, mínimo 2).",
                "Unidad", "100.00", "60.00", ReglaCantidad.POR_MOZO, null);
        item("personal", "vigilante", "Vigilante",
                "Personal de seguridad y vigilancia durante el evento.",
                "Unidad", "150.00", "80.00", ReglaCantidad.NINGUNA, null);
        item("personal", "toldero", "Pago de tolderos",
                "Personal especializado para el montaje y desmontaje de toldos y estructuras.",
                "Unidad", "500.00", "300.00", ReglaCantidad.NINGUNA, null);
        item("personal", "ayudante", "Ayudante de montaje",
                "Personal de apoyo para montaje y desmontaje de mobiliario y decoración.",
                "Unidad", "200.00", "120.00", ReglaCantidad.NINGUNA, null);

        // Filmación y fotografía
        item("filmacion", "foto_video", "Fotografía y video Full HD + reel + USB",
                "Cobertura completa de fotografía y video Full HD, resumen tipo reel y USB personalizado.",
                "Global", "1350.00", "850.00", ReglaCantidad.NINGUNA, null);
        item("filmacion", "pre_sesion", "Pre-sesión de fotos",
                "Sesión fotográfica previa al evento en locación a coordinar.",
                "Global", "500.00", "250.00", ReglaCantidad.NINGUNA, null);
        item("filmacion", "cuadro_firmas", "Cuadro de firmas personalizado",
                "Cuadro de firmas con diseño personalizado para el evento.",
                "Global", "250.00", "120.00", ReglaCantidad.NINGUNA, null);

        // Multimedia
        item("multimedia", "pantalla_led", "Pantalla LED con programador",
                "Pantalla LED con programador encargado de musicalizar y proyectar contenido durante el evento.",
                "Global", "1500.00", "800.00", ReglaCantidad.NINGUNA, null);
        item("multimedia", "microfonos", "Micrófonos inalámbricos",
                "Micrófonos inalámbricos con instalación y prueba de sonido.",
                "Unidad", "50.00", "20.00", ReglaCantidad.NINGUNA, null);
        item("multimedia", "wifi", "Conexión a red WiFi",
                "Implementación de red WiFi para el evento.",
                "Global", "100.00", "40.00", ReglaCantidad.NINGUNA, null);
        item("multimedia", "instalacion_sonido", "Instalación de sonido",
                "Instalación, cableado y prueba de sonido para el evento.",
                "Global", "500.00", "300.00", ReglaCantidad.NINGUNA, null);
    }

    private void item(String categoriaKey, String key, String nombre, String descripcion, String unidad,
            String precio, String costo, ReglaCantidad regla, Integer stock) {
        CatalogoItem item = new CatalogoItem();
        item.setCategoria(categorias.get(categoriaKey));
        item.setNombre(nombre);
        item.setDescripcion(descripcion);
        item.setUnidadMedida(unidad);
        item.setPrecioVenta(new BigDecimal(precio));
        item.setCostoInterno(new BigDecimal(costo));
        item.setReglaCantidad(regla);
        item.setStockReferencial(stock);
        item.setActivo(true);
        items.put(key, catalogoRepository.save(item));
    }

    private void crearPlantillas() {
        plantillas.put("quince", crearPlantilla("Quinceañero Completo", "Quinceañero",
                "Estructura completa para una celebración de quince años con decoración, catering, barra, sonido y personal.",
                false,
                detalle("escenografia", "1"), detalle("centro_mesa", "1"), detalle("tunel", "1"),
                detalle("silla_tiffany", "1"), detalle("mesa_redonda", "1"), detalle("mesa_honor", "1"),
                detalle("cena", "1"), detalle("torta", "1"), detalle("open_bar", "1"),
                subitem("Carta incluida: chilcano clásico y de maracuyá, mojito, piña colada, cuba libre y algarrobina."),
                detalle("menaje", "1"), detalle("sonido_dj", "1"), detalle("hora_loca", "1"),
                detalle("mozo", "1"), detalle("foto_video", "1")));

        plantillas.put("boda", crearPlantilla("Boda Elegante", "Boda",
                "Propuesta romántica y clásica con ambientación, mobiliario, cena, barra y cobertura audiovisual.",
                false,
                detalle("backing", "1"), detalle("centro_mesa", "1"), detalle("mesa_novios", "1"),
                detalle("silla_tiffany", "1"), detalle("mesa_redonda", "1"), detalle("lounge", "2"),
                detalle("cena", "1"), detalle("bocaditos", "1"), detalle("torta", "1"),
                detalle("open_bar", "1"), detalle("menaje", "1"), detalle("sonido_dj", "1"),
                detalle("maestro_ceremonia", "1"), detalle("mozo", "1"), detalle("foto_video", "1"), detalle("iglesia", "1")));

        plantillas.put("corporativo", crearPlantilla("Corporativo con IGV", "Corporativo",
                "Evento de integración empresarial con montaje, alimentación, multimedia y personal de servicio.",
                true,
                detalle("instalacion_local", "1"), detalle("centro_mesa", "1"), detalle("silla_tiffany", "1"),
                detalle("mesa_redonda", "1"), detalle("lounge", "3"), detalle("cena", "1"),
                detalle("bocaditos", "1"), detalle("menaje", "1"), detalle("sonido_dj", "1"),
                detalle("pantalla_led", "1"), detalle("microfonos", "3"), detalle("mozo", "1"),
                detalle("organizadora", "1")));

        plantillas.put("infantil", crearPlantilla("Fiesta Infantil", "Infantil",
                "Celebración infantil con escenografía temática, bocaditos, torta, sonido y entretenimiento.",
                false,
                detalle("escenografia", "1"), detalle("silla_tiffany", "1"), detalle("mesa_redonda", "1"),
                detalle("bocaditos", "1"), detalle("torta", "1"), detalle("sonido_dj", "1"),
                detalle("photobooth", "1"), detalle("mozo", "1")));
    }

    private Long crearPlantilla(String nombre, String tipo, String descripcion, boolean igv,
            DetalleSeed... seed) {
        List<PlantillaDtos.DetalleRequest> detalles = new ArrayList<>();
        int orden = 0;
        for (DetalleSeed s : seed) {
            CatalogoItem item = items.get(s.key());
            if (item == null) {
                continue;
            }
            String descripcionDetalle = s.descripcion() != null ? s.descripcion() : item.getDescripcion();
            if (descripcionDetalle == null || descripcionDetalle.isBlank()) {
                descripcionDetalle = item.getNombre();
            }
            detalles.add(new PlantillaDtos.DetalleRequest(
                    item.getId(), item.getCategoria().getNombre(), descripcionDetalle,
                    new BigDecimal(s.cantidad()), item.getPrecioVenta(), item.getCostoInterno(),
                    s.subitem(), orden++));
        }
        PlantillaDtos.Response creada = plantillaService.crear(new PlantillaDtos.Request(
                nombre, tipo, descripcion, igv, true, detalles));
        return creada.id();
    }

    private void crearClientes() {
        clientes.put("roberto", cliente("Sr. Roberto Palacios (Quinceañero Valeria)", TipoCliente.SOCIAL,
                "DNI 00000001", "900 000 001", "cliente1@demo.local", "Castilla - Piura"));
        clientes.put("stiwar", cliente("Novios Stiwar & Camila", TipoCliente.SOCIAL,
                null, "900 000 002", "cliente2@demo.local", "Piura"));
        clientes.put("mifarma", cliente("MiFarma S.A.C.", TipoCliente.CORPORATIVO,
                null, "900 000 003", "cliente3@demo.local", "Lima"));
        clientes.put("andrea", cliente("Sra. Andrea Silva (Cumpleaños Mateo)", TipoCliente.SOCIAL,
                "DNI 00000004", "900 000 004", "cliente4@demo.local", "Piura"));
        clientes.put("colegio", cliente("Colegio de Biólogos de Piura", TipoCliente.CORPORATIVO,
                null, "900 000 005", "cliente5@demo.local", "Piura"));
        clientes.put("ruth", cliente("Sra. Ruth Palacios (Bodas de Plata)", TipoCliente.SOCIAL,
                "DNI 00000006", "900 000 006", null, "Catacaos"));
    }

    private Long cliente(String nombre, TipoCliente tipo, String documento, String telefono, String email, String direccion) {
        ClienteDtos.Response c = clienteService.crear(new ClienteDtos.Request(
                nombre, tipo, documento, telefono, email, direccion, null, true));
        return c.id();
    }

    private void crearCotizacionesEjemplo() {
        LocalDate hoy = LocalDate.now();

        // 1) Quinceañero aprobado, evento el próximo mes.
        Long quince = crearCotizacion("quince", "roberto", 100, EstadoCotizacion.APROBADA,
                hoy.minusDays(18), hoy.plusDays(45), "Club Grau de Piura",
                "Quinceañero", "Princesa Moderna - Dorado, Blanco y Palo Rosa",
                "Cuadro de firmas personalizado, letras gigantes luminosas XV y brindis para la mesa de honor.",
                false);

        // 2) Boda enviada y su versión 2 en borrador para demostrar versionado.
        Long boda = crearCotizacion("boda", "stiwar", 120, EstadoCotizacion.ENVIADA,
                hoy.minusDays(10), hoy.plusDays(70), "Fundo Stiwar",
                "Boda", "Romántico Clásico - Blanco Marfil, Verde Olivo y Dorado",
                "Decoración de auto nupcial, bouquet de novia y habitación de cortesía para arreglo.",
                false);
        CotizacionDtos.Response version2 = cotizacionService.duplicar(boda);
        cotizacionService.cambiarEstado(version2.id(), EstadoCotizacion.BORRADOR);

        // 3) Corporativo aprobado con IGV.
        crearCotizacion("corporativo", "mifarma", 150, EstadoCotizacion.APROBADA,
                hoy.minusDays(35), hoy.plusDays(25), "Hotel Costa del Sol Wyndham",
                "Corporativo", "Aniversario Corporativo - Colores Institucionales",
                "Backing fotográfico con logo de marca y podio con arreglo floral.",
                true);

        // 4) Infantil en borrador.
        crearCotizacion("infantil", "andrea", 60, EstadoCotizacion.BORRADOR,
                hoy.minusDays(3), hoy.plusDays(20), "Casino Militar de Piura",
                "Infantil", "Safari Aventura - Tonos Tierra, Verde Salvia y Dorado",
                "Piñata temática artesanal y bolsitas dulceras personalizadas.",
                false);

        // 5) Evento pasado rechazado.
        crearCotizacion("corporativo", "colegio", 80, EstadoCotizacion.RECHAZADA,
                hoy.minusMonths(2), hoy.minusMonths(1), "Local institucional - Piura",
                "Corporativo", "Aniversario Institucional",
                "Podium con arreglo floral y backing institucional.",
                true);

        // 6) Histórico aprobado para la serie mensual.
        crearCotizacion("boda", "ruth", 90, EstadoCotizacion.APROBADA,
                hoy.minusMonths(3), hoy.minusMonths(2), "Casa Club Catacaos",
                "Bodas de Plata", "Romántico Clásico - Blanco y Dorado",
                "Mesa de recuerdos y brindis especial para los homenajeados.",
                false);

        // 7) Cotización adicional del mes para el tablero.
        crearCotizacion("quince", "roberto", 110, EstadoCotizacion.ENVIADA,
                hoy.minusDays(2), hoy.plusDays(90), "Local por confirmar",
                "Quinceañero", "Temática por definir con la quinceañera",
                "Sesión de fotos previa y cuadro de firmas.",
                false);

        log.info("Cotizaciones de ejemplo creadas. Base: {}", quince);
    }

    private Long crearCotizacion(String plantillaKey, String clienteKey, int invitados, EstadoCotizacion estado,
            LocalDate emision, LocalDate fechaEvento, String local, String tipoEvento, String tematica,
            String cortesias, boolean igv) {
        Long plantillaId = plantillas.get(plantillaKey);
        if (plantillaId == null) {
            return null;
        }
        PlantillaDtos.AplicadaResponse aplicada = plantillaService.aplicar(plantillaId, invitados);
        List<CotizacionDtos.DetalleRequest> detalles = aplicada.detalles().stream()
                .map(d -> new CotizacionDtos.DetalleRequest(
                        d.categoriaNombre(), d.descripcion(), d.cantidad(), d.precioVenta(),
                        d.costoInterno(), d.esSubitem(), d.orden()))
                .toList();
        CotizacionDtos.Request request = new CotizacionDtos.Request(
                clientes.get(clienteKey), null, emision, emision.plusDays(15), fechaEvento, local,
                invitados, tipoEvento, tematica, null, igv, cortesias, null, estado, detalles);
        return cotizacionService.crear(request).id();
    }

    private DetalleSeed detalle(String key, String cantidad) {
        return new DetalleSeed(key, cantidad, false, null);
    }

    private DetalleSeed subitem(String descripcion) {
        return new DetalleSeed("open_bar", "1", true, descripcion);
    }

    private record DetalleSeed(String key, String cantidad, boolean subitem, String descripcion) {
    }
}

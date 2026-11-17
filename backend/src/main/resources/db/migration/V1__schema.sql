-- ============================================================
-- M&M Eventos - Sistema de Cotizaciones
-- Esquema relacional PostgreSQL
-- ============================================================

CREATE TABLE empresa_config (
    id                  BIGSERIAL PRIMARY KEY,
    razon_social        VARCHAR(200) NOT NULL,
    nombre_comercial    VARCHAR(200),
    ruc                 VARCHAR(20),
    telefono            VARCHAR(40),
    email               VARCHAR(120),
    direccion           VARCHAR(250),
    sitio_web           VARCHAR(150),
    logo_url            VARCHAR(300),
    igv_porcentaje      NUMERIC(5,2) NOT NULL DEFAULT 18.00,
    terminos_condiciones TEXT,
    actualizado_en      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clientes (
    id                  BIGSERIAL PRIMARY KEY,
    nombre_razon_social VARCHAR(200) NOT NULL,
    tipo_cliente        VARCHAR(20) NOT NULL DEFAULT 'SOCIAL',
    documento           VARCHAR(20),
    telefono            VARCHAR(40),
    email               VARCHAR(120),
    direccion           VARCHAR(250),
    notas               TEXT,
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categorias_servicio (
    id      BIGSERIAL PRIMARY KEY,
    nombre  VARCHAR(120) NOT NULL UNIQUE,
    orden   INTEGER NOT NULL DEFAULT 0,
    activo  BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE catalogo_items (
    id                  BIGSERIAL PRIMARY KEY,
    categoria_id        BIGINT NOT NULL REFERENCES categorias_servicio(id),
    nombre              VARCHAR(180) NOT NULL,
    descripcion         TEXT,
    unidad_medida       VARCHAR(40) NOT NULL DEFAULT 'Unidad',
    precio_venta        NUMERIC(12,2) NOT NULL DEFAULT 0,
    costo_interno       NUMERIC(12,2) NOT NULL DEFAULT 0,
    stock_referencial   INTEGER,
    regla_cantidad      VARCHAR(20) NOT NULL DEFAULT 'NINGUNA',
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE plantillas_evento (
    id              BIGSERIAL PRIMARY KEY,
    nombre          VARCHAR(160) NOT NULL,
    tipo_evento     VARCHAR(80) NOT NULL,
    descripcion     TEXT,
    incluye_igv     BOOLEAN NOT NULL DEFAULT FALSE,
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE plantilla_detalles (
    id                  BIGSERIAL PRIMARY KEY,
    plantilla_id        BIGINT NOT NULL REFERENCES plantillas_evento(id) ON DELETE CASCADE,
    catalogo_item_id    BIGINT REFERENCES catalogo_items(id) ON DELETE SET NULL,
    categoria_nombre    VARCHAR(120) NOT NULL,
    descripcion         TEXT NOT NULL,
    cantidad_base       NUMERIC(12,2) NOT NULL DEFAULT 1,
    precio_venta        NUMERIC(12,2) NOT NULL DEFAULT 0,
    costo_interno       NUMERIC(12,2) NOT NULL DEFAULT 0,
    es_subitem          BOOLEAN NOT NULL DEFAULT FALSE,
    orden               INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE cotizaciones (
    id                      BIGSERIAL PRIMARY KEY,
    codigo                  VARCHAR(40) NOT NULL UNIQUE,
    cliente_id              BIGINT NOT NULL REFERENCES clientes(id),
    fecha_emision           DATE NOT NULL,
    valido_hasta            DATE,
    fecha_evento            DATE,
    local_evento            VARCHAR(220),
    cantidad_invitados      INTEGER NOT NULL DEFAULT 0,
    tipo_evento             VARCHAR(80),
    tematica                VARCHAR(220),
    paleta_colores          VARCHAR(220),
    incluye_igv             BOOLEAN NOT NULL DEFAULT FALSE,
    notas_cortesia          TEXT,
    notas_internas          TEXT,
    estado                  VARCHAR(20) NOT NULL DEFAULT 'BORRADOR',
    version                 INTEGER NOT NULL DEFAULT 1,
    cotizacion_origen_id    BIGINT REFERENCES cotizaciones(id) ON DELETE SET NULL,
    subtotal_venta          NUMERIC(12,2) NOT NULL DEFAULT 0,
    monto_igv               NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_venta             NUMERIC(12,2) NOT NULL DEFAULT 0,
    costo_interno_total     NUMERIC(12,2) NOT NULL DEFAULT 0,
    ganancia_estimada       NUMERIC(12,2) NOT NULL DEFAULT 0,
    ticket_por_persona      NUMERIC(12,2) NOT NULL DEFAULT 0,
    creado_en               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cotizacion_detalles (
    id                      BIGSERIAL PRIMARY KEY,
    cotizacion_id           BIGINT NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
    categoria_nombre        VARCHAR(120) NOT NULL,
    orden                   INTEGER NOT NULL DEFAULT 0,
    descripcion             TEXT NOT NULL,
    es_subitem_informativo  BOOLEAN NOT NULL DEFAULT FALSE,
    unidades                NUMERIC(12,2) NOT NULL DEFAULT 1,
    precio_unitario_venta   NUMERIC(12,2) NOT NULL DEFAULT 0,
    subtotal_venta          NUMERIC(12,2) NOT NULL DEFAULT 0,
    costo_unitario_interno  NUMERIC(12,2) NOT NULL DEFAULT 0,
    subtotal_costo_interno  NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_clientes_nombre ON clientes (LOWER(nombre_razon_social));
CREATE INDEX idx_catalogo_categoria ON catalogo_items (categoria_id);
CREATE INDEX idx_cotizaciones_cliente ON cotizaciones (cliente_id);
CREATE INDEX idx_cotizaciones_estado ON cotizaciones (estado);
CREATE INDEX idx_cotizaciones_fecha_evento ON cotizaciones (fecha_evento);
CREATE INDEX idx_cotizaciones_fecha_emision ON cotizaciones (fecha_emision);
CREATE INDEX idx_detalles_cotizacion ON cotizacion_detalles (cotizacion_id);
CREATE INDEX idx_plantilla_detalles ON plantilla_detalles (plantilla_id);

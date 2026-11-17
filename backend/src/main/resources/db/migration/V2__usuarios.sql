-- ============================================================
-- M&M Eventos - Usuarios y autenticación
-- ============================================================

CREATE TABLE usuarios (
    id              BIGSERIAL PRIMARY KEY,
    username        VARCHAR(60) NOT NULL UNIQUE,
    password_hash   VARCHAR(200) NOT NULL,
    nombre          VARCHAR(150) NOT NULL,
    email           VARCHAR(150),
    rol             VARCHAR(20) NOT NULL DEFAULT 'USUARIO',
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
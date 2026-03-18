-- ============================================================
-- SCHEMA PRINCIPAL - Casas Web
-- ============================================================

-- Tabla: propiedades
-- Información de cada casa/cabaña disponible para renta
CREATE TABLE propiedades (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre       TEXT NOT NULL,
  descripcion  TEXT,
  ubicacion    TEXT,
  precio_noche NUMERIC(10,2),
  precio_semana NUMERIC(10,2),
  precio_mes   NUMERIC(10,2),
  capacidad    INT,              -- número máximo de personas
  activa       BOOLEAN NOT NULL DEFAULT true,
  whatsapp     TEXT,             -- número con código de país: 573001234567
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla: fotos_propiedades
-- Galería de imágenes por propiedad (almacenadas en Supabase Storage)
CREATE TABLE fotos_propiedades (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propiedad_id  UUID NOT NULL REFERENCES propiedades(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,       -- URL pública de Supabase Storage
  storage_path  TEXT NOT NULL,       -- path interno en Storage para borrar
  orden         INT NOT NULL DEFAULT 0,  -- orden en el carrusel
  es_principal  BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla: reservas
-- Reservas gestionadas manualmente por el admin (vía WhatsApp)
CREATE TABLE reservas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propiedad_id   UUID NOT NULL REFERENCES propiedades(id) ON DELETE RESTRICT,
  cliente_nombre TEXT NOT NULL,
  cliente_tel    TEXT NOT NULL,
  cliente_email  TEXT,
  fecha_inicio   DATE NOT NULL,
  fecha_fin      DATE NOT NULL,
  estado         TEXT NOT NULL DEFAULT 'confirmada'
                   CHECK (estado IN ('confirmada', 'cancelada', 'completada')),
  notas          TEXT,             -- notas internas del admin
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fechas_validas CHECK (fecha_fin > fecha_inicio)
);

-- Tabla: bloqueos
-- Fechas bloqueadas por mantenimiento, uso personal, etc. (no son reservas)
CREATE TABLE bloqueos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propiedad_id  UUID NOT NULL REFERENCES propiedades(id) ON DELETE CASCADE,
  fecha_inicio  DATE NOT NULL,
  fecha_fin     DATE NOT NULL,
  motivo        TEXT,   -- ej: "mantenimiento", "uso personal"
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fechas_bloqueo_validas CHECK (fecha_fin >= fecha_inicio)
);

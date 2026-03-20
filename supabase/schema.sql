-- ============================================================
-- SCHEMA PRINCIPAL - Estadia SaaS
-- Plataforma multi-tenant para gestión de propiedades vacacionales
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- TENANTS
-- Cada cliente del SaaS (dueño de propiedades)
-- ────────────────────────────────────────────────────────────
CREATE TABLE tenants (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre         TEXT NOT NULL,                    -- nombre del negocio
  slug           TEXT NOT NULL UNIQUE,             -- identificador en URL ej: "cabanas-el-rio"
  codigo_acceso  TEXT NOT NULL UNIQUE,             -- código de login ej: "CASA-X7K2"
  email          TEXT,                             -- contacto del dueño
  telefono       TEXT,                             -- teléfono del dueño
  logo_url       TEXT,                             -- logo del negocio
  foto_portada   TEXT,                             -- imagen/video hero de la página pública
  descripcion    TEXT,                             -- texto de presentación del negocio
  slogan         TEXT,                             -- frase corta que aparece en el hero
  moneda         TEXT NOT NULL DEFAULT 'COP',      -- moneda de precios
  activa         BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- PROPIEDADES
-- Casas/cabañas de cada tenant
-- ────────────────────────────────────────────────────────────
CREATE TABLE propiedades (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nombre          TEXT NOT NULL,
  descripcion     TEXT,
  ubicacion       TEXT,                            -- descripción textual ej: "Guatapé, Antioquia"
  latitud         NUMERIC(9,6),                   -- coordenada para mapa
  longitud        NUMERIC(9,6),
  precio_noche    NUMERIC(12,2),
  precio_semana   NUMERIC(12,2),
  precio_mes      NUMERIC(12,2),
  capacidad       INT,                             -- personas máximas
  habitaciones    INT,
  banos           INT,
  amenidades      JSONB NOT NULL DEFAULT '[]',    -- ["WiFi", "Piscina", "BBQ", ...]
  whatsapp        TEXT,                            -- número con código de país: 573001234567
  activa          BOOLEAN NOT NULL DEFAULT true,
  orden           INT NOT NULL DEFAULT 0,          -- orden de aparición en la web pública
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- FOTOS
-- Galería de imágenes por propiedad (Supabase Storage)
-- ────────────────────────────────────────────────────────────
CREATE TABLE fotos_propiedades (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propiedad_id  UUID NOT NULL REFERENCES propiedades(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,                     -- URL pública de Supabase Storage
  storage_path  TEXT NOT NULL,                     -- path interno para borrar del bucket
  orden         INT NOT NULL DEFAULT 0,            -- orden en el carrusel
  es_principal  BOOLEAN NOT NULL DEFAULT false,    -- foto de portada
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- RESERVAS
-- Gestionadas manualmente por el admin vía WhatsApp
-- ────────────────────────────────────────────────────────────
CREATE TABLE reservas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propiedad_id    UUID NOT NULL REFERENCES propiedades(id) ON DELETE RESTRICT,
  cliente_nombre  TEXT NOT NULL,
  cliente_tel     TEXT NOT NULL,
  cliente_email   TEXT,
  fecha_inicio    DATE NOT NULL,
  fecha_fin       DATE NOT NULL,
  noches          INT GENERATED ALWAYS AS (fecha_fin - fecha_inicio) STORED,
  monto_total     NUMERIC(12,2),                   -- acordado con el cliente
  estado          TEXT NOT NULL DEFAULT 'confirmada'
                    CHECK (estado IN ('confirmada', 'cancelada', 'completada')),
  notas           TEXT,                            -- notas internas del admin
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fechas_validas CHECK (fecha_fin > fecha_inicio)
);

-- ────────────────────────────────────────────────────────────
-- BLOQUEOS
-- Fechas no disponibles por razones internas (no son reservas)
-- ────────────────────────────────────────────────────────────
CREATE TABLE bloqueos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propiedad_id  UUID NOT NULL REFERENCES propiedades(id) ON DELETE CASCADE,
  fecha_inicio  DATE NOT NULL,
  fecha_fin     DATE NOT NULL,
  motivo        TEXT,                              -- "mantenimiento", "uso personal", etc.
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fechas_bloqueo_validas CHECK (fecha_fin >= fecha_inicio)
);

-- ============================================================
-- ÍNDICES
-- ============================================================

-- Búsquedas frecuentes por tenant
CREATE INDEX idx_propiedades_tenant      ON propiedades(tenant_id);
CREATE INDEX idx_reservas_propiedad      ON reservas(propiedad_id);
CREATE INDEX idx_bloqueos_propiedad      ON bloqueos(propiedad_id);
CREATE INDEX idx_fotos_propiedad         ON fotos_propiedades(propiedad_id);

-- Consultas de disponibilidad por rango de fechas
CREATE INDEX idx_reservas_fechas         ON reservas(propiedad_id, fecha_inicio, fecha_fin);
CREATE INDEX idx_bloqueos_fechas         ON bloqueos(propiedad_id, fecha_inicio, fecha_fin);

-- Filtros comunes
CREATE INDEX idx_propiedades_activa      ON propiedades(activa);
CREATE INDEX idx_reservas_estado         ON reservas(estado);
CREATE INDEX idx_tenants_slug            ON tenants(slug);
CREATE INDEX idx_tenants_codigo_acceso   ON tenants(codigo_acceso);

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_propiedades_updated_at
  BEFORE UPDATE ON propiedades
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_reservas_updated_at
  BEFORE UPDATE ON reservas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- FUNCIÓN: verificar disponibilidad
-- Retorna true si la propiedad está disponible en el rango dado
-- ============================================================

CREATE OR REPLACE FUNCTION propiedad_disponible(
  p_propiedad_id UUID,
  p_fecha_inicio DATE,
  p_fecha_fin    DATE,
  p_excluir_reserva_id UUID DEFAULT NULL   -- para editar una reserva existente
)
RETURNS BOOLEAN AS $$
DECLARE
  conflicto_reservas INT;
  conflicto_bloqueos INT;
BEGIN
  -- Verificar solapamiento con reservas confirmadas
  SELECT COUNT(*) INTO conflicto_reservas
  FROM reservas
  WHERE propiedad_id = p_propiedad_id
    AND estado = 'confirmada'
    AND id IS DISTINCT FROM p_excluir_reserva_id
    AND fecha_inicio < p_fecha_fin
    AND fecha_fin   > p_fecha_inicio;

  -- Verificar solapamiento con bloqueos
  SELECT COUNT(*) INTO conflicto_bloqueos
  FROM bloqueos
  WHERE propiedad_id = p_propiedad_id
    AND fecha_inicio < p_fecha_fin
    AND fecha_fin   >= p_fecha_inicio;

  RETURN (conflicto_reservas = 0 AND conflicto_bloqueos = 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- MIGRACIONES
-- ============================================================
-- Agregar columna slogan a tenants (ejecutar si la tabla ya existe)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS slogan TEXT;

-- Redes sociales
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS instagram_url      TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS facebook_url       TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS tiktok_url         TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS mostrar_instagram  BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS mostrar_facebook   BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS mostrar_tiktok     BOOLEAN NOT NULL DEFAULT true;

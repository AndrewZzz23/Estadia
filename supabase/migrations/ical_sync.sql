-- Agrega URL de iCal a propiedades (para sincronizar con Airbnb, Booking, etc.)
ALTER TABLE propiedades ADD COLUMN IF NOT EXISTS ical_url TEXT;

-- Agrega UID del evento iCal a bloqueos (para upsert sin duplicados)
ALTER TABLE bloqueos ADD COLUMN IF NOT EXISTS ical_uid TEXT UNIQUE;

-- Índice para búsqueda rápida por uid
CREATE INDEX IF NOT EXISTS bloqueos_ical_uid_idx ON bloqueos (ical_uid);

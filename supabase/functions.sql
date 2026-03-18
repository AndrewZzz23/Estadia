-- ============================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================

-- Trigger: actualiza updated_at automáticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_propiedades_updated_at
  BEFORE UPDATE ON propiedades
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_reservas_updated_at
  BEFORE UPDATE ON reservas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Función: get_fechas_ocupadas(propiedad_id, mes, año)
-- Devuelve todas las fechas ocupadas de una propiedad en un mes
-- Útil para pintar el calendario público
-- ============================================================
CREATE OR REPLACE FUNCTION get_fechas_ocupadas(
  p_propiedad_id UUID,
  p_mes INT,
  p_anio INT
)
RETURNS TABLE(fecha DATE, tipo TEXT) AS $$
DECLARE
  inicio_mes DATE := make_date(p_anio, p_mes, 1);
  fin_mes    DATE := (make_date(p_anio, p_mes, 1) + INTERVAL '1 month - 1 day')::DATE;
BEGIN
  -- Fechas por reservas confirmadas
  RETURN QUERY
    SELECT d::DATE, 'reserva'::TEXT
    FROM reservas r,
         generate_series(r.fecha_inicio, r.fecha_fin - INTERVAL '1 day', '1 day') d
    WHERE r.propiedad_id = p_propiedad_id
      AND r.estado = 'confirmada'
      AND d::DATE BETWEEN inicio_mes AND fin_mes;

  -- Fechas por bloqueos
  RETURN QUERY
    SELECT d::DATE, 'bloqueo'::TEXT
    FROM bloqueos b,
         generate_series(b.fecha_inicio, b.fecha_fin, '1 day') d
    WHERE b.propiedad_id = p_propiedad_id
      AND d::DATE BETWEEN inicio_mes AND fin_mes;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- Función: verificar_disponibilidad(propiedad_id, inicio, fin)
-- Devuelve TRUE si las fechas están disponibles (sin solapamiento)
-- ============================================================
CREATE OR REPLACE FUNCTION verificar_disponibilidad(
  p_propiedad_id UUID,
  p_inicio DATE,
  p_fin DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  conflictos INT;
BEGIN
  SELECT COUNT(*) INTO conflictos
  FROM (
    -- Chequea reservas
    SELECT 1 FROM reservas
    WHERE propiedad_id = p_propiedad_id
      AND estado = 'confirmada'
      AND fecha_inicio < p_fin
      AND fecha_fin > p_inicio

    UNION ALL

    -- Chequea bloqueos
    SELECT 1 FROM bloqueos
    WHERE propiedad_id = p_propiedad_id
      AND fecha_inicio <= p_fin
      AND fecha_fin >= p_inicio
  ) sub;

  RETURN conflictos = 0;
END;
$$ LANGUAGE plpgsql STABLE;

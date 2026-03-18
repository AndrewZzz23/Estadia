-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Política general:
--   - Público (anon): solo lectura en propiedades, fotos, y fechas ocupadas
--   - Admin (authenticated): acceso total

-- Habilitar RLS en todas las tablas
ALTER TABLE propiedades       ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos_propiedades ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloqueos          ENABLE ROW LEVEL SECURITY;

-- ---- propiedades ----
CREATE POLICY "publico_lee_propiedades" ON propiedades
  FOR SELECT TO anon
  USING (activa = true);

CREATE POLICY "admin_todo_propiedades" ON propiedades
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ---- fotos_propiedades ----
CREATE POLICY "publico_lee_fotos" ON fotos_propiedades
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "admin_todo_fotos" ON fotos_propiedades
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ---- reservas ----
-- El público NO puede leer reservas (privacidad de clientes)
CREATE POLICY "admin_todo_reservas" ON reservas
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ---- bloqueos ----
-- El público puede leer bloqueos (para mostrar días no disponibles)
CREATE POLICY "publico_lee_bloqueos" ON bloqueos
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "admin_todo_bloqueos" ON bloqueos
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

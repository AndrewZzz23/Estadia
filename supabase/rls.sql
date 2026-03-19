-- ============================================================
-- ROW LEVEL SECURITY (RLS) - Estadia SaaS
-- ============================================================
-- Modelo de acceso:
--   No usamos Supabase Auth. El acceso admin se controla por
--   código de acceso en la app + localStorage.
--   Todas las operaciones usan el anon key, por lo que las
--   políticas son abiertas. La seguridad se maneja a nivel
--   de aplicación filtrando siempre por tenant_id.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- TENANTS
-- ────────────────────────────────────────────────────────────
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Login: la app busca por codigo_acceso con el anon key
CREATE POLICY "login publico" ON tenants
  FOR SELECT USING (activa = true);

-- El admin puede actualizar su propio tenant (sin Supabase Auth, usamos USING(true))
CREATE POLICY "tenant puede actualizarse" ON tenants
  FOR UPDATE USING (true) WITH CHECK (true);

-- ────────────────────────────────────────────────────────────
-- PROPIEDADES
-- ────────────────────────────────────────────────────────────
ALTER TABLE propiedades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "publico ve propiedades activas" ON propiedades
  FOR SELECT USING (activa = true);

CREATE POLICY "admin gestiona propiedades" ON propiedades
  FOR ALL USING (true) WITH CHECK (true);

-- ────────────────────────────────────────────────────────────
-- FOTOS_PROPIEDADES
-- ────────────────────────────────────────────────────────────
ALTER TABLE fotos_propiedades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "publico ve fotos" ON fotos_propiedades
  FOR SELECT USING (true);

CREATE POLICY "insertar fotos" ON fotos_propiedades
  FOR INSERT WITH CHECK (true);

CREATE POLICY "actualizar fotos" ON fotos_propiedades
  FOR UPDATE USING (true);

CREATE POLICY "eliminar fotos" ON fotos_propiedades
  FOR DELETE USING (true);

-- ────────────────────────────────────────────────────────────
-- RESERVAS
-- ────────────────────────────────────────────────────────────
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acceso reservas" ON reservas
  FOR ALL USING (true) WITH CHECK (true);

-- ────────────────────────────────────────────────────────────
-- BLOQUEOS
-- ────────────────────────────────────────────────────────────
ALTER TABLE bloqueos ENABLE ROW LEVEL SECURITY;

-- El público puede leer bloqueos (para mostrar días no disponibles en el calendario)
CREATE POLICY "publico ve bloqueos" ON bloqueos
  FOR SELECT USING (true);

CREATE POLICY "admin gestiona bloqueos" ON bloqueos
  FOR ALL USING (true) WITH CHECK (true);

-- ────────────────────────────────────────────────────────────
-- STORAGE: bucket fotos-propiedades
-- ────────────────────────────────────────────────────────────
CREATE POLICY "subir fotos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'fotos-propiedades');

CREATE POLICY "ver fotos" ON storage.objects
  FOR SELECT USING (bucket_id = 'fotos-propiedades');

CREATE POLICY "eliminar fotos" ON storage.objects
  FOR DELETE USING (bucket_id = 'fotos-propiedades');

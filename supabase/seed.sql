-- ============================================================
-- DATOS DE PRUEBA
-- Ejecutar SOLO en desarrollo/staging, nunca en producción
-- ============================================================

-- Propiedades de ejemplo
INSERT INTO propiedades (id, nombre, descripcion, ubicacion, precio_noche, precio_semana, precio_mes, capacidad, whatsapp)
VALUES
  (
    'a1b2c3d4-0000-0000-0000-000000000001',
    'Casa del Lago',
    'Hermosa cabaña frente al lago con vista panorámica. Ideal para familias y grupos. Cuenta con piscina privada, BBQ y acceso directo al lago.',
    'Guatapé, Antioquia',
    350000, 2100000, 7500000, 8,
    '573001234567'
  ),
  (
    'a1b2c3d4-0000-0000-0000-000000000002',
    'Villa del Bosque',
    'Acogedora villa rodeada de naturaleza. Perfecta para desconectarse. WiFi, chimenea y senderos ecológicos.',
    'El Retiro, Antioquia',
    280000, 1650000, 6000000, 6,
    '573001234568'
  );

-- Reserva de ejemplo
INSERT INTO reservas (propiedad_id, cliente_nombre, cliente_tel, fecha_inicio, fecha_fin, estado, notas)
VALUES
  (
    'a1b2c3d4-0000-0000-0000-000000000001',
    'Carlos Gómez', '3109876543',
    CURRENT_DATE + 5, CURRENT_DATE + 10,
    'confirmada', 'Cliente frecuente'
  );

-- Bloqueo de ejemplo (mantenimiento)
INSERT INTO bloqueos (propiedad_id, fecha_inicio, fecha_fin, motivo)
VALUES
  (
    'a1b2c3d4-0000-0000-0000-000000000002',
    CURRENT_DATE + 3, CURRENT_DATE + 4,
    'Mantenimiento piscina'
  );

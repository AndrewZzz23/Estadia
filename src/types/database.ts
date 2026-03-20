// Tipos generados manualmente basados en supabase/schema.sql
// Cuando el proyecto madure, reemplazar con: supabase gen types typescript

export type EstadoReserva = 'confirmada' | 'cancelada' | 'completada'

// ────────────────────────────────────────────────────────────
// Entidades principales
// ────────────────────────────────────────────────────────────

export interface Tenant {
  id: string
  nombre: string
  slug: string
  codigo_acceso: string
  email: string | null
  telefono: string | null
  logo_url: string | null
  foto_portada: string | null
  descripcion: string | null
  slogan: string | null
  instagram_url:     string | null
  facebook_url:      string | null
  tiktok_url:        string | null
  mostrar_instagram: boolean
  mostrar_facebook:  boolean
  mostrar_tiktok:    boolean
  moneda: string
  activa: boolean
  created_at: string
  updated_at: string
}

export interface Propiedad {
  id: string
  tenant_id: string
  nombre: string
  descripcion: string | null
  ubicacion: string | null
  latitud: number | null
  longitud: number | null
  precio_noche: number | null
  precio_semana: number | null
  precio_mes: number | null
  capacidad: number | null
  habitaciones: number | null
  banos: number | null
  amenidades: string[]
  whatsapp: string | null
  activa: boolean
  orden: number
  created_at: string
  updated_at: string
}

export interface FotoPropiedad {
  id: string
  propiedad_id: string
  url: string
  storage_path: string
  orden: number
  es_principal: boolean
  created_at: string
}

export interface Reserva {
  id: string
  propiedad_id: string
  cliente_nombre: string
  cliente_tel: string
  cliente_email: string | null
  fecha_inicio: string   // DATE → "YYYY-MM-DD"
  fecha_fin: string
  noches: number         // columna generada por Postgres
  monto_total: number | null
  estado: EstadoReserva
  notas: string | null
  created_at: string
  updated_at: string
}

export interface Bloqueo {
  id: string
  propiedad_id: string
  fecha_inicio: string
  fecha_fin: string
  motivo: string | null
  created_at: string
}

// ────────────────────────────────────────────────────────────
// Tipos para queries con joins
// ────────────────────────────────────────────────────────────

export interface PropiedadConFotos extends Propiedad {
  fotos_propiedades: FotoPropiedad[]
}

export interface ReservaConPropiedad extends Reserva {
  propiedades: Pick<Propiedad, 'id' | 'nombre'>
}

// ────────────────────────────────────────────────────────────
// Database schema (para createClient<Database>)
// ────────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: Tenant
        Insert: Omit<Tenant, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Tenant, 'id' | 'created_at' | 'updated_at'>>
      }
      propiedades: {
        Row: Propiedad
        Insert: Omit<Propiedad, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Propiedad, 'id' | 'created_at' | 'updated_at'>>
      }
      fotos_propiedades: {
        Row: FotoPropiedad
        Insert: Omit<FotoPropiedad, 'id' | 'created_at'>
        Update: Partial<Omit<FotoPropiedad, 'id' | 'created_at'>>
      }
      reservas: {
        Row: Reserva
        Insert: Omit<Reserva, 'id' | 'noches' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Reserva, 'id' | 'noches' | 'created_at' | 'updated_at'>>
      }
      bloqueos: {
        Row: Bloqueo
        Insert: Omit<Bloqueo, 'id' | 'created_at'>
        Update: Partial<Omit<Bloqueo, 'id' | 'created_at'>>
      }
    }
    Functions: {
      propiedad_disponible: {
        Args: {
          p_propiedad_id: string
          p_fecha_inicio: string
          p_fecha_fin: string
          p_excluir_reserva_id?: string
        }
        Returns: boolean
      }
    }
  }
}

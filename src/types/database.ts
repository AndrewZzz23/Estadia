// Tipos generados manualmente basados en supabase/schema.sql
// Cuando el proyecto madure, reemplazar con: supabase gen types typescript

export type EstadoReserva = 'confirmada' | 'cancelada' | 'completada'

export interface Propiedad {
  id: string
  nombre: string
  descripcion: string | null
  ubicacion: string | null
  precio_noche: number | null
  precio_semana: number | null
  precio_mes: number | null
  capacidad: number | null
  activa: boolean
  whatsapp: string | null
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
  fecha_inicio: string   // DATE → string en formato YYYY-MM-DD
  fecha_fin: string
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

// Tipo para supabase createClient<Database>
export interface Database {
  public: {
    Tables: {
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
        Insert: Omit<Reserva, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Reserva, 'id' | 'created_at' | 'updated_at'>>
      }
      bloqueos: {
        Row: Bloqueo
        Insert: Omit<Bloqueo, 'id' | 'created_at'>
        Update: Partial<Omit<Bloqueo, 'id' | 'created_at'>>
      }
    }
  }
}

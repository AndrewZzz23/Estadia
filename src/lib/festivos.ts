/**
 * Festivos de Colombia — Ley 51 de 1983 (Ley Emiliani)
 * Retorna un Map de "YYYY-MM-DD" → nombre del festivo
 */

function ymd(d: Date) {
  return d.toISOString().slice(0, 10)
}

/** Siguiente lunes a partir de una fecha (Ley Emiliani) */
function siguienteLunes(d: Date): Date {
  const r = new Date(d)
  const dia = r.getDay()
  if (dia === 1) return r // ya es lunes
  const diff = dia === 0 ? 1 : 8 - dia
  r.setDate(r.getDate() + diff)
  return r
}

/** Domingo de Pascua — algoritmo de Butcher/Meeus */
function pascua(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1 // 0-indexed
  const day   = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month, day)
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function getFestivos(year: number): Map<string, string> {
  const f = new Map<string, string>()

  const add = (d: Date, nombre: string) => f.set(ymd(d), nombre)
  const addEmiliani = (d: Date, nombre: string) => add(siguienteLunes(d), nombre)

  // ── Fijos ──────────────────────────────────────────────────
  add(new Date(year,  0,  1), 'Año Nuevo')
  add(new Date(year,  4,  1), 'Día del Trabajo')
  add(new Date(year,  6, 20), 'Día de la Independencia')
  add(new Date(year,  7,  7), 'Batalla de Boyacá')
  add(new Date(year, 11,  8), 'Inmaculada Concepción')
  add(new Date(year, 11, 25), 'Navidad')

  // ── Emiliani (se trasladan al siguiente lunes) ─────────────
  addEmiliani(new Date(year,  0,  6), 'Reyes Magos')
  addEmiliani(new Date(year,  2, 19), 'San José')
  addEmiliani(new Date(year,  5, 29), 'San Pedro y San Pablo')
  addEmiliani(new Date(year,  7, 15), 'Asunción de la Virgen')
  addEmiliani(new Date(year,  9, 12), 'Día de la Raza')
  addEmiliani(new Date(year, 10,  1), 'Todos los Santos')
  addEmiliani(new Date(year, 10, 11), 'Independencia de Cartagena')

  // ── Pascua y derivados ─────────────────────────────────────
  const domingo = pascua(year)
  add(addDays(domingo, -3), 'Jueves Santo')
  add(addDays(domingo, -2), 'Viernes Santo')
  add(siguienteLunes(addDays(domingo,  39)), 'Ascensión del Señor')
  add(siguienteLunes(addDays(domingo,  60)), 'Corpus Christi')
  add(siguienteLunes(addDays(domingo,  68)), 'Sagrado Corazón')

  return f
}

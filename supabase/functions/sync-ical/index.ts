import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Parser iCal básico ──────────────────────────────────────────────────────
function parseICS(ics: string) {
  const events: { uid: string; start: string; end: string; summary: string }[] = []
  const blocks = ics.split('BEGIN:VEVENT').slice(1)

  for (const block of blocks) {
    const get = (key: string) =>
      block.match(new RegExp(`^${key}(?:[^:]*):(.+)$`, 'm'))?.[1]?.trim() ?? ''

    const uid     = get('UID')
    const summary = get('SUMMARY') || 'Airbnb'
    const rawStart = get('DTSTART')
    const rawEnd   = get('DTEND')

    if (!uid || !rawStart || !rawEnd) continue

    // Soporta YYYYMMDD y YYYYMMDDTHHmmssZ
    const toYMD = (s: string) => {
      const d = s.replace(/[TZ]/g, '').slice(0, 8)
      return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
    }

    events.push({ uid, summary, start: toYMD(rawStart), end: toYMD(rawEnd) })
  }

  return events
}

// ── Handler ─────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const body = await req.json().catch(() => ({}))
    const { propiedad_id } = body as { propiedad_id?: string }

    // Obtener propiedades con ical_url configurada
    let q = supabase
      .from('propiedades')
      .select('id, nombre, ical_url')
      .not('ical_url', 'is', null)
      .neq('ical_url', '')

    if (propiedad_id) q = q.eq('id', propiedad_id)

    const { data: props, error: propsError } = await q
    if (propsError) throw propsError
    if (!props?.length) {
      return new Response(JSON.stringify({ synced: 0, message: 'No hay propiedades con URL iCal' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results: { propiedad: string; eventos: number; error?: string }[] = []

    for (const prop of props) {
      try {
        // Fetch del calendario
        const res = await fetch(prop.ical_url!, { headers: { 'User-Agent': 'Estadia/1.0' } })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const ics = await res.text()

        const events = parseICS(ics)

        // Upsert bloqueos por ical_uid
        for (const ev of events) {
          await supabase.from('bloqueos').upsert(
            {
              propiedad_id: prop.id,
              fecha_inicio: ev.start,
              fecha_fin: ev.end,
              motivo: `Airbnb: ${ev.summary}`,
              ical_uid: ev.uid,
            },
            { onConflict: 'ical_uid', ignoreDuplicates: false },
          )
        }

        results.push({ propiedad: prop.nombre, eventos: events.length })
      } catch (e) {
        results.push({ propiedad: prop.nombre, eventos: 0, error: String(e) })
      }
    }

    return new Response(JSON.stringify({ synced: results.reduce((a, r) => a + r.eventos, 0), results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

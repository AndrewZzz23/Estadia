/** Extrae el ID de un link de YouTube en cualquier formato */
export function youtubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

/** Convierte un link de YouTube a URL de embed con autoplay mute loop */
export function youtubeEmbed(url: string): string | null {
  const id = youtubeId(url)
  if (!id) return null
  return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&showinfo=0&rel=0`
}

/** true si la URL es un video directo (.mp4, .webm, .mov) */
export function esVideoDirecto(url: string): boolean {
  return /\.(mp4|webm|mov|avi)(\?|$)/i.test(url)
}

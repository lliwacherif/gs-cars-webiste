const API_ORIGIN = (() => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  if (base.startsWith('http')) return new URL(base).origin
  return 'http://localhost:3000'
})()

export function mediaUrl(url) {
  if (!url || typeof url !== 'string') return ''
  if (url.startsWith('/uploads/')) return `${API_ORIGIN}${url}`
  return url
}

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '')

export function mediaUrl(url) {
  if (!url || typeof url !== 'string') return ''

  // Cloudinary (and other remote providers) already return complete URLs.
  if (/^(https?:|data:|blob:)/i.test(url)) return url

  // Older locally stored vehicle records use /uploads/*. Route them through
  // the API prefix so the same URL works with Vite locally and Nginx in prod.
  if (url.startsWith('/uploads/')) return `${API_BASE}${url}`

  // New local uploads use /api/uploads/*. When the API is hosted on another
  // origin in development, attach that origin; in production keep it relative.
  if (url.startsWith('/api/uploads/') && API_BASE.startsWith('http')) {
    return new URL(url, new URL(API_BASE).origin).href
  }

  return url
}

const AUTH_ENTRY_PATHS = new Set(['/login', '/register', '/signup'])

export interface RedirectLocationLike {
  pathname?: unknown
  search?: unknown
  hash?: unknown
}

export function resolveSafeRedirect(from: unknown, fallback = '/dashboard'): string {
  let raw: string | null = null

  if (typeof from === 'string') {
    raw = from
  } else if (from && typeof from === 'object') {
    const loc = from as RedirectLocationLike
    if (typeof loc.pathname === 'string') {
      const search = typeof loc.search === 'string' ? loc.search : ''
      const hash = typeof loc.hash === 'string' ? loc.hash : ''
      raw = `${loc.pathname}${search}${hash}`
    }
  }

  if (!raw) return fallback

  const trimmed = raw.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback
  }
  if (/[\r\n\t\\]/.test(trimmed)) {
    return fallback
  }

  try {
    const parsed = new URL(trimmed, 'https://arena.local')
    if (parsed.origin !== 'https://arena.local') {
      return fallback
    }
    const normalizedPath = parsed.pathname.toLowerCase().replace(/\/+$/, '') || '/'
    if (AUTH_ENTRY_PATHS.has(normalizedPath)) {
      return fallback
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallback
  }
}

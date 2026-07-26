// Client for the self-hosted Tap N Track API (replaces the old Supabase client).
// - Base URL comes from VITE_API_URL (public; just a URL, safe to ship in the bundle).
// - The access key (the server's API_SECRET) is entered once and kept in localStorage, so it is
//   NOT baked into the bundle. Single-user model: one key = "signed in".

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '')
const KEY_STORAGE = 'tapntrack_api_key'

export const isApiConfigured = (): boolean => !!API_URL
export const getApiKey = (): string | null => localStorage.getItem(KEY_STORAGE)
export const setApiKey = (k: string): void => localStorage.setItem(KEY_STORAGE, k)
export const clearApiKey = (): void => localStorage.removeItem(KEY_STORAGE)

/** Authenticated fetch against the API. Throws on non-2xx. */
export async function apiFetch(path: string, opts: RequestInit = {}): Promise<Response> {
  if (!API_URL) throw new Error('Cloud sync not configured (VITE_API_URL unset)')
  const key = getApiKey()
  const res = await fetch(API_URL + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
      ...(opts.headers || {}),
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`API ${res.status}${body ? `: ${body}` : ''}`)
  }
  return res
}

/** Validate a candidate key by hitting an authed endpoint. */
export async function validateKey(key: string): Promise<boolean> {
  if (!API_URL) return false
  try {
    const res = await fetch(`${API_URL}/api/activities`, { headers: { Authorization: `Bearer ${key}` } })
    return res.ok
  } catch {
    return false
  }
}

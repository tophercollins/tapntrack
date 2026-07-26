import { useAuthStore } from '../stores/authStore'
import { useSyncStore } from '../stores/syncStore'

// Debounced, fire-and-forget push. After a local mutation marks a pending change, this nudges a
// background sync (only if signed in). Debounced so a burst of edits triggers one sync. Errors are
// recorded by syncStore itself; the local write already succeeded, so we never block the UI on it.
let timer: ReturnType<typeof setTimeout> | null = null

export function schedulePush(): void {
  if (!useAuthStore.getState().user) return
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    void useSyncStore.getState().sync()
  }, 1500)
}

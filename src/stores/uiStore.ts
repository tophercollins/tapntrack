import { create } from 'zustand'
import type { Activity } from '../types'

type LoggerState =
  | { type: 'closed' }
  | { type: 'number'; activity: Activity }
  | { type: 'duration'; activity: Activity; startTime: number }
  | { type: 'custom'; activity: Activity }
  | { type: 'confirmation'; message: string }
  | { type: 'error'; message: string }

interface UIState {
  logger: LoggerState
  toastTimeoutId: ReturnType<typeof setTimeout> | null
  openNumber: (activity: Activity) => void
  openDuration: (activity: Activity) => void
  openCustom: (activity: Activity) => void
  showConfirmation: (message: string) => void
  showError: (message: string) => void
  closeLogger: () => void
}

export const useUIStore = create<UIState>((set, get) => ({
  logger: { type: 'closed' },
  toastTimeoutId: null,

  openNumber: (activity) => {
    const { toastTimeoutId } = get()
    if (toastTimeoutId) clearTimeout(toastTimeoutId)
    set({ logger: { type: 'number', activity }, toastTimeoutId: null })
  },

  openDuration: (activity) => {
    const { toastTimeoutId } = get()
    if (toastTimeoutId) clearTimeout(toastTimeoutId)
    set({ logger: { type: 'duration', activity, startTime: Date.now() }, toastTimeoutId: null })
  },

  openCustom: (activity) => {
    const { toastTimeoutId } = get()
    if (toastTimeoutId) clearTimeout(toastTimeoutId)
    set({ logger: { type: 'custom', activity }, toastTimeoutId: null })
  },

  showConfirmation: (message) => {
    const { toastTimeoutId } = get()
    if (toastTimeoutId) clearTimeout(toastTimeoutId)

    const newTimeoutId = setTimeout(() => {
      set({ logger: { type: 'closed' }, toastTimeoutId: null })
    }, 1500)
    set({ logger: { type: 'confirmation', message }, toastTimeoutId: newTimeoutId })
  },

  showError: (message) => {
    const { toastTimeoutId } = get()
    if (toastTimeoutId) clearTimeout(toastTimeoutId)

    const newTimeoutId = setTimeout(() => {
      set({ logger: { type: 'closed' }, toastTimeoutId: null })
    }, 3000)
    set({ logger: { type: 'error', message }, toastTimeoutId: newTimeoutId })
  },

  closeLogger: () => {
    const { toastTimeoutId } = get()
    if (toastTimeoutId) clearTimeout(toastTimeoutId)
    set({ logger: { type: 'closed' }, toastTimeoutId: null })
  },
}))

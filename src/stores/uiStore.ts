import { create } from 'zustand'
import type { Activity } from '../types'

type LoggerState =
  | { type: 'closed' }
  | { type: 'number'; activity: Activity }
  | { type: 'duration'; activity: Activity; startTime: number }
  | { type: 'confirmation'; message: string }

interface UIState {
  logger: LoggerState
  openNumber: (activity: Activity) => void
  openDuration: (activity: Activity) => void
  showConfirmation: (message: string) => void
  closeLogger: () => void
}

export const useUIStore = create<UIState>((set) => ({
  logger: { type: 'closed' },

  openNumber: (activity) => {
    set({ logger: { type: 'number', activity } })
  },

  openDuration: (activity) => {
    set({ logger: { type: 'duration', activity, startTime: Date.now() } })
  },

  showConfirmation: (message) => {
    set({ logger: { type: 'confirmation', message } })
    setTimeout(() => {
      set({ logger: { type: 'closed' } })
    }, 1500)
  },

  closeLogger: () => {
    set({ logger: { type: 'closed' } })
  },
}))

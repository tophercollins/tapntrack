import { create } from 'zustand'
import type { Activity, SubItem } from '../types'

type LoggerState =
  | { type: 'closed' }
  | { type: 'sub-select'; activity: Activity }
  | { type: 'number'; activity: Activity; subItem?: SubItem }
  | { type: 'duration'; activity: Activity; startTime: number }
  | { type: 'confirmation'; message: string }

interface UIState {
  logger: LoggerState
  openSubSelect: (activity: Activity) => void
  openNumber: (activity: Activity, subItem?: SubItem) => void
  openDuration: (activity: Activity) => void
  showConfirmation: (message: string) => void
  closeLogger: () => void
}

export const useUIStore = create<UIState>((set) => ({
  logger: { type: 'closed' },

  openSubSelect: (activity) => {
    set({ logger: { type: 'sub-select', activity } })
  },

  openNumber: (activity, subItem) => {
    set({ logger: { type: 'number', activity, subItem } })
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

export type TrackingType =
  | 'tap'        // Single tap = logged (e.g., "took vitamins")
  | 'sub-select' // Tap → select sub-item (e.g., bouldering grades)
  | 'number'     // Tap → enter number (e.g., glasses of water)
  | 'sub-number' // Tap → select sub-item → enter number (e.g., weight lifting)
  | 'duration'   // Tap to start/stop timer (e.g., meditation)

export interface Activity {
  id: string
  name: string
  emoji: string
  color: string
  trackingType: TrackingType
  unit?: string
  createdAt: Date
  sortOrder: number
}

export interface SubItem {
  id: string
  activityId: string
  name: string
  emoji: string
  sortOrder: number
}

export interface Entry {
  id: string
  activityId: string
  subItemId?: string
  value?: number
  duration?: number
  timestamp: Date
  note?: string
}

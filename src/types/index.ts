export type TrackingType =
  | 'tap'        // Single tap = logged (e.g., "took vitamins")
  | 'number'     // Tap → enter number (e.g., glasses of water)
  | 'duration'   // Tap to start/stop timer (e.g., meditation)

export interface Activity {
  id: string
  name: string
  emoji: string
  color: string
  trackingType: TrackingType
  unit?: string
  dailyTarget?: number    // max times per day (shows tick when reached)
  createdAt: Date
  sortOrder: number
  isBase: boolean       // true = shows on home grid
  parentId?: string     // null for base activities, points to parent for nested
  deletedAt?: Date      // soft delete - keeps historical data
}

export interface Event {
  id: string
  activityId: string    // Points to any activity (base or nested)
  value?: number        // For number-based tracking
  duration?: number     // For timed activities (seconds)
  timestamp: Date
  note?: string
}

// Helper type for tree operations
export interface ActivityWithChildren extends Activity {
  children: ActivityWithChildren[]
}

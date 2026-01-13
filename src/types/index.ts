export type TrackingType =
  | 'tap'        // Single tap = logged (e.g., "took vitamins")
  | 'number'     // Tap → enter number (e.g., glasses of water)
  | 'duration'   // Tap to start/stop timer (e.g., meditation)
  | 'custom'     // User-defined dimensions (e.g., bouldering grades)

// An option within a dimension, with optional numeric value for scoring
export interface DimensionOption {
  value: string         // Display value: "V4", "Send"
  numericValue?: number // Scoring value: 4, 1.0 (defaults to 1 if not set)
}

// A dimension is a custom field the user defines for an activity
export interface Dimension {
  id: string
  name: string                  // e.g., "Grade" or "Outcome"
  options: DimensionOption[]    // e.g., [{ value: "V0", numericValue: 0 }, ...]
  defaultValue?: string         // Pre-selected option for faster logging
  required: boolean
}

export interface Activity {
  id: string
  name: string
  emoji: string
  color: string
  trackingType: TrackingType
  unit?: string
  dailyTarget?: number          // max times per day (shows tick when reached)
  dimensions?: Dimension[]      // Custom fields for 'custom' tracking type
  valueFormula?: 'multiply' | 'add'  // How to combine dimension values (default: multiply)
  createdAt: Date
  sortOrder: number
  isBase: boolean               // true = shows on home grid
  parentId?: string             // null for base activities, points to parent for nested
  deletedAt?: Date              // soft delete - keeps historical data
}

export interface Event {
  id: string
  activityId: string    // Points to any activity (base or nested)
  value?: number        // For number-based tracking
  duration?: number     // For timed activities (seconds)
  dimensionValues?: Record<string, string>  // For custom tracking: { "grade": "V2", "outcome": "Sent" }
  timestamp: Date
  note?: string
}

// Helper type for tree operations
export interface ActivityWithChildren extends Activity {
  children: ActivityWithChildren[]
}

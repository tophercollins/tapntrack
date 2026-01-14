// Database types for Supabase
// These match the SQL schema that should be created in Supabase

export interface Database {
  public: {
    Tables: {
      activities: {
        Row: {
          id: string
          user_id: string
          name: string
          emoji: string
          color: string
          tracking_type: 'tap' | 'number' | 'duration' | 'custom'
          unit: string | null
          daily_target: number | null
          dimensions: DimensionJson[] | null
          value_formula: 'multiply' | 'add' | null
          created_at: string
          sort_order: number
          is_base: boolean
          parent_id: string | null
          deleted_at: string | null
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          name: string
          emoji: string
          color: string
          tracking_type: 'tap' | 'number' | 'duration' | 'custom'
          unit?: string | null
          daily_target?: number | null
          dimensions?: DimensionJson[] | null
          value_formula?: 'multiply' | 'add' | null
          created_at?: string
          sort_order: number
          is_base: boolean
          parent_id?: string | null
          deleted_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          emoji?: string
          color?: string
          tracking_type?: 'tap' | 'number' | 'duration' | 'custom'
          unit?: string | null
          daily_target?: number | null
          dimensions?: DimensionJson[] | null
          value_formula?: 'multiply' | 'add' | null
          created_at?: string
          sort_order?: number
          is_base?: boolean
          parent_id?: string | null
          deleted_at?: string | null
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          user_id: string
          activity_id: string
          value: number | null
          duration: number | null
          dimension_values: Record<string, string> | null
          timestamp: string
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          activity_id: string
          value?: number | null
          duration?: number | null
          dimension_values?: Record<string, string> | null
          timestamp: string
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_id?: string
          value?: number | null
          duration?: number | null
          dimension_values?: Record<string, string> | null
          timestamp?: string
          note?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sync_metadata: {
        Row: {
          user_id: string
          last_sync_at: string
          device_id: string
        }
        Insert: {
          user_id: string
          last_sync_at: string
          device_id: string
        }
        Update: {
          user_id?: string
          last_sync_at?: string
          device_id?: string
        }
      }
    }
  }
}

// JSON representation of dimensions for storage
interface DimensionOptionJson {
  value: string
  numericValue?: number
}

interface DimensionJson {
  id: string
  name: string
  options: DimensionOptionJson[]
  defaultValue?: string
  required: boolean
}

// Helper types for working with the database
export type ActivityRow = Database['public']['Tables']['activities']['Row']
export type ActivityInsert = Database['public']['Tables']['activities']['Insert']
export type EventRow = Database['public']['Tables']['events']['Row']
export type EventInsert = Database['public']['Tables']['events']['Insert']

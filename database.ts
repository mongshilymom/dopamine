// Database types from Supabase schema
export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          user_id: string
          occurred_at: string
          type: EventType
          payload: Record<string, any>
        }
        Insert: {
          id?: string
          user_id: string
          occurred_at?: string
          type: EventType
          payload?: Record<string, any>
        }
        Update: {
          id?: string
          user_id?: string
          occurred_at?: string
          type?: EventType
          payload?: Record<string, any>
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          timezone: string
          wake_time: string
          settings: UserSettings
          stats: UserStats
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          timezone?: string
          wake_time?: string
          settings?: UserSettings
          stats?: UserStats
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          timezone?: string
          wake_time?: string
          settings?: UserSettings
          stats?: UserStats
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
          title: string
          description: string | null
          size: TaskSize
          status: TaskStatus
          priority: number
          if_condition: IfCondition | null
          then_action: string | null
          scheduled_for: string | null
          completed_at: string | null
          points_value: number
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
          title: string
          description?: string | null
          size?: TaskSize
          status?: TaskStatus
          priority?: number
          if_condition?: IfCondition | null
          then_action?: string | null
          scheduled_for?: string | null
          completed_at?: string | null
          points_value?: number
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string | null
          size?: TaskSize
          status?: TaskStatus
          priority?: number
          if_condition?: IfCondition | null
          then_action?: string | null
          scheduled_for?: string | null
          completed_at?: string | null
          points_value?: number
        }
      }
    }
    Functions: {
      get_since_wake_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          tasks_completed: number
          focus_sessions: number
          points_today: number
        }
      }
    }
  }
}

export type EventType = 
  | 'task_planned'
  | 'focus_start'
  | 'focus_complete'
  | 'break_complete' 
  | 'task_done'
  | 'energy_checkin'
  | 'points_earned'
  | 'badge_unlocked'
  | 'streak_updated'

export type TaskSize = 'xs' | 's' | 'm' | 'l' | 'xl'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type NoiseType = 'off' | 'white' | 'pink'
export type Theme = 'light' | 'dark'

export interface IfCondition {
  type: 'time' | 'location' | 'trigger'
  value: string
}

export interface UserSettings {
  notifications: boolean
  sound_enabled: boolean
  theme: Theme
  focus_duration: number
  break_duration: number
  long_break_duration: number
  noise_type: NoiseType
  noise_volume: number
}

export interface UserStats {
  total_points: number
  current_streak: number
  longest_streak: number
  focus_sessions_completed: number
  tasks_completed: number
  badges_earned: string[]
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  unlocked_at?: string
}

// Application-specific types
export interface FocusSession {
  id: string
  startedAt: Date
  duration: number // minutes
  type: 'focus' | 'break' | 'long_break'
  completed: boolean
  interrupted?: boolean
}

export interface DailyStats {
  tasks_completed: number
  focus_sessions: number
  points_today: number
  streak: number
}

export interface IfThenTemplate {
  id: string
  name: string
  ifCondition: string
  thenAction: string
  category: 'time' | 'location' | 'trigger'
  popular?: boolean
}

export interface TimerState {
  isRunning: boolean
  isPaused: boolean
  timeRemaining: number // seconds
  currentPhase: 'focus' | 'break' | 'long_break'
  sessionCount: number
  totalSessions: number
}

export interface NoiseSettings {
  enabled: boolean
  type: 'white' | 'pink'
  volume: number // 0-1
}

export interface AppState {
  user: any // Supabase User
  profile: Database['public']['Tables']['profiles']['Row'] | null
  dailyStats: DailyStats
  currentSession: FocusSession | null
  isLoading: boolean
  error: string | null
}

export interface ABTestVariant {
  name: string
  weight: number
  config: Record<string, any>
}

export interface ABTest {
  id: string
  name: string
  variants: ABTestVariant[]
  enabled: boolean
}

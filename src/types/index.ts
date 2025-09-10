// Core types for FOCUS NEXUS MVP
export interface Profile {
  id: string
  created_at: string
  updated_at: string
  noise_preference: 'off' | 'white' | 'pink'
  focus_duration: number
  break_duration: number
  total_points: number
  level: number
  badges: string[]
  timezone: string
  notifications_enabled: boolean
}

export interface Event {
  id: string
  user_id: string
  created_at: string
  event_type: 'focus_session_start' | 'focus_session_complete' | 'focus_session_abandon' |
              'break_start' | 'break_complete' | 'if_then_plan_create' | 'if_then_plan_trigger' |
              'noise_toggle' | 'app_open' | 'app_close'
  session_duration?: number
  plan_id?: string
  metadata?: Record<string, any>
}

export interface IfThenPlan {
  id: string
  user_id: string
  created_at: string
  updated_at: string
  if_condition: string
  then_action: string
  category: 'time' | 'location' | 'emotional' | 'social' | 'custom'
  is_active: boolean
  trigger_count: number
  last_triggered_at?: string
}

export interface IfThenTemplate {
  id: string
  name: string
  description: string
  category: 'time' | 'location' | 'emotional' | 'social'
  if_condition: string
  then_action: string
  evidence_note?: string
}

export interface SinceWakeStats {
  focus_sessions_completed: number
  total_focus_time: number
  plans_triggered: number
  last_session_duration: number
}

export type TimerPhase = 'focus' | 'break' | 'paused'

export interface TimerState {
  phase: TimerPhase
  timeLeft: number
  isActive: boolean
  sessionCount: number
  totalFocusTime: number
}

export interface NoiseState {
  type: 'off' | 'white' | 'pink'
  volume: number
  isPlaying: boolean
  audioContext?: AudioContext
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  condition: (stats: SinceWakeStats, profile: Profile) => boolean
}

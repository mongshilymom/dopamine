import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type SinceWakeStats = {
  wake_time: string
  sessions_count: number
  completed_sessions: number
  total_minutes: number
  tasks_completed: number
}
type TimerState = {
  isActive: boolean
  isPaused: boolean
  timeLeft: number
  duration: number
  sessionType: 'focus' | 'break'
  taskTitle: string
}
type NoiseState = {
  type: 'off' | 'white' | 'pink'
  volume: number
}
type IfThenPlan = Database['public']['Tables']['plans']['Row']
type Event = Database['public']['Tables']['events']['Row']

interface AppStore {
  // Auth state
  user: any | null
  profile: Profile | null
  isLoading: boolean

  // Timer state
  timer: TimerState

  // Noise state
  noise: NoiseState

  // Stats
  stats: SinceWakeStats | null

  // If-Then plans
  plans: IfThenPlan[]

  // Actions
  initializeAuth: () => Promise<void>
  signInAnonymously: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  trackEvent: (event: Omit<Event, 'id' | 'user_id' | 'created_at'>) => Promise<void>
  loadStats: () => Promise<void>
  loadPlans: () => Promise<void>
  createPlan: (plan: Omit<IfThenPlan, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'trigger_count' | 'last_triggered_at'>) => Promise<void>
  triggerPlan: (planId: string) => Promise<void>

  // Timer actions
  startFocusSession: () => void
  pauseTimer: () => void
  resumeTimer: () => void
  completeSession: () => void

  // Noise actions
  setNoiseType: (type: 'off' | 'white' | 'pink') => void
  setNoiseVolume: (volume: number) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      profile: null,
      isLoading: true,

      timer: {
        phase: 'paused',
        timeLeft: 25 * 60, // 25 minutes in seconds
        isActive: false,
        sessionCount: 0,
        totalFocusTime: 0
      },

      noise: {
        type: 'off',
        volume: 0.3,
        isPlaying: false
      },

      stats: null,
      plans: [],

      // Auth actions
      initializeAuth: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()

          if (session?.user) {
            set({ user: session.user, isLoading: false })

            // Load or create profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (profile) {
              set({ profile })
              // Set timer durations from profile
              set(state => ({
                timer: {
                  ...state.timer,
                  timeLeft: profile.focus_duration * 60
                },
                noise: {
                  ...state.noise,
                  type: profile.noise_preference
                }
              }))
            }
          } else {
            set({ isLoading: false })
          }
        } catch (error) {
          console.error('Auth initialization error:', error)
          set({ isLoading: false })
        }
      },

      signInAnonymously: async () => {
        try {
          const { data, error } = await supabase.auth.signInAnonymously()

          if (error) throw error

          set({ user: data.user })

          // Create profile
          const profile: Partial<Profile> = {
            id: data.user!.id,
            noise_preference: 'off',
            focus_duration: 25,
            break_duration: 5,
            total_points: 0,
            level: 1,
            badges: [],
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            notifications_enabled: true
          }

          await supabase.from('profiles').insert(profile)

          // Fetch the created profile
          const { data: createdProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user!.id)
            .single()

          if (createdProfile) {
            set({ profile: createdProfile })
          }

          // Track app open event
          get().trackEvent({ event_type: 'app_open' })

        } catch (error) {
          console.error('Anonymous sign in error:', error)
        }
      },

      updateProfile: async (updates: Partial<Profile>) => {
        const { profile, user } = get()
        if (!user || !profile) return

        try {
          const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)

          if (error) throw error

          set({ profile: { ...profile, ...updates } })

          // Update timer if duration changed
          if (updates.focus_duration) {
            set(state => ({
              timer: {
                ...state.timer,
                timeLeft: updates.focus_duration! * 60
              }
            }))
          }

          // Update noise if preference changed
          if (updates.noise_preference) {
            set(state => ({
              noise: {
                ...state.noise,
                type: updates.noise_preference!
              }
            }))
          }
        } catch (error) {
          console.error('Profile update error:', error)
        }
      },

      trackEvent: async (event: Omit<Event, 'id' | 'user_id' | 'created_at'>) => {
        const { user } = get()
        if (!user) return

        try {
          await supabase.from('events').insert({
            ...event,
            user_id: user.id
          })
        } catch (error) {
          console.error('Event tracking error:', error)
        }
      },

      loadStats: async () => {
        try {
          const { data } = await supabase.rpc('get_since_wake_stats')
          if (data) {
            set({ stats: data })
          }
        } catch (error) {
          console.error('Stats loading error:', error)
        }
      },

      loadPlans: async () => {
        const { user } = get()
        if (!user) return

        try {
          const { data } = await supabase
            .from('if_then_plans')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })

          if (data) {
            set({ plans: data })
          }
        } catch (error) {
          console.error('Plans loading error:', error)
        }
      },

      createPlan: async (planData) => {
        const { user } = get()
        if (!user) return

        try {
          const { data, error } = await supabase
            .from('if_then_plans')
            .insert({
              ...planData,
              user_id: user.id,
              trigger_count: 0
            })
            .select()
            .single()

          if (error) throw error

          set(state => ({ plans: [data, ...state.plans] }))

          // Track plan creation
          get().trackEvent({ 
            event_type: 'if_then_plan_create',
            plan_id: data.id 
          })

        } catch (error) {
          console.error('Plan creation error:', error)
        }
      },

      triggerPlan: async (planId: string) => {
        try {
          // Update trigger count
          await supabase
            .from('if_then_plans')
            .update({ 
              trigger_count: supabase.rpc('increment_trigger_count'),
              last_triggered_at: new Date().toISOString()
            })
            .eq('id', planId)

          // Track trigger event
          get().trackEvent({ 
            event_type: 'if_then_plan_trigger',
            plan_id: planId 
          })

          // Reload plans to update counts
          get().loadPlans()

        } catch (error) {
          console.error('Plan trigger error:', error)
        }
      },

      // Timer actions
      startFocusSession: () => {
        const { profile, trackEvent } = get()
        const duration = profile?.focus_duration || 25

        set(state => ({
          timer: {
            ...state.timer,
            phase: 'focus',
            timeLeft: duration * 60,
            isActive: true
          }
        }))

        trackEvent({ event_type: 'focus_session_start' })
      },

      pauseTimer: () => {
        set(state => ({
          timer: {
            ...state.timer,
            phase: 'paused',
            isActive: false
          }
        }))
      },

      resumeTimer: () => {
        set(state => ({
          timer: {
            ...state.timer,
            phase: 'focus',
            isActive: true
          }
        }))
      },

      completeSession: () => {
        const { timer, profile, trackEvent } = get()
        const sessionDuration = (profile?.focus_duration || 25) * 60 - timer.timeLeft

        set(state => ({
          timer: {
            ...state.timer,
            phase: 'break',
            timeLeft: (profile?.break_duration || 5) * 60,
            sessionCount: state.timer.sessionCount + 1,
            totalFocusTime: state.timer.totalFocusTime + sessionDuration
          }
        }))

        trackEvent({ 
          event_type: 'focus_session_complete',
          session_duration: sessionDuration
        })

        // Award points (gamification)
        if (profile) {
          const pointsEarned = Math.floor(sessionDuration / 60) * 10 // 10 points per minute
          get().updateProfile({ 
            total_points: profile.total_points + pointsEarned 
          })
        }
      },

      // Noise actions
      setNoiseType: (type: 'off' | 'white' | 'pink') => {
        set(state => ({
          noise: {
            ...state.noise,
            type
          }
        }))

        // Update profile preference
        get().updateProfile({ noise_preference: type })

        // Track noise toggle
        get().trackEvent({ 
          event_type: 'noise_toggle',
          metadata: { noise_type: type }
        })
      },

      setNoiseVolume: (volume: number) => {
        set(state => ({
          noise: {
            ...state.noise,
            volume: Math.min(Math.max(volume, 0), 0.5) // Max 50% volume for safety
          }
        }))
      }
    }),
    {
      name: 'focus-nexus-store',
      partialize: (state) => ({
        timer: state.timer,
        noise: { type: state.noise.type, volume: state.noise.volume }
      })
    }
  )
)

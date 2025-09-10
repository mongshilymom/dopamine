import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { TimerState } from '../types/index'
import { useAppStore } from './app'

interface TimerStore extends TimerState {
  // Actions
  startSession: (phase: 'focus' | 'break' | 'long_break', duration?: number) => void
  pauseSession: () => void
  resumeSession: () => void
  stopSession: () => void
  completeSession: () => void
  tick: () => void
  reset: () => void
}

export const useTimerStore = create<TimerStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    isRunning: false,
    isPaused: false,
    timeRemaining: 25 * 60, // 25 minutes in seconds
    currentPhase: 'focus',
    sessionCount: 0,
    totalSessions: 0,

    // Actions
    startSession: (phase, duration) => {
      const defaultDuration = phase === 'focus' ? 25 * 60 : 
                             phase === 'break' ? 5 * 60 : 
                             15 * 60 // long_break

      set({
        isRunning: true,
        isPaused: false,
        timeRemaining: duration || defaultDuration,
        currentPhase: phase
      })

      // Track session start
      useAppStore.getState().trackEvent(
        phase === 'focus' ? 'focus_start' : 'break_complete',
        { phase, duration: duration || defaultDuration }
      )
    },

    pauseSession: () => {
      set({ isPaused: true, isRunning: false })
    },

    resumeSession: () => {
      set({ isPaused: false, isRunning: true })
    },

    stopSession: () => {
      set({ 
        isRunning: false, 
        isPaused: false,
        timeRemaining: get().currentPhase === 'focus' ? 25 * 60 : 5 * 60
      })
    },

    completeSession: () => {
      const { currentPhase, sessionCount } = get()

      // Track completion
      useAppStore.getState().trackEvent(
        currentPhase === 'focus' ? 'focus_complete' : 'break_complete',
        { 
          phase: currentPhase,
          completed: true,
          session_number: sessionCount + 1
        }
      )

      // Auto-transition logic (25/5 pattern)
      if (currentPhase === 'focus') {
        const newSessionCount = sessionCount + 1
        const nextPhase = newSessionCount % 4 === 0 ? 'long_break' : 'break'

        set({ 
          sessionCount: newSessionCount,
          totalSessions: get().totalSessions + 1,
          isRunning: false,
          isPaused: false
        })

        // Auto-start break after a short delay
        setTimeout(() => {
          get().startSession(nextPhase)
        }, 1000)
      } else {
        // Break completed, ready for next focus session
        set({ 
          isRunning: false,
          isPaused: false,
          currentPhase: 'focus'
        })
      }
    },

    tick: () => {
      const { timeRemaining, isRunning, isPaused } = get()

      if (!isRunning || isPaused) return

      if (timeRemaining <= 0) {
        get().completeSession()
      } else {
        set({ timeRemaining: timeRemaining - 1 })
      }
    },

    reset: () => {
      set({
        isRunning: false,
        isPaused: false,
        timeRemaining: 25 * 60,
        currentPhase: 'focus',
        sessionCount: 0,
        totalSessions: 0
      })
    }
  }))
)

// Timer tick mechanism
let timerInterval: NodeJS.Timeout | null = null

useTimerStore.subscribe(
  (state) => state.isRunning,
  (isRunning) => {
    if (isRunning) {
      timerInterval = setInterval(() => {
        useTimerStore.getState().tick()
      }, 1000)
    } else {
      if (timerInterval) {
        clearInterval(timerInterval)
        timerInterval = null
      }
    }
  }
)

import { supabase } from '../lib/supabase'

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, Square, RotateCcw, Settings, Timer, Coffee } from 'lucide-react'
import { useAppStore } from '../stores/app'


export const FocusTimer: React.FC = () => {
  const { 
    timer, 
    profile,
    startFocusSession, 
    pauseTimer, 
    resumeTimer, 
    completeSession,
    updateProfile
  } = useAppStore()

  const [showSettings, setShowSettings] = useState(false)
  const [tempSettings, setTempSettings] = useState({
    focus_duration: profile?.focus_duration || 25,
    break_duration: profile?.break_duration || 5
  })
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [currentPhase, setCurrentPhase] = useState<'focus' | 'break' | 'paused'>('paused')
  const [timeLeft, setTimeLeft] = useState(timer.timeLeft)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)

  // Sync with store
  useEffect(() => {
    setCurrentPhase(timer.phase)
    setTimeLeft(timer.timeLeft)
  }, [timer.phase, timer.timeLeft])

  useEffect(() => {
    if (profile) {
      setTempSettings({
        focus_duration: profile.focus_duration,
        break_duration: profile.break_duration
      })
    }
  }, [profile])

// Timer logic (REPLACE THIS EFFECT)
useEffect(() => {
  // 타이머 ON && 남은 시간 있을 때만 틱 시작
  if (!timer.isActive || timeLeft <= 0) return;

  const id = window.setInterval(() => {
    setTimeLeft(prev => {
      if (prev <= 1) {
        // 세션 종료
        if (currentPhase === 'focus') {
          const minutesDone = profile?.focus_duration ?? 25;
          const noise = 'off'; // TODO: NoisePlayer 상태 연결 시 교체
          void saveFocusComplete(minutesDone, noise).catch(console.error);
        }
        completeSession();
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => window.clearInterval(id);
}, [timer.isActive, timeLeft, currentPhase, profile?.focus_duration, completeSession]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // --- ADD: 세션 완료 저장 함수 ---
  async function saveFocusComplete(minutes: number, noise: string) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('events').insert({
      user_id: user?.id,
      type: 'focus_complete',
      minutes,
      payload: { noise }
    })
  }


  const getPhaseConfig = () => {
    switch (currentPhase) {
      case 'focus':
        return {
          label: '집중 시간',
          color: 'bg-red-500',
          textColor: 'text-red-600',
          icon: Timer,
          description: 'ADHD 뇌에 최적화된 25분 집중 세션'
        }
      case 'break':
        return {
          label: '휴식 시간',
          color: 'bg-green-500',
          textColor: 'text-green-600',
          icon: Coffee,
          description: '마이크로브레이크로 인지 자원 회복'
        }
      default:
        return {
          label: '준비됨',
          color: 'bg-gray-400',
          textColor: 'text-gray-600',
          icon: Timer,
          description: '시작 버튼을 눌러 집중 세션을 시작하세요'
        }
    }
  }

  const phaseConfig = getPhaseConfig()
  const Icon = phaseConfig.icon
  const totalDuration = currentPhase === 'focus' 
    ? (profile?.focus_duration || 25) * 60 
    : (profile?.break_duration || 5) * 60
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100

  const handleStart = () => {
    if (currentPhase === 'paused') {
      startFocusSession()
      setSessionStartTime(new Date())
    } else {
      resumeTimer()
    }
  }

  const handlePause = () => {
    pauseTimer()
  }

  const handleReset = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    const duration = profile?.focus_duration || 25
    setTimeLeft(duration * 60)
    setCurrentPhase('paused')
    setSessionStartTime(null)
  }

  const handleSaveSettings = async () => {
    if (profile) {
      await updateProfile({
        focus_duration: tempSettings.focus_duration,
        break_duration: tempSettings.break_duration
      })
    }
    setShowSettings(false)
  }

  // Calculate circle stroke properties for progress ring
  const radius = 120
  const circumference = 2 * Math.PI * radius
  const strokeOffset = circumference - (progress / 100) * circumference

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <Icon className="w-6 h-6 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900">FOCUS TIMER</h2>
        </div>
        <p className="text-sm text-gray-600">{phaseConfig.description}</p>
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <span>세션 {timer.sessionCount}</span>
          <span>총 집중 시간: {Math.floor(timer.totalFocusTime / 60)}분</span>
        </div>
      </div>

      {/* Circular Progress Timer */}
      <div className="flex justify-center">
        <div className="relative">
          <svg width="280" height="280" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="140"
              cy="140"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-gray-200"
            />
            {/* Progress circle */}
            <circle
              cx="140"
              cy="140"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              className={`${phaseConfig.textColor} transition-all duration-1000 ease-in-out`}
              strokeLinecap="round"
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              key={currentPhase}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-4xl font-mono font-bold ${phaseConfig.textColor} mb-2`}
            >
              {formatTime(timeLeft)}
            </motion.div>
            <div className={`text-sm font-medium ${phaseConfig.textColor} uppercase tracking-wide`}>
              {phaseConfig.label}
            </div>
            {currentPhase === 'focus' && timer.isActive && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mt-2 w-2 h-2 bg-red-500 rounded-full"
              />
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-4">
        {!timer.isActive ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            className="px-6 py-3 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors flex items-center space-x-2"
          >
            <Play className="w-5 h-5" />
            <span>{currentPhase === 'paused' ? '시작' : '재개'}</span>
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePause}
            className="px-6 py-3 bg-yellow-500 text-white rounded-full font-medium hover:bg-yellow-600 transition-colors flex items-center space-x-2"
          >
            <Pause className="w-5 h-5" />
            <span>일시정지</span>
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleReset}
          className="px-6 py-3 bg-gray-500 text-white rounded-full font-medium hover:bg-gray-600 transition-colors flex items-center space-x-2"
        >
          <RotateCcw className="w-5 h-5" />
          <span>리셋</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowSettings(true)}
          className="px-6 py-3 border border-gray-300 rounded-full font-medium hover:bg-gray-50 transition-colors flex items-center space-x-2"
        >
          <Settings className="w-5 h-5" />
          <span>설정</span>
        </motion.button>
      </div>

      {/* ADHD-friendly Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 rounded-lg p-4 space-y-2"
      >
        <h3 className="font-medium text-blue-900 flex items-center">
          <Timer className="w-4 h-4 mr-2" />
          ADHD 친화적 집중 팁
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 25분은 ADHD 뇌의 최적 집중 지속 시간입니다</li>
          <li>• 5분 휴식은 도파민 시스템 회복에 중요합니다</li>
          <li>• 완료 시 즉시 보상(점수)으로 동기 유지</li>
          <li>• 환경 방해 요소를 미리 제거하세요</li>
        </ul>
      </motion.div>

      {/* Session History Preview */}
      {timer.sessionCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 rounded-lg p-4"
        >
          <h3 className="font-medium text-green-900 mb-2">오늘의 성과</h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{timer.sessionCount}</div>
              <div className="text-xs text-green-700">완료 세션</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {Math.floor(timer.totalFocusTime / 60)}분
              </div>
              <div className="text-xs text-green-700">총 집중 시간</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowSettings(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">타이머 설정</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  집중 시간 (분)
                </label>
                <input
                  type="number"
                  min="15"
                  max="60"
                  value={tempSettings.focus_duration}
                  onChange={(e) => setTempSettings(prev => ({ ...prev, focus_duration: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">ADHD: 15-25분 권장</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  휴식 시간 (분)
                </label>
                <input
                  type="number"
                  min="3"
                  max="15"
                  value={tempSettings.break_duration}
                  onChange={(e) => setTempSettings(prev => ({ ...prev, break_duration: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">마이크로브레이크: 3-5분 권장</p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSaveSettings}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                저장
              </button>
              <button
                onClick={() => {
                  setShowSettings(false)
                  setTempSettings({
                    focus_duration: profile?.focus_duration || 25,
                    break_duration: profile?.break_duration || 5
                  })
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

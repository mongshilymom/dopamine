import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Timer, 
  Brain, 
  Target, 
  TrendingUp, 
  Award, 
  Clock,
  CheckCircle,
  Zap
} from 'lucide-react'
import { useAppStore } from '../stores/app'
import type { SinceWakeStats } from '../types'

export const Dashboard: React.FC = () => {
  const { 
    profile, 
    stats, 
    loadStats, 
    timer, 
    plans, 
    user,
    signInAnonymously 
  } = useAppStore()

  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    // Set greeting based on time of day
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('좋은 아침이에요!')
    else if (hour < 17) setGreeting('좋은 오후에요!')
    else setGreeting('좋은 저녁이에요!')

    if (user) {
      loadStats()
    }
  }, [user, loadStats])

  const getMotivationalMessage = () => {
    if (!stats) return '시작할 준비가 되셨나요?'

    if (stats.focus_sessions_completed === 0) {
      return '첫 집중 세션을 시작해보세요! 🚀'
    } else if (stats.focus_sessions_completed < 3) {
      return '좋은 시작입니다! 계속해서 집중해보세요 💪'
    } else if (stats.focus_sessions_completed < 6) {
      return '훌륭해요! 집중력이 높아지고 있어요 ⭐'
    } else {
      return '대단해요! 오늘 정말 생산적이네요! 🎉'
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`
    }
    return `${minutes}분`
  }

  if (!user) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
          >
            <Brain className="w-16 h-16 text-red-500 mx-auto mb-4" />
          </motion.div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">FOCUS NEXUS</h1>
            <p className="text-gray-600 mb-6">
              ADHD 친화적 집중력 향상 앱
            </p>
            <div className="text-sm text-gray-500 mb-6">
              <p>✓ 과학적 근거 기반 If-Then 계획</p>
              <p>✓ 25/5 포모도로 타이머</p>
              <p>✓ 집중 노이즈 & 게이미피케이션</p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={signInAnonymously}
            className="w-full px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
          >
            시작하기 (익명 로그인)
          </motion.button>

          <p className="text-xs text-gray-500">
            개인정보 수집 없음 • 안전한 익명 사용
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h1 className="text-2xl font-bold text-gray-900">{greeting}</h1>
        <p className="text-gray-600">{getMotivationalMessage()}</p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-red-50 rounded-lg p-4 text-center"
        >
          <Timer className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-red-600">
            {stats?.focus_sessions_completed || 0}
          </div>
          <div className="text-xs text-red-700">완료 세션</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-green-50 rounded-lg p-4 text-center"
        >
          <Clock className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-600">
            {stats ? formatTime(stats.total_focus_time) : '0분'}
          </div>
          <div className="text-xs text-green-700">총 집중 시간</div>
        </motion.div>
      </div>

      {/* Current Timer Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg border p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800">현재 타이머</h3>
          <div className={`w-3 h-3 rounded-full ${
            timer.isActive ? 'bg-red-500 animate-pulse' : 'bg-gray-300'
          }`} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">
              {timer.phase === 'focus' && '🎯 집중 모드'}
              {timer.phase === 'break' && '☕ 휴식 모드'}
              {timer.phase === 'paused' && '⏸️ 일시정지'}
            </div>
            <div className="text-lg font-mono font-bold text-gray-900">
              {Math.floor(timer.timeLeft / 60).toString().padStart(2, '0')}:
              {(timer.timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-gray-500">오늘 세션</div>
            <div className="text-lg font-bold text-gray-700">{timer.sessionCount}</div>
          </div>
        </div>
      </motion.div>

      {/* If-Then Plans Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg border p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800 flex items-center">
            <Target className="w-5 h-5 mr-2 text-blue-500" />
            If-Then 계획
          </h3>
          <div className="text-sm text-gray-500">{plans.length}개</div>
        </div>

        {plans.length === 0 ? (
          <p className="text-sm text-gray-600">
            아직 계획이 없습니다. 새로운 If-Then 계획을 만들어보세요!
          </p>
        ) : (
          <div className="space-y-2">
            {plans.slice(0, 2).map((plan) => (
              <div key={plan.id} className="text-sm bg-gray-50 p-2 rounded">
                <div className="font-medium text-gray-800 truncate">
                  {plan.if_condition}
                </div>
                {plan.trigger_count > 0 && (
                  <div className="text-xs text-green-600 mt-1">
                    ✓ {plan.trigger_count}회 실행됨
                  </div>
                )}
              </div>
            ))}
            {plans.length > 2 && (
              <div className="text-xs text-gray-500 text-center">
                +{plans.length - 2}개 더 있음
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Achievement Preview */}
      {profile && profile.total_points > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Award className="w-6 h-6 text-yellow-500" />
              <div>
                <h3 className="font-semibold text-yellow-800">성취도</h3>
                <p className="text-sm text-yellow-700">
                  레벨 {profile.level} • {profile.total_points}포인트
                </p>
              </div>
            </div>
            {profile.badges.length > 0 && (
              <div className="text-2xl">
                🏆
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Quick Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 gap-3"
      >
        <button className="bg-red-500 text-white p-4 rounded-lg text-center hover:bg-red-600 transition-colors">
          <Timer className="w-6 h-6 mx-auto mb-2" />
          <div className="text-sm font-medium">타이머 시작</div>
        </button>

        <button className="bg-blue-500 text-white p-4 rounded-lg text-center hover:bg-blue-600 transition-colors">
          <Target className="w-6 h-6 mx-auto mb-2" />
          <div className="text-sm font-medium">계획 만들기</div>
        </button>
      </motion.div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-blue-50 rounded-lg p-4"
      >
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
          <Zap className="w-4 h-4 mr-2" />
          오늘의 팁
        </h3>
        <p className="text-sm text-blue-800">
          ADHD 뇌는 새로운 도전을 좋아합니다. 오늘은 새로운 If-Then 계획을 하나 만들어보세요!
        </p>
      </motion.div>
    </div>
  )
}

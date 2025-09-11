import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, 
  Timer, 
  Target, 
  Waves, 
  BarChart3,
  Loader2
} from 'lucide-react'
import { useAppStore } from './stores/app'
import { Dashboard } from './components/Dashboard'
import { FocusTimer } from './components/FocusTimer'
import { IfThenPlanner } from './components/IfThenPlanner'
import { NoisePlayer } from './components/NoisePlayer'

type Tab = 'dashboard' | 'timer' | 'planner' | 'noise' | 'stats'

const tabs = [
  { id: 'dashboard', name: '홈', icon: Home },
  { id: 'timer', name: '타이머', icon: Timer },
  { id: 'planner', name: '계획', icon: Target },
  { id: 'noise', name: '노이즈', icon: Waves },
  { id: 'stats', name: '통계', icon: BarChart3 }
] as const

function App() {
  const { initializeAuth, isLoading, user } = useAppStore()
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'timer':
        return <FocusTimer />
      case 'planner':
        return <IfThenPlanner />
      case 'noise':
        return <NoisePlayer />
      case 'stats':
        return (
          <div className="p-4 text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">통계 기능</h2>
            <p className="text-gray-500">곧 출시될 예정입니다!</p>
          </div>
        )
      default:
        return <Dashboard />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">FOCUS NEXUS 로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-center">
        <h1 className="text-lg font-bold text-gray-900">FOCUS NEXUS</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200">
        <div className="flex items-center justify-around py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all ${
                  isActive 
                    ? 'text-red-500 bg-red-50' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{tab.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"
                  />
                )}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export default App

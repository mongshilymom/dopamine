import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Clock, MapPin, Heart, Users, Edit3, Check, Zap } from 'lucide-react'
import { useAppStore } from '../stores/app'
import type { IfThenTemplate, IfThenPlan } from '../types'

// Evidence-based If-Then templates (d≈0.65 effect size according to Gollwitzer & Sheeran, 2006)
const IF_THEN_TEMPLATES: IfThenTemplate[] = [
  {
    id: 'morning-email',
    name: 'Morning Email Check',
    description: 'Limit morning email to prevent attention hijacking',
    category: 'time',
    if_condition: '아침 9시가 되면',
    then_action: '이메일을 확인하기 전에 30분 집중 작업을 먼저 하겠습니다',
    evidence_note: '아침 첫 작업이 하루 집중력을 결정합니다'
  },
  {
    id: 'distraction-thought',
    name: 'Distraction Management',
    description: 'Handle intrusive thoughts during focus sessions',
    category: 'emotional',
    if_condition: '집중 중 다른 생각이 떠오르면',
    then_action: '종이에 적고 "나중에 처리"라고 말한 후 즉시 작업으로 돌아가겠습니다',
    evidence_note: '외재화(externalization)가 working memory 부담을 줄입니다'
  },
  {
    id: 'break-ritual',
    name: 'Break Transition',
    description: 'Structure break time for better recovery',
    category: 'time',
    if_condition: '25분 집중이 끝나면',
    then_action: '자리에서 일어나 창문으로 가서 3회 깊게 숨쉬겠습니다',
    evidence_note: '물리적 이동과 호흡이 정신적 전환을 돕습니다'
  },
  {
    id: 'procrastination-trigger',
    name: 'Procrastination Response',
    description: 'Combat task avoidance with immediate action',
    category: 'emotional',
    if_condition: '하기 싫은 일이 생기면',
    then_action: '2분만 하자고 스스로에게 말하고 즉시 시작하겠습니다',
    evidence_note: '시작 장벽이 가장 높습니다 (Zeigarnik Effect)'
  },
  {
    id: 'workspace-setup',
    name: 'Workspace Preparation',
    description: 'Create consistent environmental cues',
    category: 'location',
    if_condition: '책상에 앉으면',
    then_action: '핸드폰을 다른 방에 두고 물을 준비한 후 타이머를 시작하겠습니다',
    evidence_note: '환경 조성이 자동 행동을 유발합니다'
  },
  {
    id: 'interruption-protocol',
    name: 'Interruption Management',
    description: 'Handle external distractions effectively',
    category: 'social',
    if_condition: '누군가가 말을 걸면',
    then_action: '"지금 집중 중이니 30분 후에 이야기할까요?"라고 정중하게 말하겠습니다',
    evidence_note: '경계 설정이 집중력 보호에 필수적입니다'
  }
]

const categoryIcons = {
  time: Clock,
  location: MapPin,
  emotional: Heart,
  social: Users,
  custom: Edit3
}

const categoryColors = {
  time: 'bg-blue-100 text-blue-700',
  location: 'bg-green-100 text-green-700',
  emotional: 'bg-pink-100 text-pink-700',
  social: 'bg-purple-100 text-purple-700',
  custom: 'bg-gray-100 text-gray-700'
}

export const IfThenPlanner: React.FC = () => {
  const { plans, createPlan, triggerPlan, loadPlans, user } = useAppStore()
  const [selectedTemplate, setSelectedTemplate] = useState<IfThenTemplate | null>(null)
  const [isCreatingCustom, setIsCreatingCustom] = useState(false)
  const [customPlan, setCustomPlan] = useState({
    if_condition: '',
    then_action: '',
    category: 'custom' as const
  })

  useEffect(() => {
    if (user) {
      loadPlans()
    }
  }, [user, loadPlans])

  const handleTemplateSelect = (template: IfThenTemplate) => {
    setSelectedTemplate(template)
  }

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate) return

    await createPlan({
      if_condition: selectedTemplate.if_condition,
      then_action: selectedTemplate.then_action,
      category: selectedTemplate.category,
      is_active: true
    })

    setSelectedTemplate(null)
  }

  const handleCreateCustom = async () => {
    if (!customPlan.if_condition || !customPlan.then_action) return

    await createPlan({
      ...customPlan,
      is_active: true
    })

    setCustomPlan({ if_condition: '', then_action: '', category: 'custom' })
    setIsCreatingCustom(false)
  }

  const handleTriggerPlan = async (planId: string) => {
    await triggerPlan(planId)
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header with scientific backing */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">If-Then 계획 도구</h2>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          "만약 X가 일어나면, Y를 하겠다"식 계획으로 자동적 행동을 만들어보세요.
          <span className="block text-xs text-green-600 mt-1">
            ✓ 과학적 검증: 목표 달성률 2배 향상 (효과크기 d≈0.65)
          </span>
        </p>
      </div>

      {/* My Plans */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <Check className="w-5 h-5 mr-2 text-green-500" />
          내 계획들 ({plans.length})
        </h3>

        {plans.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Edit3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>아직 만든 계획이 없습니다.</p>
            <p className="text-sm">아래 템플릿을 선택하거나 직접 만들어보세요.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {plans.map((plan) => {
              const Icon = categoryIcons[plan.category]
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-4 bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Icon className="w-4 h-4 mr-2 text-gray-500" />
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[plan.category]}`}>
                          {plan.category}
                        </span>
                        {plan.trigger_count > 0 && (
                          <span className="ml-2 text-xs text-gray-500">
                            {plan.trigger_count}회 실행
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-1">
                        <strong>만약</strong> {plan.if_condition}
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>그러면</strong> {plan.then_action}
                      </p>
                    </div>
                    <button
                      onClick={() => handleTriggerPlan(plan.id)}
                      className="ml-4 px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 transition-colors flex items-center"
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      실행됨
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Templates */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800">추천 템플릿</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {IF_THEN_TEMPLATES.map((template) => {
            const Icon = categoryIcons[template.category]
            return (
              <motion.div
                key={template.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTemplateSelect(template)}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all $${
                  selectedTemplate?.id === template.id 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center mb-2">
                  <Icon className="w-4 h-4 mr-2 text-gray-500" />
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[template.category]}`}>
                    {template.category}
                  </span>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">{template.name}</h4>
                <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                {template.evidence_note && (
                  <p className="text-xs text-green-600 bg-green-50 p-2 rounded">
                    💡 {template.evidence_note}
                  </p>
                )}
              </motion.div>
            )
          })}
        </div>

        {selectedTemplate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border rounded-lg p-4 bg-blue-50"
          >
            <h4 className="font-medium mb-2">선택한 템플릿: {selectedTemplate.name}</h4>
            <div className="space-y-2 text-sm">
              <p><strong>만약</strong> {selectedTemplate.if_condition}</p>
              <p><strong>그러면</strong> {selectedTemplate.then_action}</p>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCreateFromTemplate}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                계획 생성
              </button>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Custom Plan Creation */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800">직접 만들기</h3>

        {!isCreatingCustom ? (
          <button
            onClick={() => setIsCreatingCustom(true)}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex items-center justify-center text-gray-600"
          >
            <Plus className="w-5 h-5 mr-2" />
            나만의 If-Then 계획 만들기
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border rounded-lg p-4 bg-gray-50 space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상황 (If): 언제, 어디서, 어떤 상황에서
              </label>
              <input
                type="text"
                value={customPlan.if_condition}
                onChange={(e) => setCustomPlan(prev => ({ ...prev, if_condition: e.target.value }))}
                placeholder="예: 스마트폰을 보고 싶은 충동이 들면"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                행동 (Then): 구체적으로 무엇을 할 것인지
              </label>
              <input
                type="text"
                value={customPlan.then_action}
                onChange={(e) => setCustomPlan(prev => ({ ...prev, then_action: e.target.value }))}
                placeholder="예: 3번 깊게 숨쉬고 현재 작업에 집중하겠습니다"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
              <select
                value={customPlan.category}
                onChange={(e) => setCustomPlan(prev => ({ ...prev, category: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="custom">사용자 정의</option>
                <option value="time">시간</option>
                <option value="location">장소</option>
                <option value="emotional">감정</option>
                <option value="social">사회적</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCreateCustom}
                disabled={!customPlan.if_condition || !customPlan.then_action}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                계획 생성
              </button>
              <button
                onClick={() => {
                  setIsCreatingCustom(false)
                  setCustomPlan({ if_condition: '', then_action: '', category: 'custom' })
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

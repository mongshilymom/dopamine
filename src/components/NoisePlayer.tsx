import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  Info, 
  Waves, 
  Wind,
  Settings,
  Shield
} from 'lucide-react'
import { useAppStore } from '../stores/app'

export const NoisePlayer: React.FC = () => {
  const { noise, setNoiseType, setNoiseVolume, profile, updateProfile } = useAppStore()
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  // Audio nodes
  const gainNodeRef = useRef<GainNode | null>(null)
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null)
  const bufferRef = useRef<AudioBuffer | null>(null)

  // Initialize AudioContext (requires user interaction)
  const initializeAudioContext = async () => {
    if (!audioContext) {
      const ctx = new AudioContext()
      setAudioContext(ctx)

      // Create gain node for volume control
      const gainNode = ctx.createGain()
      gainNode.connect(ctx.destination)
      gainNodeRef.current = gainNode

      return ctx
    }
    return audioContext
  }

  // Generate white noise buffer
  const createWhiteNoiseBuffer = (ctx: AudioContext, duration = 2) => {
    const sampleRate = ctx.sampleRate
    const length = sampleRate * duration
    const buffer = ctx.createBuffer(2, length, sampleRate)

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1
      }
    }

    return buffer
  }

  // Generate pink noise buffer (1/f noise)
  const createPinkNoiseBuffer = (ctx: AudioContext, duration = 2) => {
    const sampleRate = ctx.sampleRate
    const length = sampleRate * duration
    const buffer = ctx.createBuffer(2, length, sampleRate)

    // Pink noise generation using Paul Kellett's method
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel)
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0

      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1

        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.96900 * b2 + white * 0.1538520
        b3 = 0.86650 * b3 + white * 0.3104856
        b4 = 0.55000 * b4 + white * 0.5329522
        b5 = -0.7616 * b5 - white * 0.0168980

        const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
        b6 = white * 0.115926

        data[i] = pink * 0.11 // Scale down
      }
    }

    return buffer
  }

  // Start/stop noise
  const handleNoiseToggle = async (type: 'off' | 'white' | 'pink') => {
    // Safety check: require user interaction for audio
    if (!hasUserInteracted && type !== 'off') {
      setShowWarning(true)
      return
    }

    setHasUserInteracted(true)

    try {
      if (type === 'off') {
        stopNoise()
        setNoiseType('off')
        return
      }

      const ctx = await initializeAudioContext()

      // Stop current noise
      stopNoise()

      // Create appropriate buffer
      let buffer: AudioBuffer
      if (type === 'white') {
        buffer = createWhiteNoiseBuffer(ctx)
      } else {
        buffer = createPinkNoiseBuffer(ctx)
      }

      bufferRef.current = buffer

      // Start playing
      playNoise(ctx, buffer)
      setNoiseType(type)
      setIsPlaying(true)

    } catch (error) {
      console.error('Audio error:', error)
    }
  }

  const playNoise = (ctx: AudioContext, buffer: AudioBuffer) => {
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true
    source.connect(gainNodeRef.current!)
    source.start()
    sourceNodeRef.current = source
  }

  const stopNoise = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop()
      sourceNodeRef.current = null
    }
    setIsPlaying(false)
  }

  // Volume control
  useEffect(() => {
    if (gainNodeRef.current) {
      // Apply safety limit: max 50% volume
      const safeVolume = Math.min(noise.volume, 0.5)
      gainNodeRef.current.gain.value = safeVolume
    }
  }, [noise.volume])

  // Auto-restart noise when switching types while playing
  useEffect(() => {
    if (isPlaying && audioContext && noise.type !== 'off') {
      handleNoiseToggle(noise.type)
    }
  }, [noise.type])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopNoise()
      if (audioContext) {
        audioContext.close()
      }
    }
  }, [])

  const dismissWarning = () => {
    setShowWarning(false)
    setHasUserInteracted(true)
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <Waves className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold text-gray-900">집중 노이즈</h2>
          <button
            onClick={() => setShowInfo(true)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-600">
          화이트/핑크 노이즈로 집중력 향상 및 방해 요소 차단
        </p>
        <div className="flex items-center justify-center space-x-2 text-xs text-red-600">
          <Shield className="w-3 h-3" />
          <span>안전 제한: 최대 50% 볼륨</span>
        </div>
      </div>

      {/* Noise Type Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">노이즈 종류</h3>

        <div className="grid gap-3">
          {/* Off Option */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleNoiseToggle('off')}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              noise.type === 'off'
                ? 'border-gray-500 bg-gray-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <VolumeX className={`w-6 h-6 ${noise.type === 'off' ? 'text-gray-600' : 'text-gray-400'}`} />
              <div>
                <h4 className="font-medium">끄기</h4>
                <p className="text-sm text-gray-600">노이즈 재생 중지</p>
              </div>
            </div>
          </motion.button>

          {/* White Noise */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleNoiseToggle('white')}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              noise.type === 'white'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Wind className={`w-6 h-6 ${noise.type === 'white' ? 'text-blue-600' : 'text-gray-400'}`} />
              <div>
                <h4 className="font-medium">화이트 노이즈</h4>
                <p className="text-sm text-gray-600">
                  일정한 주파수로 외부 소음 차단에 효과적
                </p>
                <div className="flex items-center mt-1 text-xs text-green-600">
                  <span>✓ 집중력 향상</span>
                  <span className="ml-3">✓ 수면 도움</span>
                </div>
              </div>
            </div>
          </motion.button>

          {/* Pink Noise */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleNoiseToggle('pink')}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              noise.type === 'pink'
                ? 'border-pink-500 bg-pink-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Waves className={`w-6 h-6 ${noise.type === 'pink' ? 'text-pink-600' : 'text-gray-400'}`} />
              <div>
                <h4 className="font-medium">핑크 노이즈</h4>
                <p className="text-sm text-gray-600">
                  자연음에 가까운 1/f 노이즈, 더 부드러운 느낌
                </p>
                <div className="flex items-center mt-1 text-xs text-green-600">
                  <span>✓ 편안함</span>
                  <span className="ml-3">✓ 기억력 향상</span>
                </div>
              </div>
            </div>
          </motion.button>
        </div>
      </div>

      {/* Volume Control */}
      {noise.type !== 'off' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-gray-800">볼륨 조절</h3>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center text-yellow-700 text-sm">
              <AlertTriangle className="w-4 h-4 mr-2" />
              <span>안전을 위해 볼륨이 50%로 제한됩니다</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Volume2 className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-600">
                {Math.round((Math.min(noise.volume, 0.5) / 0.5) * 100)}%
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="0.5"
              step="0.05"
              value={Math.min(noise.volume, 0.5)}
              onChange={(e) => setNoiseVolume(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />

            <div className="flex justify-between text-xs text-gray-500">
              <span>조용히</span>
              <span>적당히 (최대)</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Current Status */}
      {noise.type !== 'off' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-lg p-4 ${
            noise.type === 'white' ? 'bg-blue-50' : 'bg-pink-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                isPlaying 
                  ? noise.type === 'white' ? 'bg-blue-500' : 'bg-pink-500'
                  : 'bg-gray-400'
              }`} />
              <span className="font-medium">
                {noise.type === 'white' ? '화이트 노이즈' : '핑크 노이즈'} 재생 중
              </span>
            </div>
            <motion.div
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={{ duration: 2, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
            >
              <Waves className={`w-5 h-5 ${
                noise.type === 'white' ? 'text-blue-500' : 'text-pink-500'
              }`} />
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Safety Warning Modal */}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
            >
              <div className="flex items-center text-orange-600 mb-4">
                <AlertTriangle className="w-6 h-6 mr-2" />
                <h3 className="text-lg font-semibold">오디오 재생 안내</h3>
              </div>

              <div className="space-y-3 text-sm text-gray-600 mb-6">
                <p>• 적정 볼륨으로 시작하여 점진적으로 조절하세요</p>
                <p>• 장시간 사용 시 주기적으로 휴식을 취하세요</p>
                <p>• 불편함을 느끼면 즉시 중단하세요</p>
                <p>• 최대 볼륨이 50%로 제한됩니다</p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={dismissWarning}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                >
                  이해했습니다
                </button>
                <button
                  onClick={() => setShowWarning(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowInfo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">노이즈의 과학적 효과</h3>

              <div className="space-y-4 text-sm text-gray-600">
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">화이트 노이즈</h4>
                  <p>모든 주파수가 동일한 강도로 포함된 노이즈입니다. 외부 소음을 마스킹하여 집중력을 향상시킵니다.</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800 mb-1">핑크 노이즈</h4>
                  <p>1/f 특성을 가진 자연음에 가까운 노이즈입니다. 뇌파를 안정화시키고 수면의 질을 개선합니다.</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800 mb-1">ADHD 효과</h4>
                  <p>배경 노이즈가 ADHD 뇌의 각성 수준을 최적화하여 집중력과 인지 성능을 향상시킬 수 있습니다.</p>
                </div>
              </div>

              <button
                onClick={() => setShowInfo(false)}
                className="w-full mt-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                닫기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

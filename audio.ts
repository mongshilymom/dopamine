// Audio utilities for focus sessions and noise generation
export class AudioGenerator {
  private context: AudioContext | null = null
  private gainNode: GainNode | null = null
  private source: AudioBufferSourceNode | null = null
  private isPlaying = false

  constructor() {
    try {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.gainNode = this.context.createGain()
      this.gainNode.connect(this.context.destination)
    } catch (error) {
      console.warn('Web Audio API not supported:', error)
    }
  }

  // Generate white noise
  private generateWhiteNoise(duration: number = 1): AudioBuffer {
    if (!this.context) throw new Error('Audio context not available')

    const sampleRate = this.context.sampleRate
    const buffer = this.context.createBuffer(1, sampleRate * duration, sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1 // Random values between -1 and 1
    }

    return buffer
  }

  // Generate pink noise (1/f noise)
  private generatePinkNoise(duration: number = 1): AudioBuffer {
    if (!this.context) throw new Error('Audio context not available')

    const sampleRate = this.context.sampleRate
    const buffer = this.context.createBuffer(1, sampleRate * duration, sampleRate)
    const data = buffer.getChannelData(0)

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0

    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759  
      b2 = 0.96900 * b2 + white * 0.1538520
      b3 = 0.86650 * b3 + white * 0.3104856
      b4 = 0.55000 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.0168980
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
      b6 = white * 0.115926
    }

    return buffer
  }

  async playNoise(type: 'white' | 'pink', volume: number = 0.5): Promise<void> {
    if (!this.context || !this.gainNode) {
      throw new Error('Audio context not available')
    }

    if (this.context.state === 'suspended') {
      await this.context.resume()
    }

    this.stop() // Stop any existing noise

    const buffer = type === 'white' 
      ? this.generateWhiteNoise(10) // 10 seconds, will loop
      : this.generatePinkNoise(10)

    this.source = this.context.createBufferSource()
    this.source.buffer = buffer
    this.source.loop = true
    this.source.connect(this.gainNode)

    this.gainNode.gain.setValueAtTime(volume * 0.1, this.context.currentTime) // Keep volume low for safety
    this.source.start()
    this.isPlaying = true
  }

  setVolume(volume: number): void {
    if (this.gainNode && this.context) {
      // Clamp volume and apply safety limit
      const safeVolume = Math.min(Math.max(volume, 0), 1) * 0.1
      this.gainNode.gain.setValueAtTime(safeVolume, this.context.currentTime)
    }
  }

  stop(): void {
    if (this.source && this.isPlaying) {
      try {
        this.source.stop()
      } catch (error) {
        // Source might already be stopped
      }
      this.source = null
      this.isPlaying = false
    }
  }

  get playing(): boolean {
    return this.isPlaying
  }

  cleanup(): void {
    this.stop()
    if (this.context && this.context.state !== 'closed') {
      this.context.close()
    }
  }
}

// Singleton instance
export const audioGenerator = new AudioGenerator()

// Audio safety warning
export const AUDIO_SAFETY_WARNING = `
⚠️ Audio Safety Guidelines:
• Keep volume low (recommended: 30% or below)
• Take regular breaks from continuous audio
• Stop immediately if you experience discomfort
• Individual responses to noise vary significantly
• Not recommended for extended sessions (>2 hours)
`

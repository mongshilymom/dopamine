import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const enablePWA = process.env.VITE_ENABLE_PWA === 'true'

export default defineConfig({
  plugins: [
    react(),
    enablePWA && VitePWA({
      registerType: 'autoUpdate',
      manifest: { name: 'FOCUS NEXUS', short_name: 'Focus', icons: [] }, // 최소 설정
    }),
  ].filter(Boolean) as PluginOption[],
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/analyze': 'http://localhost:8000',
      '/compare': 'http://localhost:8000',
      '/history': 'http://localhost:8000',
      '/replay': 'http://localhost:8000',
      '/research': 'http://localhost:8000',
      '/debate': 'http://localhost:8000',
      '/trade': 'http://localhost:8000',
      '/price': 'http://localhost:8000',
      '/chart': 'http://localhost:8000',
      '/analysts': 'http://localhost:8000',
      '/chat': 'http://localhost:8000',
      '/fomo-check': 'http://localhost:8000',
      '/decision': 'http://localhost:8000',
      '/decisions': 'http://localhost:8000',
      '/autopsy': 'http://localhost:8000',
    },
  },
})

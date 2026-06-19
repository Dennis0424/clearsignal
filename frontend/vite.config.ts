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
      // /research/:ticker is a backend API — proxy it. The bare /research is a React page.
      '^/research/.+': { target: 'http://localhost:8000', rewrite: (p) => p },
      '/debate': 'http://localhost:8000',
      '/trade': 'http://localhost:8000',
      '/price': 'http://localhost:8000',
      '/chart': 'http://localhost:8000',
      '/analysts': 'http://localhost:8000',
      '/chat': 'http://localhost:8000',
      '/fomo-check': 'http://localhost:8000',
      '/decision-log': 'http://localhost:8000',
      '/decision-save': 'http://localhost:8000',
      '/autopsy': 'http://localhost:8000',
      '/cooldown': 'http://localhost:8000',
      '/roast': 'http://localhost:8000',
      '/degen-score': 'http://localhost:8000',
      '/portfolio/assets': 'http://localhost:8000',
      '/earnings': 'http://localhost:8000',
      '/insiders': 'http://localhost:8000',
    },
  },
})

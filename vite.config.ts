import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset URLs: itch.io serves the build from a nested CDN path.
  base: './',
  plugins: [react()],
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { agentReadyPlugin } from './src/site/vite-plugin'

// https://vite.dev/config/
const config = defineConfig({
  // Relative asset URLs: itch.io serves the build from a nested CDN path.
  base: './',
  // agentReadyPlugin: static pages, markdown mirrors, robots/sitemap/llms.txt
  // and the AI Catalog, all generated from src/site/routes.ts.
  plugins: [react(), agentReadyPlugin()],
})

export default config;

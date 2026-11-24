import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages project site
export default defineConfig({
  base: '/sistemecu/',
  plugins: [vue()],
})

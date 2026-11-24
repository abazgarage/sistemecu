import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // GitHub Pages project site: https://abazgarage.github.io/sistemecu/
  // Prefix built assets with the repository path so JS/CSS load correctly.
  base: '/sistemecu/',
  plugins: [vue()],
})

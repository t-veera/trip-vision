import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// For GitHub Pages, set VITE_BASE=/repo-name/ in your deploy workflow,
// or change the default below to match your repo name.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/',
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: Replace '<your-repo-name>' with the name of your GitHub repository
  // for deployment to GitHub Pages. For example, if your repo is 'sudoku-app',
  // the base should be '/sudoku-app/'.
  base: '/<your-repo-name>/',
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Ofuscacao removida (decisao 08/08/2026): as formulas sao conhecimento medico
// publico; ofuscar so quebrava stack traces e complicava o debug em producao.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})

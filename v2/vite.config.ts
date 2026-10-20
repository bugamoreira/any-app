import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Ofuscacao removida (decisao 08/08/2026): as formulas sao conhecimento medico
// publico; ofuscar so quebrava stack traces e complicava o debug em producao.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      treeshake: {
        // Corta console.log/info/debug do build de producao — inclusive os das
        // bibliotecas. console.error e console.warn FICAM: a checagem servidor x
        // navegador do DoseCalculator avisa por console.error
        // ('calc_divergencia_servidor_local'), e o dropConsole do minificador
        // cortaria todos de uma vez.
        manualPureFunctions: ['console.log', 'console.info', 'console.debug'],
      },
    },
  },
})

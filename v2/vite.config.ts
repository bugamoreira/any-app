import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import obfuscatorPlugin from 'rollup-plugin-obfuscator'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      plugins: [
        obfuscatorPlugin({
          options: {
            compact: true,
            controlFlowFlattening: false, // performance — desligar para app clinico
            deadCodeInjection: false,
            debugProtection: false,
            disableConsoleOutput: false, // manter console para debug
            identifierNamesGenerator: 'hexadecimal',
            renameGlobals: false,
            rotateStringArray: true,
            selfDefending: false,
            stringArray: true,
            stringArrayThreshold: 0.5, // 50% das strings obfuscadas
            unicodeEscapeSequence: false,
          }
        })
      ]
    }
  }
})

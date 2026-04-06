import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { WeightProvider } from './contexts/WeightContext'
import { ToastProvider } from './contexts/ToastContext'
import { MetronomeProvider } from './contexts/MetronomeContext'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <WeightProvider>
          <ToastProvider>
            <MetronomeProvider>
              <App />
            </MetronomeProvider>
          </ToastProvider>
        </WeightProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)

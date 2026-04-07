import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { Splash } from './components/layout/Splash'

// Hub carrega eager (primeira tela)
import Hub from './pages/Hub'

// Ferramentas carregam lazy (sob demanda)
const BlockPath = lazy(() => import('./pages/BlockPath'))
const InfusionGuide = lazy(() => import('./pages/InfusionGuide'))
const PaliaPath = lazy(() => import('./pages/PaliaPath'))
const ShockPath = lazy(() => import('./pages/ShockPath'))
const DenguePath = lazy(() => import('./pages/DenguePath'))
const TepGuide = lazy(() => import('./pages/TepGuide'))
const SedaPath = lazy(() => import('./pages/SedaPath'))
const AirwayGuide = lazy(() => import('./pages/AirwayGuide'))
const AclsGuide = lazy(() => import('./pages/AclsGuide'))
const PedGuide = lazy(() => import('./pages/PedGuide'))
const VmGuide = lazy(() => import('./pages/VmGuide'))
const ToxPath = lazy(() => import('./pages/ToxPath'))
const Calculators = lazy(() => import('./pages/Calculators'))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <Splash />
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Splash />}>
      {children}
    </Suspense>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Hub /></ProtectedRoute>} />
      <Route path="/block" element={<ProtectedRoute><LazyPage><BlockPath /></LazyPage></ProtectedRoute>} />
      <Route path="/infusion" element={<ProtectedRoute><LazyPage><InfusionGuide /></LazyPage></ProtectedRoute>} />
      <Route path="/palia" element={<ProtectedRoute><LazyPage><PaliaPath /></LazyPage></ProtectedRoute>} />
      <Route path="/shock" element={<ProtectedRoute><LazyPage><ShockPath /></LazyPage></ProtectedRoute>} />
      <Route path="/dengue" element={<ProtectedRoute><LazyPage><DenguePath /></LazyPage></ProtectedRoute>} />
      <Route path="/tep" element={<ProtectedRoute><LazyPage><TepGuide /></LazyPage></ProtectedRoute>} />
      <Route path="/seda" element={<ProtectedRoute><LazyPage><SedaPath /></LazyPage></ProtectedRoute>} />
      <Route path="/airway" element={<ProtectedRoute><LazyPage><AirwayGuide /></LazyPage></ProtectedRoute>} />
      <Route path="/acls" element={<ProtectedRoute><LazyPage><AclsGuide /></LazyPage></ProtectedRoute>} />
      <Route path="/ped" element={<ProtectedRoute><LazyPage><PedGuide /></LazyPage></ProtectedRoute>} />
      <Route path="/vm" element={<ProtectedRoute><LazyPage><VmGuide /></LazyPage></ProtectedRoute>} />
      <Route path="/tox" element={<ProtectedRoute><LazyPage><ToxPath /></LazyPage></ProtectedRoute>} />
      <Route path="/calculadoras" element={<ProtectedRoute><LazyPage><Calculators /></LazyPage></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function LoginPage() {
  const { session, loading, signInWithGoogle } = useAuth()
  if (loading) return <Splash />
  if (session) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center gap-8 p-6">
      {/* Logo quadrado empilhado */}
      <div className="w-[180px] h-[180px] rounded-[20px] overflow-hidden" style={{ boxShadow: '0 0 0 4px #000' }}>
        <img
          src="/splash-logo.jpeg"
          alt="ANY App"
          className="w-full h-full object-cover scale-105"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      </div>

      {/* Créditos */}
      <div className="text-center">
        <p className="text-sm text-text-secondary">Gustavo Moreira &#8226; Gabriela Feltrin &#8226; João Pedro Moreira</p>
      </div>

      {/* Descrição */}
      <p className="text-sm text-text-secondary text-center">
        Plataforma de apoio à decisão clínica
      </p>

      {/* Botão Google */}
      <button
        onClick={signInWithGoogle}
        className="flex items-center justify-center gap-3 bg-white text-gray-800 w-full max-w-[320px] px-6 py-4 rounded-2xl font-semibold text-base shadow-lg hover:shadow-xl transition-shadow min-h-[56px]"
      >
        <svg width="22" height="22" viewBox="0 0 48 48" className="flex-shrink-0"><path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 000 24c0 3.77.9 7.35 2.56 10.59l7.97-5.99z"/><path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        Entrar com Google
      </button>

      {/* Disclaimer */}
      <p className="text-xs text-text-muted text-center max-w-[280px] leading-relaxed">
        Nenhum dado de paciente é armazenado.
      </p>
    </div>
  )
}

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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function LoginPage() {
  const { session, loading, signInWithGoogle } = useAuth()
  if (loading) return <Splash />
  if (session) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center gap-6 p-6">
      <img
        src="/logo.png"
        alt="ANY App"
        className="w-[280px]"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-primary">ANY App</h1>
        <p className="text-sm text-text-secondary mt-1">Medicina de Emergencia</p>
      </div>
      <button
        onClick={signInWithGoogle}
        className="flex items-center gap-3 bg-white text-gray-800 px-6 py-3 rounded-xl font-medium text-sm shadow-lg hover:shadow-xl transition-shadow min-h-[48px]"
      >
        <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 000 24c0 3.77.9 7.35 2.56 10.59l7.97-5.99z"/><path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        Entrar com Google
      </button>
      <p className="text-xs text-text-muted text-center max-w-[260px]">
        Ferramenta de apoio a decisao clinica. Nao substitui o julgamento medico.
      </p>
    </div>
  )
}

import { useNavigate } from 'react-router-dom'
import { Disclaimer } from '../components/layout/Disclaimer'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { Container } from '../components/layout/Container'
import { ToastContainer } from '../components/common/Toast'
import type { ReactNode } from 'react'

interface ToolCard {
  key: string
  name: string
  icon: ReactNode
  color: string
  path: string
  isNew?: boolean
}

const tools: ToolCard[] = [
  {
    key: 'infusion', name: 'Calculadora de infusões', color: '#FF5252', path: '/infusion',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="3" width="12" height="18" rx="2" ry="2"/><line x1="6" y1="8" x2="18" y2="8"/><line x1="10" y1="3" x2="10" y2="8"/><line x1="14" y1="3" x2="14" y2="8"/></svg>
  },
  {
    key: 'airway', name: 'Airway Guide', color: '#FF5252', path: '/airway',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C10 2 8 4 8 7v4c0 2 1 3 2 4l-2 7h8l-2-7c1-1 2-2 2-4V7c0-3-2-5-4-5z"/><circle cx="12" cy="5" r="1"/></svg>
  },
  {
    key: 'vm', name: 'VM Guide', color: '#FF5252', path: '/vm',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="12" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="14" y2="10"/><path d="M8 14v6M16 14v6M6 20h4M14 20h4"/></svg>
  },
  {
    key: 'tep', name: 'TEP Guide', color: '#FF5252', path: '/tep',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 4C6 4 4 6 4 9c0 4 3 7 4 10h1C8 16 6 13 6 9c0-2 1-3 2-3"/><path d="M16 4c2 0 4 2 4 5 0 4-3 7-4 10h-1c1-3 3-6 3-10 0-2-1-3-2-3"/><line x1="12" y1="2" x2="12" y2="19"/><path d="M9 19h6"/><circle cx="14" cy="9" r="1.5"/><line x1="14" y1="9" x2="17" y2="7"/></svg>
  },
  {
    key: 'seda', name: 'Seda Path', color: '#FF5252', path: '/seda',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="4" width="10" height="16" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><circle cx="12" cy="14" r="2"/><line x1="12" y1="12" x2="12" y2="10"/></svg>
  },
  {
    key: 'tox', name: 'Tox Path', color: '#FF5252', path: '/tox',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v6.5c0 1-1.5 2.5-1.5 4.5 0 3 2 5 3.5 5s3.5-2 3.5-5c0-2-1.5-3.5-1.5-4.5V2"/><line x1="8.5" y1="2" x2="15.5" y2="2"/></svg>
  },
  {
    key: 'ped', name: 'Ped Guide', color: '#FF5252', path: '/ped',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="6" r="3"/><path d="M12 9v4"/><path d="M8 13h8"/><path d="M9 13l-1 8h2l2-4 2 4h2l-1-8"/></svg>
  },
  {
    key: 'palia', name: 'Palia Path', color: '#FF5252', path: '/palia',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/><path d="M12 13v4"/><path d="M10 15h4"/></svg>
  },
  {
    key: 'block', name: 'Block Path', color: '#FF5252', path: '/block',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2l4 4-9.5 9.5-4-4L18 2z"/><path d="M8.5 11.5L2 18v4h4l6.5-6.5"/><path d="M14.5 5.5l4 4"/></svg>
  },
  {
    key: 'acls', name: 'ACLS Guide', color: '#FF5252', path: '/acls',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
  },
  {
    key: 'dengue', name: 'Dengue Path', color: '#FF5252', path: '/dengue',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
  },
  {
    key: 'shock', name: 'Shock Path', color: '#FF5252', path: '/shock', isNew: true,
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
  },
  {
    key: 'calculadoras', name: 'Calculadoras', color: '#2196F3', path: '/calculadoras', isNew: true,
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="10" y2="18"/><line x1="14" y1="18" x2="16" y2="18"/></svg>
  },
]

export default function Hub() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg-primary">
      <Disclaimer />
      <Header title="" subtitle="" />
      <Container>
        {/* v1: .section-title { font-size:11px; letter-spacing:2px; margin:16px 0 } */}
        <div className="my-4 text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[2px] text-text-muted">
            FERRAMENTAS DISPONÍVEIS
          </span>
        </div>
        {/* v1: .main-grid { grid-template-columns:repeat(2,1fr); gap:12px } */}
        <div className="grid grid-cols-2 gap-3">
          {tools.map(tool => (
            <div
              key={tool.key}
              onClick={() => navigate(tool.path)}
              className="relative overflow-hidden bg-bg-card border border-[#333] rounded-2xl pt-6 pb-6 px-4 flex flex-col items-center text-center cursor-pointer active:scale-[0.98] active:bg-bg-hover transition-all min-h-[120px] justify-center"
            >
              {/* v1: .new-badge { position:absolute; top:10px; right:-28px; rotate(45deg); font-size:9px; padding:3px 30px } */}
              {tool.isNew && (
                <span className="absolute top-[10px] right-[-28px] bg-warning text-black text-[9px] font-bold py-[3px] px-[30px] rotate-45 tracking-[1px] z-[2]">
                  NOVO
                </span>
              )}
              {/* v1: .icon { width:40px; height:40px; margin-bottom:12px } */}
              <div className="w-[40px] h-[40px] mb-3" style={{ color: tool.color }}>
                {tool.icon}
              </div>
              {/* v1: .name { font-size:14px; font-weight:600 } */}
              <div className="text-sm font-semibold text-text-primary leading-tight">{tool.name}</div>
            </div>
          ))}
        </div>
      </Container>
      <Footer toolName="Hub" version="v2.0.0" updatedAt="Abril 2026" />
      <ToastContainer />
    </div>
  )
}

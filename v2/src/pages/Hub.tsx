import { useNavigate } from 'react-router-dom'
import { Disclaimer } from '../components/layout/Disclaimer'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { Container } from '../components/layout/Container'
import { Card } from '../components/common/Card'
import { ToastContainer } from '../components/common/Toast'

interface ToolCard {
  key: string
  name: string
  description: string
  color: string
  path: string
  isNew?: boolean
}

const tools: ToolCard[] = [
  { key: 'infusion', name: 'Calculadora de Infusoes', description: 'Drogas vasoativas e sedacao', color: '#FF5252', path: '/infusion' },
  { key: 'airway', name: 'Airway Guide', description: 'Manejo de via aerea dificil', color: '#FF5252', path: '/airway' },
  { key: 'vm', name: 'VM Guide', description: 'Ventilacao mecanica invasiva', color: '#FF5252', path: '/vm' },
  { key: 'tep', name: 'TEP Guide', description: 'Tromboembolismo pulmonar', color: '#FF5252', path: '/tep' },
  { key: 'seda', name: 'Seda Path', description: 'Sedacao procedimental', color: '#FF5252', path: '/seda' },
  { key: 'tox', name: 'Tox Path', description: 'Intoxicacoes e antidotos', color: '#FF5252', path: '/tox' },
  { key: 'ped', name: 'Ped Guide', description: 'Emergencia pediatrica', color: '#FF5252', path: '/ped' },
  { key: 'palia', name: 'Palia Path', description: 'Cuidados paliativos', color: '#FF5252', path: '/palia' },
  { key: 'block', name: 'Block Path', description: 'Bloqueios regionais', color: '#FF5252', path: '/block' },
  { key: 'acls', name: 'ACLS Guide', description: 'Gestao de PCR com metronomo', color: '#FF5252', path: '/acls' },
  { key: 'dengue', name: 'Dengue Path', description: 'Manejo de dengue', color: '#FF5252', path: '/dengue', isNew: true },
  { key: 'shock', name: 'Shock Path', description: 'Choque septico', color: '#FF5252', path: '/shock', isNew: true },
]

export default function Hub() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg-primary">
      <Disclaimer />
      <Header title="" subtitle="" />
      <Container>
        <div className="grid grid-cols-2 gap-3">
          {tools.map(tool => (
            <Card
              key={tool.key}
              borderColor={tool.color}
              onClick={() => navigate(tool.path)}
              className="relative"
            >
              {tool.isNew && (
                <span className="absolute top-2 right-2 bg-accent text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  NOVO
                </span>
              )}
              <div className="text-sm font-semibold text-text-primary">{tool.name}</div>
              <div className="text-xs text-text-muted mt-1">{tool.description}</div>
            </Card>
          ))}
        </div>
      </Container>
      <Footer toolName="Hub" version="v2.0.0" />
      <ToastContainer />
    </div>
  )
}

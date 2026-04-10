import type { PathwayStep } from '../../types/clinical'

interface StepperNavProps {
  steps: PathwayStep[]
  currentStep: number
  onNavigate: (stepNumber: number) => void
}

// v1: .progress-container { display:flex; justify-content:center; gap:6px; padding:12px 0; flex-wrap:wrap }
// v1: .progress-dot { width:10px; height:10px; border-radius:50%; bg:var(--bg-elevated); border:1px solid var(--border); cursor:pointer; transition:all 0.2s }
// v1: .progress-dot.active { bg:var(--accent); border-color:var(--accent); transform:scale(1.2) }
// v1: .progress-dot.completed { bg:var(--success); border-color:var(--success) }

export function StepperNav({ steps, currentStep, onNavigate }: StepperNavProps) {
  const current = steps.find(s => s.number === currentStep)

  return (
    <div className="mb-5">
      {/* Dots — v1: centered, wrap, gap 6px */}
      <div className="flex justify-center gap-[6px] py-3 flex-wrap">
        {steps.map((step) => {
          const isCurrent = step.number === currentStep
          const isDone = step.number < currentStep
          return (
            <button
              key={step.id}
              onClick={() => onNavigate(step.number)}
              className="p-[17px] bg-transparent border-none cursor-pointer flex items-center justify-center"
              aria-label={`Passo ${step.number}: ${step.title}`}
            >
              <span className={`block w-[10px] h-[10px] rounded-full border transition-all duration-200 ${
                isCurrent
                  ? 'bg-accent border-accent scale-[1.2]'
                  : isDone
                    ? 'bg-success border-success'
                    : 'bg-bg-elevated border-border-card'
              }`} />
            </button>
          )
        })}
      </div>
      {/* Step title — v1: .step-number + .step-title below dots */}
      {current && (
        <div className="text-center text-sm font-semibold text-accent">
          Passo {current.number} de {steps.length} — {current.title}
        </div>
      )}
    </div>
  )
}

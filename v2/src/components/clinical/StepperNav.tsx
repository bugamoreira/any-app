import type { PathwayStep } from '../../types/clinical'

interface StepperNavProps {
  steps: PathwayStep[]
  currentStep: number
  onNavigate: (stepNumber: number) => void
}

export function StepperNav({ steps, currentStep, onNavigate }: StepperNavProps) {
  return (
    <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2">
      {steps.map((step) => {
        const isCurrent = step.number === currentStep
        const isDone = step.number < currentStep
        return (
          <button
            key={step.id}
            onClick={() => onNavigate(step.number)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border-none cursor-pointer transition-colors min-h-[44px] whitespace-nowrap ${
              isCurrent
                ? 'bg-accent text-white'
                : isDone
                  ? 'bg-bg-hover text-success'
                  : 'bg-bg-elevated text-text-muted'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              isCurrent ? 'bg-white text-accent' : isDone ? 'bg-success text-white' : 'bg-bg-hover text-text-muted'
            }`}>
              {isDone ? '✓' : step.number}
            </span>
            {isCurrent && step.title}
          </button>
        )
      })}
    </div>
  )
}

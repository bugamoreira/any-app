import { useToast, type ToastType } from '../../contexts/ToastContext'

const typeStyles: Record<ToastType, string> = {
  success: 'bg-success',
  error: 'bg-danger',
  warning: 'bg-warning text-black',
  info: 'bg-info',
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[10000] flex flex-col gap-2 w-[90%] max-w-[400px]">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`${typeStyles[toast.type]} text-white px-4 py-3 rounded-xl text-sm font-medium shadow-xl animate-slide-down cursor-pointer`}
          onClick={() => removeToast(toast.id)}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}

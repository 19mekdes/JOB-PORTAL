/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useState } from 'react'
import {
  CheckCircle,
  XCircle,
  Info,
  X,
  Bell,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'default'

export interface ToastProps {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  onClose?: () => void
}

interface ToastNotificationProps extends ToastProps {
  onRemove: (id: string) => void
}

const toastStyles = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    iconColor: 'text-green-500',
    progressColor: 'bg-green-500'
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-500',
    progressColor: 'bg-red-500'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-500',
    progressColor: 'bg-yellow-500'
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-500',
    progressColor: 'bg-blue-500'
  },
  default: {
    icon: Bell,
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-800',
    iconColor: 'text-gray-500',
    progressColor: 'bg-gray-500'
  }
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  action,
  onClose,
  onRemove
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const [progress, setProgress] = useState(100)
  const [isPaused, setIsPaused] = useState(false)
  const styles = toastStyles[type]

  useEffect(() => {
    if (duration === 0) return

    const startTime = Date.now()
    const endTime = startTime + duration

    const interval = setInterval(() => {
      if (!isPaused) {
        const now = Date.now()
        const remaining = Math.max(0, endTime - now)
        const newProgress = (remaining / duration) * 100
        setProgress(newProgress)

        if (remaining <= 0) {
          clearInterval(interval)
          handleClose()
        }
      }
    }, 50)

    return () => clearInterval(interval)
  }, [duration, isPaused])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      onRemove(id)
      onClose?.()
    }, 300)
  }

  const Icon = styles.icon

  return (
    <div
      className={cn(
        "relative w-full max-w-sm overflow-hidden rounded-lg border shadow-lg transition-all duration-300 transform",
        styles.bgColor,
        styles.borderColor,
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="alert"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="shrink-0">
            <Icon className={cn("h-5 w-5", styles.iconColor)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className={cn("text-sm font-semibold", styles.textColor)}>
              {title}
            </h3>
            {message && (
              <p className={cn("mt-1 text-sm", styles.textColor, "opacity-90")}>
                {message}
              </p>
            )}
            {action && (
              <button
                onClick={() => {
                  action.onClick()
                  handleClose()
                }}
                className={cn(
                  "mt-2 text-sm font-medium hover:underline",
                  styles.textColor
                )}
              >
                {action.label}
              </button>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className={cn(
              "shrink-0 rounded-md p-1 transition-colors",
              styles.textColor,
              "hover:bg-black/5"
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {duration > 0 && (
        <div
          className={cn("h-1 transition-all duration-100", styles.progressColor)}
          style={{ width: `${progress}%` }}
        />
      )}
    </div>
  )
}

// Toast Container Component
interface ToastContainerProps {
  toasts: ToastProps[]
  onRemove: (id: string) => void
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemove,
  position = 'top-right'
}) => {
  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col gap-2",
        positionClasses[position],
        position.includes('center') && "items-center"
      )}
    >
      {toasts.map((toast) => (
        <ToastNotification
          key={toast.id}
          {...toast}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}

// Toast Context and Hook
interface ToastContextType {
  toasts: ToastProps[]
  showToast: (toast: Omit<ToastProps, 'id'>) => void
  showSuccess: (title: string, message?: string, duration?: number) => void
  showError: (title: string, message?: string, duration?: number) => void
  showWarning: (title: string, message?: string, duration?: number) => void
  showInfo: (title: string, message?: string, duration?: number) => void
  removeToast: (id: string) => void
  clearAll: () => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const showToast = (toast: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { ...toast, id }])
  }

  const showSuccess = (title: string, message?: string, duration?: number) => {
    showToast({ type: 'success', title, message, duration })
  }

  const showError = (title: string, message?: string, duration?: number) => {
    showToast({ type: 'error', title, message, duration })
  }

  const showWarning = (title: string, message?: string, duration?: number) => {
    showToast({ type: 'warning', title, message, duration })
  }

  const showInfo = (title: string, message?: string, duration?: number) => {
    showToast({ type: 'info', title, message, duration })
  }

  const clearAll = () => {
    setToasts([])
  }

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        removeToast,
        clearAll
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Standalone toast function for use outside React components
let globalShowToast: ((toast: Omit<ToastProps, 'id'>) => void) | null = null

export const registerToastHandler = (handler: (toast: Omit<ToastProps, 'id'>) => void) => {
  globalShowToast = handler
}

export const toast = {
  success: (title: string, message?: string, duration?: number) => {
    globalShowToast?.({ type: 'success', title, message, duration })
  },
  error: (title: string, message?: string, duration?: number) => {
    globalShowToast?.({ type: 'error', title, message, duration })
  },
  warning: (title: string, message?: string, duration?: number) => {
    globalShowToast?.({ type: 'warning', title, message, duration })
  },
  info: (title: string, message?: string, duration?: number) => {
    globalShowToast?.({ type: 'info', title, message, duration })
  }
}

// Loading Toast Component
interface LoadingToastProps {
  message?: string
}

export const LoadingToast: React.FC<LoadingToastProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-lg border">
      <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
      <span className="text-sm text-gray-700">{message}</span>
    </div>
  )
}

// Promise Toast
interface PromiseToastOptions {
  loading: string
  success: string
  error: string
}

export const promiseToast = async <T,>(
  promise: Promise<T>,
  options: PromiseToastOptions
): Promise<T> => {
  
  // Show loading toast
  globalShowToast?.({
    type: 'info',
    title: options.loading,
    duration: 0
  })

  try {
    const result = await promise
    globalShowToast?.({
      type: 'success',
      title: options.success,
      duration: 3000
    })
    return result
  } catch (error) {
    globalShowToast?.({
      type: 'error',
      title: options.error,
      duration: 5000
    })
    throw error
  }
}

export default ToastNotification
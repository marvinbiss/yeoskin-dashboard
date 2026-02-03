/**
 * Premium Toast Notification Component
 * Stripe/Nike level notifications
 */

import React, { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastProps extends Toast {
  onClose: (id: string) => void
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5" />,
  error: <AlertCircle className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
}

const styles: Record<ToastType, { bg: string; icon: string; border: string }> = {
  success: {
    bg: 'bg-mint-50',
    icon: 'text-mint-600',
    border: 'border-mint-200',
  },
  error: {
    bg: 'bg-error-50',
    icon: 'text-error-600',
    border: 'border-error-200',
  },
  warning: {
    bg: 'bg-warning-50',
    icon: 'text-warning-600',
    border: 'border-warning-200',
  },
  info: {
    bg: 'bg-brand-50',
    icon: 'text-brand-600',
    border: 'border-brand-200',
  },
}

function ToastItem({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Entrance animation
    requestAnimationFrame(() => setIsVisible(true))

    // Auto dismiss
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => onClose(id), 200)
  }

  const style = styles[type]

  return (
    <div
      className={clsx(
        'flex items-start gap-3 p-4 rounded-xl border shadow-soft-lg',
        'transition-all duration-200 ease-smooth',
        style.bg,
        style.border,
        isVisible && !isLeaving
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 translate-x-4'
      )}
      role="alert"
    >
      <span className={clsx('shrink-0 mt-0.5', style.icon)}>
        {icons[type]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-neutral-900">{title}</p>
        {message && (
          <p className="mt-1 text-sm text-neutral-600">{message}</p>
        )}
      </div>
      <button
        onClick={handleClose}
        className="shrink-0 p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-white/50 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onClose: (id: string) => void
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export function ToastContainer({
  toasts,
  onClose,
  position = 'top-right',
}: ToastContainerProps) {
  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  }

  return (
    <div
      className={clsx(
        'fixed z-50 flex flex-col gap-3 w-full max-w-sm',
        positionStyles[position]
      )}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  )
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { ...toast, id }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const toast = {
    success: (title: string, message?: string) =>
      addToast({ type: 'success', title, message }),
    error: (title: string, message?: string) =>
      addToast({ type: 'error', title, message }),
    warning: (title: string, message?: string) =>
      addToast({ type: 'warning', title, message }),
    info: (title: string, message?: string) =>
      addToast({ type: 'info', title, message }),
  }

  return { toasts, toast, removeToast }
}

export default ToastContainer

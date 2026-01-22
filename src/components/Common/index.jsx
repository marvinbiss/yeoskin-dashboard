'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import clsx from 'clsx'

// ============================================================================
// BUTTON COMPONENT
// ============================================================================

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className,
  ...props
}) => {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
    danger: 'btn-danger',
    ghost: 'btn-ghost',
  }

  const sizes = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  }

  return (
    <button
      className={clsx(
        variants[variant],
        sizes[size],
        loading && 'opacity-70 cursor-wait',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {/* Always render a stable container for icons */}
      <span className="inline-flex items-center">
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {!loading && Icon && <Icon className="w-4 h-4 mr-2" />}
        {children}
      </span>
    </button>
  )
}

// ============================================================================
// MODAL COMPONENT
// ============================================================================

export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showClose = true 
}) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className={clsx(
            'relative w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl animate-slide-up',
            sizes[size]
          )}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showClose) && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {title}
                </h3>
              )}
              {showClose && (
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              )}
            </div>
          )}
          
          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// TOAST SYSTEM
// ============================================================================

const ToastContext = createContext(null)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
    
    return id
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const toast = {
    success: (message, duration) => addToast(message, 'success', duration),
    error: (message, duration) => addToast(message, 'error', duration),
    warning: (message, duration) => addToast(message, 'warning', duration),
    info: (message, duration) => addToast(message, 'info', duration),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <Toast key={`toast-${toast.id}`} {...toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

const Toast = ({ message, type, onClose }) => {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }

  const styles = {
    success: 'bg-success-50 border-success-500 text-success-600 dark:bg-success-500/20',
    error: 'bg-danger-50 border-danger-500 text-danger-600 dark:bg-danger-500/20',
    warning: 'bg-warning-50 border-warning-500 text-warning-600 dark:bg-warning-500/20',
    info: 'bg-primary-50 border-primary-500 text-primary-600 dark:bg-primary-500/20',
  }

  const Icon = icons[type]

  return (
    <div 
      className={clsx(
        'flex items-center gap-3 px-4 py-3 rounded-lg border-l-4 shadow-lg animate-slide-up min-w-[300px]',
        styles[type]
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button onClick={onClose} className="p-1 hover:opacity-70">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// ============================================================================
// BADGE COMPONENT
// ============================================================================

export const Badge = ({ children, variant = 'gray', className }) => {
  const variants = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    primary: 'badge-primary',
    gray: 'badge-gray',
  }

  return (
    <span className={clsx(variants[variant], className)}>
      {children}
    </span>
  )
}

// ============================================================================
// STATUS BADGE COMPONENT - FRANÇAIS
// ============================================================================

export const StatusBadge = ({ status }) => {
  const statusConfig = {
    // Batch statuses
    draft: { label: 'Brouillon', variant: 'gray', icon: '📝' },
    approved: { label: 'Approuvé', variant: 'primary', icon: '✅' },
    executing: { label: 'En cours', variant: 'warning', icon: '⏳' },
    sent: { label: 'Envoyé', variant: 'success', icon: '📤' },
    paid: { label: 'Payé', variant: 'success', icon: '💰' },
    
    // Item statuses
    pending: { label: 'En attente', variant: 'gray', icon: '⏳' },
    processing: { label: 'Traitement', variant: 'warning', icon: '🔄' },
    failed: { label: 'Échoué', variant: 'danger', icon: '❌' },
    
    // Commission statuses
    locked: { label: 'Verrouillé', variant: 'primary', icon: '🔒' },
    payable: { label: 'Payable', variant: 'success', icon: '💵' },
    canceled: { label: 'Annulé', variant: 'danger', icon: '🚫' },
    
    // Creator statuses
    active: { label: 'Actif', variant: 'success', icon: '✅' },
    inactive: { label: 'Inactif', variant: 'gray', icon: '⏸️' },
    
    // Transfer statuses
    completed: { label: 'Terminé', variant: 'success', icon: '✅' },
  }

  const config = statusConfig[status] || { label: status, variant: 'gray', icon: '❓' }

  return (
    <Badge variant={config.variant}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </Badge>
  )
}

// ============================================================================
// LOADING SPINNER
// ============================================================================

export const Spinner = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <svg 
      className={clsx('animate-spin text-primary-600', sizes[size], className)} 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4" 
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
      />
    </svg>
  )
}

// ============================================================================
// LOADING OVERLAY
// ============================================================================

export const LoadingOverlay = ({ message = 'Chargement...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Spinner size="lg" />
      <p className="mt-4 text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  )
}

// ============================================================================
// EMPTY STATE
// ============================================================================

export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  actionLabel 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && actionLabel && (
        <Button onClick={action}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

// ============================================================================
// CARD COMPONENT
// ============================================================================

export const Card = ({ children, className, ...props }) => {
  return (
    <div className={clsx('card', className)} {...props}>
      {children}
    </div>
  )
}

const CardHeader = ({ children, className }) => (
  <div className={clsx('card-header', className)}>{children}</div>
)
CardHeader.displayName = 'Card.Header'
Card.Header = CardHeader

const CardBody = ({ children, className }) => (
  <div className={clsx('card-body', className)}>{children}</div>
)
CardBody.displayName = 'Card.Body'
Card.Body = CardBody

// ============================================================================
// CONFIRM DIALOG - FRANÇAIS
// ============================================================================

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  confirmText,
  cancelLabel = 'Annuler',
  variant = 'danger',
  loading = false,
}) => {
  const buttonText = confirmText || confirmLabel || 'Confirmer'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-gray-600 dark:text-gray-300 mb-6">
        {message}
      </div>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={variant} onClick={onConfirm} loading={loading}>
          {buttonText}
        </Button>
      </div>
    </Modal>
  )
}

// Re-export new components
export { AdvancedFilters, CREATOR_FILTERS, BATCH_FILTERS, COMMISSION_FILTERS, ADMIN_FILTERS } from './AdvancedFilters'
export { BulkActions, SelectAllCheckbox, SelectRowCheckbox, CREATOR_BULK_ACTIONS, ADMIN_BULK_ACTIONS, BATCH_BULK_ACTIONS } from './BulkActions'

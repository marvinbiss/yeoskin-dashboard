'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Loader2 } from 'lucide-react'
import clsx from 'clsx'

// ============================================================================
// BUTTON COMPONENT - Brand Consistent
// ============================================================================

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  className,
  ...props
}) => {
  const baseStyles = clsx(
    'inline-flex items-center justify-center font-medium',
    'rounded-xl transition-all duration-200 ease-smooth',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'
  )

  const variants = {
    primary: clsx(
      'bg-brand-500 text-white',
      'hover:bg-brand-600 active:bg-brand-700',
      'focus:ring-brand-500/50',
      'shadow-button hover:shadow-button-hover'
    ),
    secondary: clsx(
      'bg-white text-neutral-700 border border-neutral-200',
      'hover:bg-neutral-50 hover:border-neutral-300 active:bg-neutral-100',
      'focus:ring-neutral-500/30',
      'shadow-soft-sm hover:shadow-soft'
    ),
    success: clsx(
      'bg-mint-500 text-white',
      'hover:bg-mint-600 active:bg-mint-700',
      'focus:ring-mint-500/50',
      'shadow-button hover:shadow-button-hover'
    ),
    danger: clsx(
      'bg-error-500 text-white',
      'hover:bg-error-600 active:bg-error-700',
      'focus:ring-error-500/50',
      'shadow-button hover:shadow-button-hover'
    ),
    warning: clsx(
      'bg-warning-500 text-white',
      'hover:bg-warning-600 active:bg-warning-700',
      'focus:ring-warning-500/50',
      'shadow-button hover:shadow-button-hover'
    ),
    ghost: clsx(
      'text-neutral-600',
      'hover:bg-neutral-100 hover:text-neutral-900',
      'focus:ring-neutral-500/30'
    ),
    outline: clsx(
      'border-2 border-brand-500 text-brand-600 bg-transparent',
      'hover:bg-brand-50 active:bg-brand-100',
      'focus:ring-brand-500/50'
    ),
    link: clsx(
      'text-brand-600 underline-offset-4',
      'hover:underline hover:text-brand-700',
      'focus:ring-brand-500/30'
    ),
  }

  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs gap-1.5',
    sm: 'px-3 py-2 text-sm gap-2',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
    xl: 'px-8 py-4 text-lg gap-3',
  }

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  }

  return (
    <button
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 className={clsx('animate-spin', iconSizes[size])} />
      )}
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className={iconSizes[size]} />
      )}
      {children}
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className={iconSizes[size]} />
      )}
    </button>
  )
}

// ============================================================================
// MODAL COMPONENT - Brand Consistent
// ============================================================================

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showClose = true
}) => {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-full mx-4',
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

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={clsx(
            'relative w-full bg-white rounded-2xl shadow-soft-2xl animate-scale-in',
            'max-h-[90vh] overflow-hidden flex flex-col',
            sizes[size]
          )}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showClose) && (
            <div className="flex items-start justify-between px-6 pt-6 pb-4">
              <div>
                {title && (
                  <h3 className="text-xl font-semibold text-neutral-900">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="mt-1 text-sm text-neutral-500">{description}</p>
                )}
              </div>
              {showClose && (
                <button
                  onClick={onClose}
                  className={clsx(
                    'p-2 -mt-1 -mr-2 rounded-xl',
                    'text-neutral-400 hover:text-neutral-600',
                    'hover:bg-neutral-100 transition-colors'
                  )}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// TOAST SYSTEM - Brand Consistent
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

  const addToast = (title, message, type = 'info', duration = 5000) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, title, message, type }])

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
    success: (title, message, duration) => addToast(title, message, 'success', duration),
    error: (title, message, duration) => addToast(title, message, 'error', duration),
    warning: (title, message, duration) => addToast(title, message, 'warning', duration),
    info: (title, message, duration) => addToast(title, message, 'info', duration),
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
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 w-full max-w-sm">
      {toasts.map(toast => (
        <ToastItem key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

const ToastItem = ({ id, title, message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true))
  }, [])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(onClose, 200)
  }

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }

  const styles = {
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

  const Icon = icons[type]
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
        <Icon className="w-5 h-5" />
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

// ============================================================================
// BADGE COMPONENT - Brand Consistent
// ============================================================================

export const Badge = ({ children, variant = 'default', size = 'md', dot = false, className }) => {
  const variants = {
    default: 'bg-neutral-100 text-neutral-700',
    brand: 'bg-brand-100 text-brand-700',
    success: 'bg-mint-100 text-mint-700',
    warning: 'bg-warning-100 text-warning-700',
    danger: 'bg-error-100 text-error-700',
    error: 'bg-error-100 text-error-700',
    info: 'bg-lavender-100 text-lavender-700',
    primary: 'bg-brand-100 text-brand-700',
    gray: 'bg-neutral-100 text-neutral-700',
  }

  const dotColors = {
    default: 'bg-neutral-500',
    brand: 'bg-brand-500',
    success: 'bg-mint-500',
    warning: 'bg-warning-500',
    danger: 'bg-error-500',
    error: 'bg-error-500',
    info: 'bg-lavender-500',
    primary: 'bg-brand-500',
    gray: 'bg-neutral-500',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-sm',
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full mr-1.5',
            dotColors[variant]
          )}
        />
      )}
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
    draft: { label: 'Brouillon', variant: 'default' },
    approved: { label: 'Approuvé', variant: 'brand' },
    executing: { label: 'En cours', variant: 'warning' },
    sent: { label: 'Envoyé', variant: 'success' },
    paid: { label: 'Payé', variant: 'success' },

    // Item statuses
    pending: { label: 'En attente', variant: 'default' },
    processing: { label: 'Traitement', variant: 'warning' },
    failed: { label: 'Échoué', variant: 'danger' },

    // Commission statuses
    locked: { label: 'Verrouillé', variant: 'brand' },
    payable: { label: 'Payable', variant: 'success' },
    canceled: { label: 'Annulé', variant: 'danger' },

    // Creator statuses
    active: { label: 'Actif', variant: 'success' },
    inactive: { label: 'Inactif', variant: 'default' },

    // Transfer statuses
    completed: { label: 'Terminé', variant: 'success' },
  }

  const config = statusConfig[status] || { label: status, variant: 'default' }

  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  )
}

// ============================================================================
// LOADING SPINNER - Brand Consistent
// ============================================================================

export const Spinner = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  }

  return (
    <Loader2
      className={clsx(
        'animate-spin text-brand-500',
        sizes[size],
        className
      )}
    />
  )
}

// ============================================================================
// LOADING OVERLAY - Brand Consistent
// ============================================================================

export const LoadingOverlay = ({ message = 'Chargement...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Spinner size="xl" />
      <p className="mt-4 text-neutral-500 font-medium">{message}</p>
    </div>
  )
}

// ============================================================================
// EMPTY STATE - Brand Consistent
// ============================================================================

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  actionLabel
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-neutral-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-neutral-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-neutral-500 max-w-sm mb-6">
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
// CARD COMPONENT - Brand Consistent
// ============================================================================

export const Card = ({ children, className, hover = false, ...props }) => {
  return (
    <div
      className={clsx(
        'bg-white rounded-2xl border border-neutral-100',
        'shadow-soft-sm',
        hover && 'hover:shadow-soft-md hover:border-neutral-200 transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

const CardHeader = ({ children, className }) => (
  <div className={clsx('px-6 py-4 border-b border-neutral-100', className)}>
    {children}
  </div>
)
CardHeader.displayName = 'Card.Header'
Card.Header = CardHeader

const CardBody = ({ children, className }) => (
  <div className={clsx('p-6', className)}>{children}</div>
)
CardBody.displayName = 'Card.Body'
Card.Body = CardBody

const CardFooter = ({ children, className }) => (
  <div className={clsx('px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 rounded-b-2xl', className)}>
    {children}
  </div>
)
CardFooter.displayName = 'Card.Footer'
Card.Footer = CardFooter

// ============================================================================
// CONFIRM DIALOG - Brand Consistent
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
      <div className="text-neutral-600 mb-6">
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

// ============================================================================
// INPUT COMPONENT - Brand Consistent
// ============================================================================

export const Input = ({
  label,
  error,
  hint,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  size = 'md',
  className,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

  const sizes = {
    sm: 'py-2 text-sm',
    md: 'py-3 text-base',
    lg: 'py-4 text-lg',
  }

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-neutral-700 mb-2"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {LeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
            <LeftIcon className="w-5 h-5" />
          </div>
        )}
        <input
          id={inputId}
          className={clsx(
            'w-full rounded-xl border bg-white',
            'placeholder:text-neutral-400',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            sizes[size],
            LeftIcon ? 'pl-11' : 'pl-4',
            RightIcon ? 'pr-11' : 'pr-4',
            error
              ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20'
              : 'border-neutral-200 focus:border-brand-500 focus:ring-brand-500/20',
            props.disabled && 'bg-neutral-50 text-neutral-500 cursor-not-allowed',
            className
          )}
          {...props}
        />
        {RightIcon && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-neutral-400">
            <RightIcon className="w-5 h-5" />
          </div>
        )}
      </div>
      {(error || hint) && (
        <p
          className={clsx(
            'mt-2 text-sm',
            error ? 'text-error-600' : 'text-neutral-500'
          )}
        >
          {error || hint}
        </p>
      )}
    </div>
  )
}

// ============================================================================
// SELECT COMPONENT - Brand Consistent
// ============================================================================

export const Select = ({
  label,
  error,
  hint,
  options = [],
  placeholder = 'Sélectionner...',
  className,
  id,
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-neutral-700 mb-2"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={clsx(
          'w-full py-3 px-4 rounded-xl border bg-white',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          error
            ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20'
            : 'border-neutral-200 focus:border-brand-500 focus:ring-brand-500/20',
          props.disabled && 'bg-neutral-50 text-neutral-500 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {(error || hint) && (
        <p
          className={clsx(
            'mt-2 text-sm',
            error ? 'text-error-600' : 'text-neutral-500'
          )}
        >
          {error || hint}
        </p>
      )}
    </div>
  )
}

// ============================================================================
// AVATAR COMPONENT - Brand Consistent
// ============================================================================

export const Avatar = ({ src, name, size = 'md', status, className }) => {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  }

  const statusSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
  }

  const statusColors = {
    online: 'bg-mint-500',
    offline: 'bg-neutral-400',
    away: 'bg-warning-500',
    busy: 'bg-error-500',
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  const getColor = (name) => {
    const colors = [
      'bg-brand-500',
      'bg-lavender-500',
      'bg-mint-500',
      'bg-peach-500',
      'bg-amber-500',
      'bg-cyan-500',
    ]
    let hash = 0
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  return (
    <div className={clsx('relative inline-flex shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className={clsx(
            'rounded-full object-cover ring-2 ring-white',
            sizes[size]
          )}
        />
      ) : (
        <div
          className={clsx(
            'rounded-full flex items-center justify-center text-white font-medium ring-2 ring-white',
            sizes[size],
            getColor(name)
          )}
        >
          {getInitials(name)}
        </div>
      )}
      {status && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 rounded-full border-2 border-white',
            statusSizes[size],
            statusColors[status]
          )}
        />
      )}
    </div>
  )
}

// Re-export additional components
export { AdvancedFilters, CREATOR_FILTERS, BATCH_FILTERS, COMMISSION_FILTERS, ADMIN_FILTERS } from './AdvancedFilters'
export { BulkActions, SelectAllCheckbox, SelectRowCheckbox, CREATOR_BULK_ACTIONS, ADMIN_BULK_ACTIONS, BATCH_BULK_ACTIONS } from './BulkActions'
export {
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  SkeletonCard,
  SkeletonKPICard,
  SkeletonTableRow,
  SkeletonTable,
  SkeletonDashboardStats,
  SkeletonChart,
  SkeletonActivityFeed,
  SkeletonCreatorCard,
  SkeletonList,
  SkeletonModal,
  SkeletonBatchCard,
  SkeletonPage,
} from './Skeleton'
export { RefreshIndicator, RefreshingCard, PageRefreshIndicator } from './RefreshIndicator'

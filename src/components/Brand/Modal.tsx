/**
 * Premium Modal Component
 * Stripe/Nike level overlay dialogs
 */

import React, { useEffect, useRef } from 'react'
import { clsx } from 'clsx'
import { X } from 'lucide-react'
import { Button } from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showClose?: boolean
  closeOnOverlay?: boolean
  className?: string
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showClose = true,
  closeOnOverlay = true,
  className,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Focus trap
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlay && e.target === overlayRef.current) {
      onClose()
    }
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'bg-neutral-900/60 backdrop-blur-sm',
        'animate-fade-in'
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className={clsx(
          'relative w-full bg-white rounded-2xl shadow-soft-2xl',
          'animate-scale-in',
          'max-h-[90vh] overflow-hidden flex flex-col',
          sizeStyles[size],
          className
        )}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-start justify-between px-6 pt-6 pb-4">
            <div>
              {title && (
                <h2
                  id="modal-title"
                  className="text-xl font-semibold text-neutral-900"
                >
                  {title}
                </h2>
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
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">{children}</div>
      </div>
    </div>
  )
}

// Modal with footer actions
interface ModalWithActionsProps extends Omit<ModalProps, 'children'> {
  children: React.ReactNode
  primaryAction?: {
    label: string
    onClick: () => void
    loading?: boolean
    variant?: 'primary' | 'danger'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

export function ModalWithActions({
  children,
  primaryAction,
  secondaryAction,
  ...props
}: ModalWithActionsProps) {
  return (
    <Modal {...props}>
      <div className="mb-6">{children}</div>
      {(primaryAction || secondaryAction) && (
        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          {primaryAction && (
            <Button
              variant={primaryAction.variant === 'danger' ? 'danger' : 'primary'}
              onClick={primaryAction.onClick}
              isLoading={primaryAction.loading}
            >
              {primaryAction.label}
            </Button>
          )}
        </div>
      )}
    </Modal>
  )
}

// Confirmation Modal
interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  loading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading = false,
}: ConfirmModalProps) {
  return (
    <ModalWithActions
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      primaryAction={{
        label: confirmLabel,
        onClick: onConfirm,
        loading,
        variant,
      }}
      secondaryAction={{
        label: cancelLabel,
        onClick: onClose,
      }}
    >
      <p className="text-neutral-600">{message}</p>
    </ModalWithActions>
  )
}

export default Modal

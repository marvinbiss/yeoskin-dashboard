/**
 * Premium Switch/Toggle Component
 * Stripe/Nike level toggle controls
 */

import React from 'react'
import { clsx } from 'clsx'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
}

const sizeStyles = {
  sm: {
    track: 'w-8 h-5',
    thumb: 'w-3.5 h-3.5',
    translate: 'translate-x-3.5',
    label: 'text-sm',
  },
  md: {
    track: 'w-11 h-6',
    thumb: 'w-5 h-5',
    translate: 'translate-x-5',
    label: 'text-base',
  },
  lg: {
    track: 'w-14 h-7',
    thumb: 'w-6 h-6',
    translate: 'translate-x-7',
    label: 'text-lg',
  },
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  size = 'md',
  disabled = false,
  className,
}: SwitchProps) {
  const styles = sizeStyles[size]

  return (
    <label
      className={clsx(
        'inline-flex items-start gap-3',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        className
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={clsx(
          'relative inline-flex shrink-0 rounded-full',
          'transition-colors duration-200 ease-smooth',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2',
          styles.track,
          checked ? 'bg-brand-500' : 'bg-neutral-200'
        )}
      >
        <span
          className={clsx(
            'inline-block rounded-full bg-white shadow-soft-sm',
            'transition-transform duration-200 ease-smooth',
            'translate-x-0.5 mt-0.5',
            styles.thumb,
            checked && styles.translate
          )}
        />
      </button>
      {(label || description) && (
        <div className="flex-1">
          {label && (
            <span
              className={clsx(
                'block font-medium text-neutral-900',
                styles.label
              )}
            >
              {label}
            </span>
          )}
          {description && (
            <span className="block mt-0.5 text-sm text-neutral-500">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  )
}

// Switch Group for multiple toggles
interface SwitchGroupProps {
  children: React.ReactNode
  label?: string
  className?: string
}

export function SwitchGroup({ children, label, className }: SwitchGroupProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          {label}
        </label>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  )
}

export default Switch

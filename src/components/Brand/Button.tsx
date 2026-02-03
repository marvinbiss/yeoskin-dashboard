/**
 * Premium Button Component
 * Stripe/Nike level design system
 */

import React from 'react'
import { clsx } from 'clsx'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  children: React.ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: clsx(
    'bg-brand-500 text-white',
    'hover:bg-brand-600 active:bg-brand-700',
    'shadow-button hover:shadow-button-hover',
    'focus:ring-brand-500/30'
  ),
  secondary: clsx(
    'bg-white text-neutral-900',
    'border border-neutral-200',
    'hover:bg-neutral-50 hover:border-neutral-300',
    'shadow-soft-sm hover:shadow-soft',
    'focus:ring-neutral-500/20'
  ),
  outline: clsx(
    'bg-transparent text-brand-600',
    'border-2 border-brand-500',
    'hover:bg-brand-50 hover:border-brand-600',
    'focus:ring-brand-500/20'
  ),
  ghost: clsx(
    'bg-transparent text-brand-600',
    'hover:bg-brand-50 hover:text-brand-700',
    'focus:ring-brand-500/20'
  ),
  danger: clsx(
    'bg-error-500 text-white',
    'hover:bg-error-600 active:bg-error-700',
    'shadow-button hover:shadow-button-hover',
    'focus:ring-error-500/30'
  ),
  success: clsx(
    'bg-mint-500 text-white',
    'hover:bg-mint-600 active:bg-mint-700',
    'shadow-button hover:shadow-button-hover',
    'focus:ring-mint-500/30'
  ),
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-xl gap-2',
  xl: 'px-8 py-4 text-lg rounded-2xl gap-3',
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        // Base styles
        'inline-flex items-center justify-center',
        'font-medium',
        'transition-all duration-200 ease-smooth',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        // Variant
        variantStyles[variant],
        // Size
        sizeStyles[size],
        // Full width
        fullWidth && 'w-full',
        // Custom
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size={size} />
          <span className="opacity-0">{children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  )
}

function LoadingSpinner({ size }: { size: ButtonSize }) {
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  }

  return (
    <svg
      className={clsx('animate-spin absolute', sizeClasses[size])}
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

export default Button

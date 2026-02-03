/**
 * Premium Input Component
 * Stripe/Nike level design system
 */

import React, { forwardRef } from 'react'
import { clsx } from 'clsx'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  inputSize?: 'sm' | 'md' | 'lg'
}

const sizeStyles = {
  sm: 'py-2 text-sm',
  md: 'py-3 text-base',
  lg: 'py-4 text-lg',
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      inputSize = 'md',
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

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
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'w-full rounded-xl border bg-white',
              'placeholder:text-neutral-400',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              // Size
              sizeStyles[inputSize],
              // Padding
              leftIcon ? 'pl-11' : 'pl-4',
              rightIcon ? 'pr-11' : 'pr-4',
              // State
              error
                ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20'
                : 'border-neutral-200 focus:border-brand-500 focus:ring-brand-500/20',
              // Disabled
              props.disabled && 'bg-neutral-50 text-neutral-500 cursor-not-allowed',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-neutral-400">
              {rightIcon}
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
)

Input.displayName = 'Input'

export default Input

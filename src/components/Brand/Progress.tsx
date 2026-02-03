/**
 * Premium Progress Components
 * Stripe/Nike level progress indicators
 */

import React from 'react'
import { clsx } from 'clsx'

// Linear Progress Bar
interface ProgressBarProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'brand' | 'success' | 'warning' | 'error'
  showLabel?: boolean
  animated?: boolean
  className?: string
}

const barSizeStyles = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
}

const barVariantStyles = {
  default: 'bg-neutral-500',
  brand: 'bg-gradient-to-r from-brand-500 to-brand-400',
  success: 'bg-gradient-to-r from-mint-500 to-mint-400',
  warning: 'bg-gradient-to-r from-warning-500 to-warning-400',
  error: 'bg-gradient-to-r from-error-500 to-error-400',
}

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  variant = 'brand',
  showLabel = false,
  animated = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-neutral-700">Progress</span>
          <span className="text-sm text-neutral-500">{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className={clsx(
          'w-full bg-neutral-100 rounded-full overflow-hidden',
          barSizeStyles[size]
        )}
      >
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-500 ease-out',
            barVariantStyles[variant],
            animated && 'animate-pulse'
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  )
}

// Circular Progress
interface CircularProgressProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  variant?: 'default' | 'brand' | 'success' | 'warning' | 'error'
  showLabel?: boolean
  className?: string
}

const circleVariantStyles = {
  default: 'stroke-neutral-500',
  brand: 'stroke-brand-500',
  success: 'stroke-mint-500',
  warning: 'stroke-warning-500',
  error: 'stroke-error-500',
}

export function CircularProgress({
  value,
  max = 100,
  size = 64,
  strokeWidth = 6,
  variant = 'brand',
  showLabel = true,
  className,
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div
      className={clsx('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-neutral-100"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={clsx(
            'transition-all duration-500 ease-out',
            circleVariantStyles[variant]
          )}
        />
      </svg>
      {showLabel && (
        <span className="absolute text-sm font-semibold text-neutral-700">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  )
}

// Steps Progress
interface Step {
  title: string
  description?: string
}

interface StepsProgressProps {
  steps: Step[]
  currentStep: number
  variant?: 'default' | 'brand'
  className?: string
}

export function StepsProgress({
  steps,
  currentStep,
  variant = 'brand',
  className,
}: StepsProgressProps) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isComplete = index < currentStep
          const isCurrent = index === currentStep
          const isLast = index === steps.length - 1

          return (
            <React.Fragment key={index}>
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={clsx(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    'font-semibold text-sm transition-all duration-300',
                    isComplete && 'bg-brand-500 text-white',
                    isCurrent &&
                      'bg-brand-100 text-brand-600 ring-4 ring-brand-100',
                    !isComplete && !isCurrent && 'bg-neutral-100 text-neutral-400'
                  )}
                >
                  {isComplete ? (
                    <svg className="w-5 h-5\" viewBox="0 0 20 20\" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="mt-3 text-center">
                  <p
                    className={clsx(
                      'text-sm font-medium',
                      isCurrent ? 'text-brand-600' : 'text-neutral-900'
                    )}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={clsx(
                    'flex-1 h-0.5 mx-4 -mt-8',
                    isComplete ? 'bg-brand-500' : 'bg-neutral-200'
                  )}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

export default ProgressBar

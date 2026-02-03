/**
 * Premium Dropdown Component
 * Stripe/Nike level dropdown menus
 */

import React, { useState, useRef, useEffect } from 'react'
import { clsx } from 'clsx'
import { ChevronDown, Check } from 'lucide-react'

interface DropdownOption {
  value: string
  label: string
  icon?: React.ReactNode
  description?: string
  disabled?: boolean
}

interface DropdownProps {
  options: DropdownOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeStyles = {
  sm: 'py-2 text-sm',
  md: 'py-3 text-base',
  lg: 'py-4 text-lg',
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  error,
  disabled = false,
  className,
  size = 'md',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (isOpen && highlightedIndex >= 0) {
          const option = options[highlightedIndex]
          if (!option.disabled) {
            onChange(option.value)
            setIsOpen(false)
          }
        } else {
          setIsOpen(true)
        }
        break
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setHighlightedIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : prev
          )
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (isOpen) {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev))
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  return (
    <div className={clsx('w-full', className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={clsx(
            'w-full flex items-center justify-between gap-2 px-4 rounded-xl border bg-white text-left',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            sizeStyles[size],
            error
              ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20'
              : 'border-neutral-200 focus:border-brand-500 focus:ring-brand-500/20',
            disabled && 'bg-neutral-50 text-neutral-500 cursor-not-allowed',
            !disabled && 'hover:border-neutral-300'
          )}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className={clsx(!selectedOption && 'text-neutral-400')}>
            {selectedOption ? (
              <span className="flex items-center gap-2">
                {selectedOption.icon}
                {selectedOption.label}
              </span>
            ) : (
              placeholder
            )}
          </span>
          <ChevronDown
            className={clsx(
              'w-5 h-5 text-neutral-400 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        {isOpen && (
          <ul
            ref={listRef}
            className={clsx(
              'absolute z-50 w-full mt-2 py-2 bg-white rounded-xl border border-neutral-100',
              'shadow-soft-xl max-h-64 overflow-auto',
              'animate-fade-in'
            )}
            role="listbox"
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                onClick={() => {
                  if (!option.disabled) {
                    onChange(option.value)
                    setIsOpen(false)
                  }
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={clsx(
                  'px-4 py-2.5 cursor-pointer flex items-center justify-between gap-2',
                  'transition-colors duration-100',
                  option.disabled
                    ? 'text-neutral-400 cursor-not-allowed'
                    : highlightedIndex === index
                    ? 'bg-neutral-50'
                    : 'hover:bg-neutral-50',
                  option.value === value && 'text-brand-600 font-medium'
                )}
                role="option"
                aria-selected={option.value === value}
                aria-disabled={option.disabled}
              >
                <div className="flex items-center gap-3">
                  {option.icon && (
                    <span className="text-neutral-400">{option.icon}</span>
                  )}
                  <div>
                    <div>{option.label}</div>
                    {option.description && (
                      <div className="text-sm text-neutral-500">
                        {option.description}
                      </div>
                    )}
                  </div>
                </div>
                {option.value === value && (
                  <Check className="w-4 h-4 text-brand-600 shrink-0" />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-error-600">{error}</p>}
    </div>
  )
}

export default Dropdown

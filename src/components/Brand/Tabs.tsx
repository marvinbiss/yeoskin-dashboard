/**
 * Premium Tabs Component
 * Stripe/Nike level tab navigation
 */

import React, { createContext, useContext, useState } from 'react'
import { clsx } from 'clsx'

interface TabsContextValue {
  activeTab: string
  setActiveTab: (value: string) => void
  variant: 'default' | 'pills' | 'underline'
}

const TabsContext = createContext<TabsContextValue | null>(null)

interface TabsProps {
  defaultValue: string
  value?: string
  onChange?: (value: string) => void
  variant?: 'default' | 'pills' | 'underline'
  children: React.ReactNode
  className?: string
}

export function Tabs({
  defaultValue,
  value,
  onChange,
  variant = 'default',
  children,
  className,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const activeTab = value !== undefined ? value : internalValue

  const setActiveTab = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue)
    }
    onChange?.(newValue)
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, variant }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

interface TabListProps {
  children: React.ReactNode
  className?: string
}

export function TabList({ children, className }: TabListProps) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabList must be used within Tabs')

  const variantStyles = {
    default: 'border-b border-neutral-200',
    pills: 'bg-neutral-100 p-1 rounded-xl',
    underline: '',
  }

  return (
    <div
      className={clsx('flex gap-1', variantStyles[context.variant], className)}
      role="tablist"
    >
      {children}
    </div>
  )
}

interface TabProps {
  value: string
  children: React.ReactNode
  icon?: React.ReactNode
  count?: number
  disabled?: boolean
  className?: string
}

export function Tab({
  value,
  children,
  icon,
  count,
  disabled,
  className,
}: TabProps) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('Tab must be used within Tabs')

  const isActive = context.activeTab === value

  const baseStyles = clsx(
    'flex items-center gap-2 px-4 py-2.5 font-medium text-sm',
    'transition-all duration-200',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
    disabled && 'opacity-50 cursor-not-allowed'
  )

  const variantStyles = {
    default: clsx(
      '-mb-px border-b-2',
      isActive
        ? 'border-brand-500 text-brand-600'
        : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
    ),
    pills: clsx(
      'rounded-lg',
      isActive
        ? 'bg-white text-neutral-900 shadow-soft-sm'
        : 'text-neutral-500 hover:text-neutral-700'
    ),
    underline: clsx(
      'relative',
      isActive ? 'text-brand-600' : 'text-neutral-500 hover:text-neutral-700',
      isActive &&
        'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-500 after:rounded-full'
    ),
  }

  return (
    <button
      role="tab"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={() => !disabled && context.setActiveTab(value)}
      className={clsx(
        baseStyles,
        variantStyles[context.variant],
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {count !== undefined && (
        <span
          className={clsx(
            'inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-medium rounded-full',
            isActive
              ? 'bg-brand-100 text-brand-700'
              : 'bg-neutral-200 text-neutral-600'
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}

interface TabPanelProps {
  value: string
  children: React.ReactNode
  className?: string
}

export function TabPanel({ value, children, className }: TabPanelProps) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabPanel must be used within Tabs')

  if (context.activeTab !== value) return null

  return (
    <div
      role="tabpanel"
      className={clsx('animate-fade-in', className)}
    >
      {children}
    </div>
  )
}

export default Tabs

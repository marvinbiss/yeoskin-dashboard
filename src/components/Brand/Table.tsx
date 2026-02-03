/**
 * Premium Table Component
 * Stripe/Nike level data tables
 */

import React from 'react'
import { clsx } from 'clsx'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

// Table Context
interface TableContextValue {
  variant: 'default' | 'striped' | 'bordered'
  size: 'sm' | 'md' | 'lg'
}

const TableContext = React.createContext<TableContextValue>({
  variant: 'default',
  size: 'md',
})

// Main Table Component
interface TableProps {
  children: React.ReactNode
  variant?: 'default' | 'striped' | 'bordered'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Table({
  children,
  variant = 'default',
  size = 'md',
  className,
}: TableProps) {
  return (
    <TableContext.Provider value={{ variant, size }}>
      <div
        className={clsx(
          'w-full bg-white rounded-2xl border border-neutral-100 overflow-hidden',
          'shadow-soft-sm',
          className
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full">{children}</table>
        </div>
      </div>
    </TableContext.Provider>
  )
}

// Table Head
interface TableHeadProps {
  children: React.ReactNode
  className?: string
}

export function TableHead({ children, className }: TableHeadProps) {
  return (
    <thead
      className={clsx('bg-neutral-50 border-b border-neutral-100', className)}
    >
      {children}
    </thead>
  )
}

// Table Body
interface TableBodyProps {
  children: React.ReactNode
  className?: string
}

export function TableBody({ children, className }: TableBodyProps) {
  const { variant } = React.useContext(TableContext)

  return (
    <tbody
      className={clsx(
        variant === 'striped' && '[&>tr:nth-child(even)]:bg-neutral-50/50',
        className
      )}
    >
      {children}
    </tbody>
  )
}

// Table Row
interface TableRowProps {
  children: React.ReactNode
  onClick?: () => void
  selected?: boolean
  className?: string
}

export function TableRow({
  children,
  onClick,
  selected,
  className,
}: TableRowProps) {
  const { variant } = React.useContext(TableContext)

  return (
    <tr
      onClick={onClick}
      className={clsx(
        'transition-colors',
        variant === 'bordered' && 'border-b border-neutral-100 last:border-0',
        variant !== 'bordered' && 'border-b border-neutral-50 last:border-0',
        onClick && 'cursor-pointer hover:bg-brand-50/50',
        selected && 'bg-brand-50',
        className
      )}
    >
      {children}
    </tr>
  )
}

// Table Header Cell
interface TableHeaderCellProps {
  children?: React.ReactNode
  sortable?: boolean
  sorted?: 'asc' | 'desc' | false
  onSort?: () => void
  align?: 'left' | 'center' | 'right'
  width?: string | number
  className?: string
}

export function TableHeaderCell({
  children,
  sortable,
  sorted,
  onSort,
  align = 'left',
  width,
  className,
}: TableHeaderCellProps) {
  const { size } = React.useContext(TableContext)

  const paddingStyles = {
    sm: 'px-4 py-2',
    md: 'px-6 py-3',
    lg: 'px-6 py-4',
  }

  const alignStyles = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }

  return (
    <th
      style={{ width }}
      className={clsx(
        'font-semibold text-sm text-neutral-600 uppercase tracking-wider',
        paddingStyles[size],
        alignStyles[align],
        sortable && 'cursor-pointer select-none hover:text-neutral-900',
        className
      )}
      onClick={sortable ? onSort : undefined}
    >
      <div
        className={clsx(
          'flex items-center gap-1',
          align === 'center' && 'justify-center',
          align === 'right' && 'justify-end'
        )}
      >
        <span>{children}</span>
        {sortable && (
          <span className="text-neutral-400">
            {sorted === 'asc' ? (
              <ChevronUp className="w-4 h-4" />
            ) : sorted === 'desc' ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronsUpDown className="w-4 h-4" />
            )}
          </span>
        )}
      </div>
    </th>
  )
}

// Table Cell
interface TableCellProps {
  children?: React.ReactNode
  align?: 'left' | 'center' | 'right'
  className?: string
}

export function TableCell({
  children,
  align = 'left',
  className,
}: TableCellProps) {
  const { size } = React.useContext(TableContext)

  const paddingStyles = {
    sm: 'px-4 py-2',
    md: 'px-6 py-4',
    lg: 'px-6 py-5',
  }

  const alignStyles = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }

  return (
    <td
      className={clsx(
        'text-neutral-700',
        paddingStyles[size],
        alignStyles[align],
        className
      )}
    >
      {children}
    </td>
  )
}

// Empty State
interface TableEmptyProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  colSpan?: number
}

export function TableEmpty({
  icon,
  title,
  description,
  action,
  colSpan = 1,
}: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-16 text-center">
        {icon && (
          <div className="flex justify-center mb-4 text-neutral-300">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-medium text-neutral-900 mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-neutral-500 mb-4">{description}</p>
        )}
        {action}
      </td>
    </tr>
  )
}

// Pagination
interface TablePaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  className?: string
}

export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className,
}: TablePaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div
      className={clsx(
        'flex items-center justify-between px-6 py-4 border-t border-neutral-100',
        className
      )}
    >
      <p className="text-sm text-neutral-500">
        Showing <span className="font-medium">{startItem}</span> to{' '}
        <span className="font-medium">{endItem}</span> of{' '}
        <span className="font-medium">{totalItems}</span> results
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={clsx(
            'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
            currentPage === 1
              ? 'text-neutral-400 cursor-not-allowed'
              : 'text-neutral-700 hover:bg-neutral-100'
          )}
        >
          Previous
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((page) => {
              if (totalPages <= 7) return true
              if (page === 1 || page === totalPages) return true
              if (Math.abs(page - currentPage) <= 1) return true
              return false
            })
            .map((page, i, arr) => {
              const showEllipsis = i > 0 && page - arr[i - 1] > 1
              return (
                <React.Fragment key={page}>
                  {showEllipsis && (
                    <span className="px-2 text-neutral-400">...</span>
                  )}
                  <button
                    onClick={() => onPageChange(page)}
                    className={clsx(
                      'w-8 h-8 text-sm font-medium rounded-lg transition-colors',
                      page === currentPage
                        ? 'bg-brand-500 text-white'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    )}
                  >
                    {page}
                  </button>
                </React.Fragment>
              )
            })}
        </div>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={clsx(
            'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
            currentPage === totalPages
              ? 'text-neutral-400 cursor-not-allowed'
              : 'text-neutral-700 hover:bg-neutral-100'
          )}
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default Table

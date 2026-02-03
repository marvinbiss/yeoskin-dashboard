'use client'

import { ReactNode } from 'react'
import clsx from 'clsx'

/**
 * Skip Link Component
 *
 * Allows keyboard users to skip navigation and go directly to main content.
 * Hidden by default, becomes visible on focus.
 */
interface SkipLinkProps {
  /** ID of the main content element */
  targetId?: string
  /** Custom text for the skip link */
  children?: ReactNode
  /** Additional class names */
  className?: string
}

export function SkipLink({
  targetId = 'main-content',
  children = 'Aller au contenu principal',
  className,
}: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={clsx(
        // Hidden by default
        'sr-only focus:not-sr-only',
        // Visible styling when focused
        'focus:absolute focus:z-[9999] focus:top-4 focus:left-4',
        'focus:px-4 focus:py-2 focus:rounded-lg',
        'focus:bg-brand-500 focus:text-white',
        'focus:outline-none focus:ring-2 focus:ring-brand-300 focus:ring-offset-2',
        'focus:shadow-lg',
        'transition-all duration-200',
        className
      )}
    >
      {children}
    </a>
  )
}

/**
 * Skip Links Group
 *
 * Multiple skip links for complex pages with multiple sections.
 */
interface SkipLinksProps {
  links: Array<{
    targetId: string
    label: string
  }>
}

export function SkipLinks({ links }: SkipLinksProps) {
  return (
    <div className="skip-links">
      {links.map((link) => (
        <SkipLink key={link.targetId} targetId={link.targetId}>
          {link.label}
        </SkipLink>
      ))}
    </div>
  )
}

export default SkipLink

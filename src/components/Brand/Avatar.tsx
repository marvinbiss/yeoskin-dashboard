/**
 * Premium Avatar Component
 * Stripe/Nike level user avatars
 */

import React from 'react'
import { clsx } from 'clsx'
import { User } from 'lucide-react'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
type AvatarStatus = 'online' | 'offline' | 'away' | 'busy'

interface AvatarProps {
  src?: string | null
  alt?: string
  name?: string
  size?: AvatarSize
  status?: AvatarStatus
  className?: string
}

const sizeStyles: Record<AvatarSize, { container: string; text: string; icon: string; status: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-[10px]', icon: 'w-3 h-3', status: 'w-2 h-2 border' },
  sm: { container: 'w-8 h-8', text: 'text-xs', icon: 'w-4 h-4', status: 'w-2.5 h-2.5 border-2' },
  md: { container: 'w-10 h-10', text: 'text-sm', icon: 'w-5 h-5', status: 'w-3 h-3 border-2' },
  lg: { container: 'w-12 h-12', text: 'text-base', icon: 'w-6 h-6', status: 'w-3.5 h-3.5 border-2' },
  xl: { container: 'w-16 h-16', text: 'text-lg', icon: 'w-8 h-8', status: 'w-4 h-4 border-2' },
  '2xl': { container: 'w-24 h-24', text: 'text-2xl', icon: 'w-12 h-12', status: 'w-5 h-5 border-2' },
}

const statusColors: Record<AvatarStatus, string> = {
  online: 'bg-mint-500',
  offline: 'bg-neutral-400',
  away: 'bg-warning-500',
  busy: 'bg-error-500',
}

// Generate consistent color from name
function getInitialColor(name: string): string {
  const colors = [
    'bg-brand-500',
    'bg-lavender-500',
    'bg-mint-500',
    'bg-rose-500',
    'bg-amber-500',
    'bg-cyan-500',
    'bg-violet-500',
    'bg-emerald-500',
  ]

  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}

// Get initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  status,
  className,
}: AvatarProps) {
  const styles = sizeStyles[size]
  const initials = name ? getInitials(name) : ''
  const bgColor = name ? getInitialColor(name) : 'bg-neutral-200'

  return (
    <div className={clsx('relative inline-flex shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className={clsx(
            'rounded-full object-cover',
            'ring-2 ring-white',
            styles.container
          )}
        />
      ) : initials ? (
        <div
          className={clsx(
            'rounded-full flex items-center justify-center',
            'text-white font-medium',
            'ring-2 ring-white',
            bgColor,
            styles.container,
            styles.text
          )}
        >
          {initials}
        </div>
      ) : (
        <div
          className={clsx(
            'rounded-full flex items-center justify-center',
            'bg-neutral-100 text-neutral-400',
            'ring-2 ring-white',
            styles.container
          )}
        >
          <User className={styles.icon} />
        </div>
      )}

      {status && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 rounded-full border-white',
            statusColors[status],
            styles.status
          )}
        />
      )}
    </div>
  )
}

// Avatar Group
interface AvatarGroupProps {
  avatars: Array<{ src?: string; name?: string }>
  max?: number
  size?: AvatarSize
  className?: string
}

export function AvatarGroup({
  avatars,
  max = 4,
  size = 'md',
  className,
}: AvatarGroupProps) {
  const visible = avatars.slice(0, max)
  const remaining = avatars.length - max

  const overlapStyles: Record<AvatarSize, string> = {
    xs: '-ml-1.5',
    sm: '-ml-2',
    md: '-ml-2.5',
    lg: '-ml-3',
    xl: '-ml-4',
    '2xl': '-ml-6',
  }

  return (
    <div className={clsx('flex items-center', className)}>
      {visible.map((avatar, i) => (
        <div
          key={i}
          className={clsx(i > 0 && overlapStyles[size])}
        >
          <Avatar src={avatar.src} name={avatar.name} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={clsx(
            overlapStyles[size],
            'rounded-full flex items-center justify-center',
            'bg-neutral-100 text-neutral-600 font-medium',
            'ring-2 ring-white',
            sizeStyles[size].container,
            sizeStyles[size].text
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  )
}

export default Avatar

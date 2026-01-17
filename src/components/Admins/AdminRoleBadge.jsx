import { Shield, UserCog, Eye } from 'lucide-react'
import clsx from 'clsx'
import { ADMIN_ROLES, ROLE_LABELS } from '../../lib/adminValidation'

/**
 * Badge component for displaying admin roles
 * @param {object} props
 * @param {string} props.role - Admin role (super_admin, admin, viewer)
 * @param {string} [props.size] - Badge size (sm, md, lg)
 * @param {boolean} [props.showIcon] - Whether to show icon
 */
export const AdminRoleBadge = ({ role, size = 'md', showIcon = true }) => {
  const config = {
    [ADMIN_ROLES.SUPER_ADMIN]: {
      icon: Shield,
      label: ROLE_LABELS[ADMIN_ROLES.SUPER_ADMIN],
      className: 'bg-danger-50 text-danger-700 dark:bg-danger-500/20 dark:text-danger-400',
    },
    [ADMIN_ROLES.ADMIN]: {
      icon: UserCog,
      label: ROLE_LABELS[ADMIN_ROLES.ADMIN],
      className: 'bg-primary-50 text-primary-700 dark:bg-primary-500/20 dark:text-primary-400',
    },
    [ADMIN_ROLES.VIEWER]: {
      icon: Eye,
      label: ROLE_LABELS[ADMIN_ROLES.VIEWER],
      className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    },
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  const roleConfig = config[role] || config[ADMIN_ROLES.VIEWER]
  const Icon = roleConfig.icon

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        roleConfig.className,
        sizeClasses[size]
      )}
      role="status"
      aria-label={`Rôle: ${roleConfig.label}`}
    >
      {showIcon && <Icon className={iconSizes[size]} aria-hidden="true" />}
      <span>{roleConfig.label}</span>
    </span>
  )
}

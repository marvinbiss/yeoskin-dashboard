import { Users, Shield, UserCog, Eye, UserPlus } from 'lucide-react'
import { Card } from '../Common'

/**
 * Statistics header for admins page
 * @param {object} props
 * @param {object} props.stats - Statistics object from useAdmins().getStats()
 * @param {boolean} [props.loading] - Loading state
 */
export const AdminsStatsHeader = ({ stats, loading }) => {
  const items = [
    {
      label: 'Total',
      value: stats?.total || 0,
      icon: Users,
      color: 'primary',
    },
    {
      label: 'Super Admins',
      value: stats?.superAdmins || 0,
      icon: Shield,
      color: 'danger',
    },
    {
      label: 'Admins',
      value: stats?.admins || 0,
      icon: UserCog,
      color: 'primary',
    },
    {
      label: 'Lecteurs',
      value: stats?.viewers || 0,
      icon: Eye,
      color: 'gray',
    },
    {
      label: 'Créés aujourd\'hui',
      value: stats?.createdToday || 0,
      icon: UserPlus,
      color: 'success',
    },
  ]

  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400',
    danger: 'bg-danger-50 text-danger-600 dark:bg-danger-500/20 dark:text-danger-400',
    success: 'bg-success-50 text-success-600 dark:bg-success-500/20 dark:text-success-400',
    gray: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {items.map((item) => (
        <Card key={item.label} className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colorClasses[item.color]}`}>
              <item.icon className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? (
                  <span className="inline-block w-8 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ) : (
                  item.value
                )}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {item.label}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

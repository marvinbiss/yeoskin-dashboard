/**
 * TierCard - Affiche le niveau VIP du createur
 */
import { Award, TrendingUp, Star } from 'lucide-react'
import { useCreatorTier } from '../hooks/useCreatorTier'

// Tier icons (Silver, Gold, Platinum only)
const TierIcons = {
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
}

export const TierCard = ({ creatorId }) => {
  const { current, next, monthlyRevenue, progress, remaining, loading, error } = useCreatorTier(creatorId)

  if (loading) {
    return (
      <div className="rounded-xl p-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse">
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-2"></div>
        <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
      </div>
    )
  }

  if (error || !current) {
    return null // Silent fail if tiers not configured
  }

  // Gradient colors based on tier (Silver, Gold, Platinum only)
  const gradients = {
    silver: 'from-gray-400 to-gray-600',
    gold: 'from-yellow-400 to-amber-500',
    platinum: 'from-purple-400 to-indigo-600',
  }

  const gradient = gradients[current.badge_icon] || gradients.silver
  const icon = TierIcons[current.badge_icon] || '🏆'

  return (
    <div className={`rounded-xl p-6 bg-gradient-to-r ${gradient} text-white shadow-lg`}>
      <div className="flex justify-between items-start">
        {/* Current tier */}
        <div>
          <p className="text-sm opacity-90 mb-1">Mon niveau actuel</p>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <span>{icon}</span>
            <span>{current.name}</span>
          </h2>
          <p className="text-sm mt-2 opacity-90">
            Commission: {(current.commission_rate * 100).toFixed(0)}%
          </p>
        </div>

        {/* Next tier (if exists) */}
        {next && (
          <div className="text-right">
            <p className="text-sm opacity-90 mb-1">Prochain niveau</p>
            <p className="text-xl font-bold">{TierIcons[next.badge_icon]} {next.name}</p>
            <p className="text-sm mt-1 opacity-90">
              Encore {remaining.toFixed(2)}€
            </p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {next && (
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1 opacity-90">
            <span>{monthlyRevenue.toFixed(2)}€ ce mois</span>
            <span>{next.min_monthly_revenue}€</span>
          </div>
          <div className="bg-white bg-opacity-30 rounded-full h-2.5">
            <div
              className="bg-white rounded-full h-2.5 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Benefits */}
      {current.benefits && current.benefits.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white border-opacity-30">
          <p className="text-sm font-medium mb-2 opacity-90">
            Tes avantages {current.name}:
          </p>
          <ul className="text-sm space-y-1 opacity-90">
            {current.benefits.slice(0, 3).map((benefit, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <Star className="w-3 h-3" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default TierCard

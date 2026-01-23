'use client'

import { Eye, ShoppingCart, Package, Edit2, Trash2, ToggleLeft, ToggleRight, Users } from 'lucide-react'
import { Badge } from '../Common'

/**
 * RoutineCard - Affiche une routine dans la grille
 */
export const RoutineCard = ({ routine, onEdit, onDelete, onToggleActive, onManageCreators }) => {

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border ${
      routine.is_active ? 'border-gray-200 dark:border-gray-700' : 'border-dashed border-gray-300 dark:border-gray-600 opacity-75'
    } overflow-hidden hover:shadow-lg transition-shadow`}>
      {/* Image header */}
      {routine.image_url && (
        <div className="h-32 overflow-hidden">
          <img
            src={routine.image_url}
            alt={routine.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-5">
        {/* Title + Badge */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {routine.title}
          </h3>
          <Badge variant={routine.is_active ? 'success' : 'secondary'}>
            {routine.is_active ? 'Actif' : 'Inactif'}
          </Badge>
        </div>

        {/* Objective */}
        <p
          className="text-sm font-medium mb-2"
          style={{ color: routine.objective_color || '#FF69B4' }}
        >
          {routine.objective}
        </p>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
          {routine.description}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <Eye className="w-4 h-4 text-gray-400 mx-auto mb-1" />
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {routine.total_views || 0}
            </p>
            <p className="text-xs text-gray-500">Vues</p>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <ShoppingCart className="w-4 h-4 text-gray-400 mx-auto mb-1" />
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {routine.total_carts || 0}
            </p>
            <p className="text-xs text-gray-500">Paniers</p>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <Package className="w-4 h-4 text-gray-400 mx-auto mb-1" />
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {routine.total_orders || 0}
            </p>
            <p className="text-xs text-gray-500">Commandes</p>
          </div>
        </div>

        {/* Price + Creators */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Prix base: <span className="font-semibold text-gray-900 dark:text-white">{routine.base_price}€</span>
          </span>
          <span className="flex items-center gap-1 text-gray-500">
            <Users className="w-3.5 h-3.5" />
            Créateurs
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(routine)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition text-sm font-medium"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Modifier
          </button>
          <button
            onClick={() => onManageCreators(routine)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition text-sm font-medium"
          >
            <Users className="w-3.5 h-3.5" />
            Créateurs
          </button>
          <button
            onClick={() => onToggleActive(routine)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            title={routine.is_active ? 'Desactiver' : 'Activer'}
          >
            {routine.is_active ? (
              <ToggleRight className="w-5 h-5 text-success-500" />
            ) : (
              <ToggleLeft className="w-5 h-5 text-gray-400" />
            )}
          </button>
          <button
            onClick={() => onDelete(routine)}
            className="p-2 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/20 text-gray-400 hover:text-danger-500 transition"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default RoutineCard

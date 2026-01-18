import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Wallet,
  Users,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  Zap,
  Shield,
  ClipboardList,
  Landmark,
  BarChart3,
  CreditCard,
  ShoppingBag,
  FolderTree,
  ShoppingCart
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../Common'

const navigation = [
  { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Produits', href: '/products', icon: ShoppingBag, adminOnly: true },
  { name: 'Categories', href: '/categories', icon: FolderTree, adminOnly: true },
  { name: 'Commandes', href: '/orders', icon: ShoppingCart, adminOnly: true },
  { name: 'Paiements', href: '/payouts', icon: Wallet },
  { name: 'Exec Paiements', href: '/admin-payouts', icon: CreditCard, adminOnly: true },
  { name: 'Créateurs', href: '/creators', icon: Users },
  { name: 'Commissions', href: '/commissions', icon: FileText },
  { name: 'Finance', href: '/financial', icon: Landmark, adminOnly: true },
]

const secondaryNavigation = [
  { name: 'Paramètres', href: '/settings', icon: Settings },
  { name: 'Aide', href: '/help', icon: HelpCircle },
]

export const Sidebar = ({ collapsed, onToggle }) => {
  const { signOut, getUserDisplayName, getUserEmail, getUserInitials, isSuperAdmin } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const handleLogout = async () => {
    const { error } = await signOut()

    if (error) {
      toast.error('Erreur lors de la déconnexion')
      return
    }

    toast.success('Déconnexion réussie')
    navigate('/login', { replace: true })
  }

  const displayName = getUserDisplayName() || 'Utilisateur'
  const email = getUserEmail() || ''
  const initials = getUserInitials() || 'U'
  const showAdminLink = isSuperAdmin()
  const isAdmin = showAdminLink // For now, same check - could be expanded

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 z-40',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white">Yeoskin</h1>
              <p className="text-xs text-gray-500">Tableau de bord des opérations</p>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft className={clsx(
            'w-5 h-5 text-gray-500 transition-transform',
            collapsed && 'rotate-180'
          )} />
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation
          .filter(item => !item.adminOnly || isAdmin)
          .map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) => clsx(
                'sidebar-link',
                isActive && 'active',
                collapsed && 'justify-center px-3'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          ))}
      </nav>

      {/* Divider */}
      <div className="px-3">
        <div className="border-t border-gray-200 dark:border-gray-800" />
      </div>

      {/* Secondary Navigation */}
      <nav className="px-3 py-4 space-y-1">
        {secondaryNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) => clsx(
              'sidebar-link',
              isActive && 'active',
              collapsed && 'justify-center px-3'
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.name}</span>}
          </NavLink>
        ))}

        {/* Admin Links - Only visible for super_admin */}
        {showAdminLink && (
          <>
            <NavLink
              to="/admins"
              className={({ isActive }) => clsx(
                'sidebar-link',
                isActive && 'active',
                collapsed && 'justify-center px-3'
              )}
            >
              <Shield className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>Administrateurs</span>}
            </NavLink>
            <NavLink
              to="/audit-logs"
              className={({ isActive }) => clsx(
                'sidebar-link',
                isActive && 'active',
                collapsed && 'justify-center px-3'
              )}
            >
              <ClipboardList className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>Audit Logs</span>}
            </NavLink>
          </>
        )}
      </nav>

      {/* User Section */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200 dark:border-gray-800">
        <NavLink
          to="/profile"
          className={({ isActive }) => clsx(
            'flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer',
            isActive
              ? 'bg-primary-50 dark:bg-primary-900/30'
              : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700',
            collapsed && 'justify-center'
          )}
          title="Mon profil"
        >
          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
            <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
              {initials}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {displayName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {email}
              </p>
            </div>
          )}
        </NavLink>
        {/* Bouton logout */}
        <button
          onClick={handleLogout}
          className={clsx(
            'mt-2 w-full p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2',
            collapsed ? 'justify-center' : 'justify-start px-3'
          )}
          title="Se déconnecter"
        >
          <LogOut className="w-4 h-4 text-gray-500" />
          {!collapsed && <span className="text-sm text-gray-600 dark:text-gray-400">Déconnexion</span>}
        </button>
      </div>
    </aside>
  )
}

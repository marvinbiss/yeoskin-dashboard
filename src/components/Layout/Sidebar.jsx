'use client'

import { NavLink, useNavigate } from '@/lib/navigation'
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
  ShoppingCart,
  UserPlus,
  PanelTop,
  Sparkles
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../Common'

const navigation = [
  { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Produits', href: '/products', icon: ShoppingBag, adminOnly: true },
  { name: 'Routines', href: '/routines', icon: Sparkles, adminOnly: true },
  { name: 'Commandes', href: '/orders', icon: ShoppingCart, adminOnly: true },
  { name: 'Paiements', href: '/payouts', icon: Wallet },
  { name: 'Exec Paiements', href: '/admin-payouts', icon: CreditCard, adminOnly: true },
  { name: 'Créateurs', href: '/creators', icon: Users },
  { name: 'Candidatures', href: '/applications', icon: UserPlus, adminOnly: true },
  { name: 'Pages', href: '/pages', icon: PanelTop, adminOnly: true },
  { name: 'Commissions', href: '/commissions', icon: FileText },
  { name: 'Finance', href: '/financial', icon: Landmark, adminOnly: true },
]

const secondaryNavigation = [
  { name: 'Paramètres', href: '/settings', icon: Settings },
  { name: 'Aide', href: '/help', icon: HelpCircle },
]

export const Sidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }) => {
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

  const sidebarContent = (isMobile = false) => (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <img
            src="https://cdn.shopify.com/s/files/1/0870/9573/8716/files/Copie_de_LogoOK_1.png?v=1742078138"
            alt="Yeoskin"
            className={clsx(collapsed && !isMobile ? 'h-8 w-8 object-contain' : 'h-10 w-auto')}
          />
          {(isMobile || !collapsed) && (
            <div>
              <p className="text-xs text-gray-500">Tableau de bord</p>
            </div>
          )}
        </div>
        {!isMobile && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft className={clsx(
              'w-5 h-5 text-gray-500 transition-transform',
              collapsed && 'rotate-180'
            )} />
          </button>
        )}
      </div>
    </>
  )

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={clsx(
          'fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50 transform transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent(true)}

        {/* Mobile Main Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation
            .filter(item => !item.adminOnly || isAdmin)
            .map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => clsx(
                  'sidebar-link',
                  isActive && 'active'
                )}
                onClick={onMobileClose}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            ))}
        </nav>

        <div className="px-3">
          <div className="border-t border-gray-200 dark:border-gray-800" />
        </div>

        <nav className="px-3 py-4 space-y-1">
          {secondaryNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) => clsx(
                'sidebar-link',
                isActive && 'active'
              )}
              onClick={onMobileClose}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
          {showAdminLink && (
            <>
              <NavLink to="/admins" className={({ isActive }) => clsx('sidebar-link', isActive && 'active')} onClick={onMobileClose}>
                <Shield className="w-5 h-5 flex-shrink-0" />
                <span>Administrateurs</span>
              </NavLink>
              <NavLink to="/audit-logs" className={({ isActive }) => clsx('sidebar-link', isActive && 'active')} onClick={onMobileClose}>
                <ClipboardList className="w-5 h-5 flex-shrink-0" />
                <span>Audit Logs</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* Mobile User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200 dark:border-gray-800">
          <NavLink
            to="/profile"
            className={({ isActive }) => clsx(
              'flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer',
              isActive ? 'bg-primary-50 dark:bg-primary-900/30' : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
            onClick={onMobileClose}
          >
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <span className="text-sm font-medium text-primary-600 dark:text-primary-400">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{displayName}</p>
              <p className="text-xs text-gray-500 truncate">{email}</p>
            </div>
          </NavLink>
          <button onClick={handleLogout} className="mt-2 w-full p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 justify-start px-3" title="Se déconnecter">
            <LogOut className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={clsx(
          'hidden lg:block fixed left-0 top-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 z-40',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {sidebarContent(false)}

        {/* Desktop Main Navigation */}
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

        <div className="px-3">
          <div className="border-t border-gray-200 dark:border-gray-800" />
        </div>

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
          {showAdminLink && (
            <>
              <NavLink to="/admins" className={({ isActive }) => clsx('sidebar-link', isActive && 'active', collapsed && 'justify-center px-3')}>
                <Shield className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>Administrateurs</span>}
              </NavLink>
              <NavLink to="/audit-logs" className={({ isActive }) => clsx('sidebar-link', isActive && 'active', collapsed && 'justify-center px-3')}>
                <ClipboardList className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>Audit Logs</span>}
              </NavLink>
            </>
          )}
        </nav>

        {/* Desktop User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200 dark:border-gray-800">
          <NavLink
            to="/profile"
            className={({ isActive }) => clsx(
              'flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer',
              isActive ? 'bg-primary-50 dark:bg-primary-900/30' : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700',
              collapsed && 'justify-center'
            )}
            title="Mon profil"
          >
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <span className="text-sm font-medium text-primary-600 dark:text-primary-400">{initials}</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{displayName}</p>
                <p className="text-xs text-gray-500 truncate">{email}</p>
              </div>
            )}
          </NavLink>
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
    </>
  )
}

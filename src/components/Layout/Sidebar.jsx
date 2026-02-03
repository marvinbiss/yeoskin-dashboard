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
      toast.error('Erreur', 'Erreur lors de la déconnexion')
      return
    }

    toast.success('Déconnexion', 'À bientôt !')
    navigate('/login', { replace: true })
  }

  const displayName = getUserDisplayName() || 'Utilisateur'
  const email = getUserEmail() || ''
  const initials = getUserInitials() || 'U'
  const showAdminLink = isSuperAdmin()
  const isAdmin = showAdminLink

  const NavItem = ({ item, collapsed: isCollapsed, onClick }) => (
    <NavLink
      to={item.href}
      className={({ isActive }) => clsx(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm',
        'transition-all duration-200',
        isActive
          ? 'bg-brand-50 text-brand-600 shadow-soft-sm'
          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
        isCollapsed && 'justify-center px-3'
      )}
      onClick={onClick}
    >
      <item.icon className="w-5 h-5 flex-shrink-0" />
      {!isCollapsed && <span>{item.name}</span>}
    </NavLink>
  )

  const sidebarContent = (isMobile = false) => (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-brand-glow/30">
            <span className="text-white font-bold text-lg">Y</span>
          </div>
          {(isMobile || !collapsed) && (
            <div>
              <p className="font-semibold text-neutral-900">Yeoskin</p>
              <p className="text-xs text-neutral-500">Dashboard</p>
            </div>
          )}
        </div>
        {!isMobile && (
          <button
            onClick={onToggle}
            className={clsx(
              'p-2 rounded-xl transition-all duration-200',
              'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'
            )}
          >
            <ChevronLeft className={clsx(
              'w-5 h-5 transition-transform duration-200',
              collapsed && 'rotate-180'
            )} />
          </button>
        )}
      </div>
    </>
  )

  const UserSection = ({ isCollapsed, isMobile = false }) => (
    <div className={clsx(
      'p-3 border-t border-neutral-100',
      !isMobile && 'absolute bottom-0 left-0 right-0'
    )}>
      <NavLink
        to="/profile"
        className={({ isActive }) => clsx(
          'flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer',
          isActive
            ? 'bg-brand-50 ring-1 ring-brand-200'
            : 'bg-neutral-50 hover:bg-neutral-100',
          isCollapsed && 'justify-center'
        )}
        onClick={isMobile ? onMobileClose : undefined}
      >
        <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center shadow-soft-sm">
          <span className="text-sm font-semibold text-white">{initials}</span>
        </div>
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">{displayName}</p>
            <p className="text-xs text-neutral-500 truncate">{email}</p>
          </div>
        )}
      </NavLink>
      <button
        onClick={handleLogout}
        className={clsx(
          'mt-2 w-full p-2.5 rounded-xl transition-all duration-200 flex items-center gap-2',
          'text-neutral-500 hover:text-error-600 hover:bg-error-50',
          isCollapsed ? 'justify-center' : 'justify-start px-3'
        )}
        title="Se déconnecter"
      >
        <LogOut className="w-4 h-4" />
        {!isCollapsed && <span className="text-sm font-medium">Déconnexion</span>}
      </button>
    </div>
  )

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={clsx(
          'fixed left-0 top-0 h-full w-72 bg-white border-r border-neutral-100 z-50',
          'transform transition-transform duration-300 ease-smooth lg:hidden flex flex-col',
          'shadow-soft-2xl',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent(true)}

        {/* Mobile Main Navigation */}
        <div className="flex-1 overflow-y-auto pb-32">
          <nav className="px-3 py-4 space-y-1">
            {navigation
              .filter(item => !item.adminOnly || isAdmin)
              .map((item) => (
                <NavItem key={item.name} item={item} collapsed={false} onClick={onMobileClose} />
              ))}
          </nav>

          <div className="px-4 my-2">
            <div className="border-t border-neutral-100" />
          </div>

          <nav className="px-3 py-2 space-y-1">
            {secondaryNavigation.map((item) => (
              <NavItem key={item.name} item={item} collapsed={false} onClick={onMobileClose} />
            ))}
            {showAdminLink && (
              <>
                <NavItem item={{ name: 'Administrateurs', href: '/admins', icon: Shield }} collapsed={false} onClick={onMobileClose} />
                <NavItem item={{ name: 'Audit Logs', href: '/audit-logs', icon: ClipboardList }} collapsed={false} onClick={onMobileClose} />
              </>
            )}
          </nav>
        </div>

        {/* Mobile User Section */}
        <UserSection isCollapsed={false} isMobile={true} />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={clsx(
          'hidden lg:flex lg:flex-col fixed left-0 top-0 h-screen bg-white border-r border-neutral-100',
          'transition-all duration-300 ease-smooth z-40',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {sidebarContent(false)}

        {/* Desktop Main Navigation */}
        <div className="flex-1 overflow-y-auto pb-40">
          <nav className="px-3 py-4 space-y-1">
            {navigation
              .filter(item => !item.adminOnly || isAdmin)
              .map((item) => (
                <NavItem key={item.name} item={item} collapsed={collapsed} />
              ))}
          </nav>

          <div className="px-4 my-2">
            <div className="border-t border-neutral-100" />
          </div>

          <nav className="px-3 py-2 space-y-1">
            {secondaryNavigation.map((item) => (
              <NavItem key={item.name} item={item} collapsed={collapsed} />
            ))}
            {showAdminLink && (
              <>
                <NavItem item={{ name: 'Administrateurs', href: '/admins', icon: Shield }} collapsed={collapsed} />
                <NavItem item={{ name: 'Audit Logs', href: '/audit-logs', icon: ClipboardList }} collapsed={collapsed} />
              </>
            )}
          </nav>
        </div>

        {/* Desktop User Section */}
        <UserSection isCollapsed={collapsed} />
      </aside>
    </>
  )
}

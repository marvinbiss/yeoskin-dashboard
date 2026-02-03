'use client'

import { useState } from 'react'
import { Link, useLocation, useNavigate } from '@/lib/navigation'
import {
  LayoutDashboard,
  History,
  LogOut,
  Menu,
  X,
  User,
  ChevronDown,
  Settings,
  CreditCard,
  BarChart3,
  Globe,
  ShoppingBag,
  TrendingUp
} from 'lucide-react'
import clsx from 'clsx'
import { useCreatorAuth } from '../contexts/CreatorAuthContext'
import { NotificationBell } from './NotificationBell'

const navigation = [
  { name: 'Tableau de bord', href: '/c/creator', icon: LayoutDashboard },
  { name: 'Ma Page', href: '/c/creator/my-page', icon: Globe },
  { name: 'Ma Sélection', href: '/c/creator/products', icon: ShoppingBag },
  { name: 'Mes Analytics', href: '/c/creator/analytics', icon: BarChart3 },
  { name: 'Analytics Avancés', href: '/c/creator/analytics-dashboard', icon: TrendingUp },
  { name: 'Historique', href: '/c/creator/history', icon: History },
  { name: 'Mon profil', href: '/c/creator/profile', icon: User },
  { name: 'Coordonnées bancaires', href: '/c/creator/bank', icon: CreditCard },
  { name: 'Paramètres', href: '/c/creator/settings', icon: Settings },
]

export const CreatorLayout = ({ children, title, subtitle }) => {
  const { creator, signOut, user } = useCreatorAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileDropdown, setProfileDropdown] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/c/creator/login'
  }

  const isActive = (href) => {
    if (href === '/c/creator') {
      return location.pathname === '/c/creator'
    }
    return location.pathname.startsWith(href)
  }

  const NavItem = ({ item, onClick }) => {
    const Icon = item.icon
    const active = isActive(item.href)

    return (
      <Link
        to={item.href}
        onClick={onClick}
        className={clsx(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm',
          'transition-all duration-200',
          active
            ? 'bg-brand-50 text-brand-600 shadow-soft-sm'
            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
        )}
      >
        <Icon className="w-5 h-5" />
        {item.name}
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={clsx(
        'fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-neutral-100',
        'transform transition-transform duration-300 ease-smooth lg:hidden',
        'shadow-soft-2xl',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-brand-glow/30">
              <span className="text-white font-bold text-lg">Y</span>
            </div>
            <div>
              <p className="font-semibold text-neutral-900">Yeoskin</p>
              <p className="text-xs text-neutral-500">Portail Créateur</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-xl hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {navigation.map((item) => (
            <NavItem key={item.name} item={item} onClick={() => setSidebarOpen(false)} />
          ))}
        </nav>

        {/* Mobile user info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-100">
          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center shadow-soft-sm">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">
                {creator?.email || user?.email || 'Creator'}
              </p>
              {creator?.discount_code && (
                <p className="text-xs text-neutral-500 truncate">
                  Code: {creator.discount_code}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className={clsx(
              'mt-3 w-full flex items-center justify-center gap-2 p-2.5 rounded-xl',
              'text-error-600 hover:bg-error-50 transition-all duration-200',
              'text-sm font-medium'
            )}
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 bg-white border-r border-neutral-100">
          <div className="flex items-center h-16 px-6 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-brand-glow/30">
                <span className="text-white font-bold text-lg">Y</span>
              </div>
              <div>
                <p className="font-semibold text-neutral-900">Yeoskin</p>
                <p className="text-xs text-neutral-500">Portail Créateur</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </nav>

          {/* User info at bottom */}
          <div className="p-4 border-t border-neutral-100">
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center shadow-soft-sm">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {creator?.email || user?.email || 'Creator'}
                </p>
                {creator?.discount_code && (
                  <p className="text-xs text-neutral-500 truncate">
                    Code: {creator.discount_code}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-neutral-100">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-xl hover:bg-neutral-100 transition-colors lg:hidden"
              >
                <Menu className="w-5 h-5 text-neutral-600" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold text-neutral-900 truncate">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-neutral-500 truncate">{subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <NotificationBell />

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdown(!profileDropdown)}
                  className={clsx(
                    'flex items-center gap-2 p-2 rounded-xl',
                    'hover:bg-neutral-100 transition-all duration-200',
                    profileDropdown && 'bg-neutral-100'
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center shadow-soft-sm">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <ChevronDown className={clsx(
                    'w-4 h-4 text-neutral-500 transition-transform duration-200',
                    profileDropdown && 'rotate-180'
                  )} />
                </button>

                {profileDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setProfileDropdown(false)}
                    />
                    <div className={clsx(
                      'absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-soft-xl',
                      'border border-neutral-100 z-50 animate-scale-in',
                      'overflow-hidden'
                    )}>
                      <div className="p-4 border-b border-neutral-100 bg-neutral-50/50">
                        <p className="text-sm font-medium text-neutral-900 truncate">
                          {creator?.email || user?.email}
                        </p>
                        {creator?.discount_code && (
                          <p className="text-xs text-neutral-500 mt-1">
                            Code promo: <span className="font-mono font-medium text-brand-600">{creator.discount_code}</span>
                          </p>
                        )}
                      </div>
                      <div className="p-2">
                        <Link
                          to="/c/creator/profile"
                          onClick={() => setProfileDropdown(false)}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                          <User className="w-4 h-4" />
                          Mon profil
                        </Link>
                        <Link
                          to="/c/creator/settings"
                          onClick={() => setProfileDropdown(false)}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Paramètres
                        </Link>
                        <div className="my-1 border-t border-neutral-100" />
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Se déconnecter
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

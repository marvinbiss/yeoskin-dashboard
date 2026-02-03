'use client'

import { useState, useEffect } from 'react'
import {
  Moon,
  Sun,
  RefreshCw,
  Wifi,
  WifiOff,
  Menu
} from 'lucide-react'
import clsx from 'clsx'
import { checkConnection } from '../../lib/supabase'
import { GlobalSearch } from './GlobalSearch'
import { NotificationCenter } from './NotificationCenter'

export const Header = ({ title, subtitle, onMenuClick }) => {
  const [darkMode, setDarkMode] = useState(false)
  const [connected, setConnected] = useState(true)
  const [lastSync, setLastSync] = useState(new Date())

  // Check dark mode preference
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true' ||
      (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setDarkMode(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newValue = !darkMode
    setDarkMode(newValue)
    localStorage.setItem('darkMode', String(newValue))
    document.documentElement.classList.toggle('dark', newValue)
  }

  // Check connection status
  useEffect(() => {
    const check = async () => {
      const { connected } = await checkConnection()
      setConnected(connected)
      if (connected) {
        setLastSync(new Date())
      }
    }

    check()
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [])

  // Calculate time since last sync
  const getTimeSinceSync = () => {
    const seconds = Math.floor((Date.now() - lastSync.getTime()) / 1000)
    if (seconds < 60) return `il y a ${seconds}s`
    const minutes = Math.floor(seconds / 60)
    return `il y a ${minutes}m`
  }

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-neutral-100">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Left side - Menu + Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            onClick={onMenuClick}
            className={clsx(
              'p-2 rounded-xl lg:hidden flex-shrink-0',
              'text-neutral-500 hover:text-neutral-700',
              'hover:bg-neutral-100 transition-all duration-200'
            )}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg md:text-xl font-semibold text-neutral-900 truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-neutral-500 truncate hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
          {/* Global Search - Hidden on mobile */}
          <div className="hidden lg:block">
            <GlobalSearch />
          </div>

          {/* Connection Status - Hidden on small screens */}
          <div className={clsx(
            'hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
            'transition-all duration-200',
            connected
              ? 'bg-mint-50 text-mint-600'
              : 'bg-error-50 text-error-600'
          )}>
            {connected ? (
              <Wifi key="wifi-on" className="w-3.5 h-3.5" />
            ) : (
              <WifiOff key="wifi-off" className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {connected ? `Sync ${getTimeSinceSync()}` : 'Hors ligne'}
            </span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => window.location.reload()}
            className={clsx(
              'hidden sm:flex p-2.5 rounded-xl',
              'text-neutral-400 hover:text-neutral-600',
              'hover:bg-neutral-100 transition-all duration-200'
            )}
            title="Actualiser"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <NotificationCenter />

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className={clsx(
              'p-2.5 rounded-xl',
              'text-neutral-400 hover:text-neutral-600',
              'hover:bg-neutral-100 transition-all duration-200'
            )}
            title={darkMode ? 'Mode clair' : 'Mode sombre'}
          >
            {darkMode ? (
              <Sun key="sun" className="w-5 h-5" />
            ) : (
              <Moon key="moon" className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}

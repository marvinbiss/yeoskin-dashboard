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
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Left side - Menu + Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:hidden flex-shrink-0"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-shrink-0">
          {/* Global Search - Hidden on mobile */}
          <div className="hidden lg:block">
            <GlobalSearch />
          </div>

          {/* Connection Status - Hidden on small screens */}
          <div className={clsx(
            'hidden md:flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-full text-xs font-medium',
            connected
              ? 'bg-success-50 text-success-600 dark:bg-success-500/20'
              : 'bg-danger-50 text-danger-600 dark:bg-danger-500/20'
          )}>
            {connected ? (
              <Wifi key="wifi-on" className="w-3.5 h-3.5" />
            ) : (
              <WifiOff key="wifi-off" className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{connected ? `Sync ${getTimeSinceSync()}` : 'Hors ligne'}</span>
          </div>

          {/* Refresh Button - Hidden on very small screens */}
          <button
            onClick={() => window.location.reload()}
            className="hidden sm:block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Actualiser"
          >
            <RefreshCw className="w-5 h-5 text-gray-500" />
          </button>

          {/* Notifications - Always visible */}
          <NotificationCenter />

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={darkMode ? 'Mode clair' : 'Mode sombre'}
          >
            {darkMode ? (
              <Sun key="sun" className="w-5 h-5 text-gray-500" />
            ) : (
              <Moon key="moon" className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}

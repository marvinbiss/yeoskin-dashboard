'use client'

// Next.js navigation compatibility layer for react-router-dom
import { useRouter, usePathname, useSearchParams as useNextSearchParams, useParams as useNextParams } from 'next/navigation'
import NextLink from 'next/link'
import { useMemo, useEffect, Suspense, useState } from 'react'

// useNavigate replacement
export function useNavigate() {
  const router = useRouter()

  return useMemo(() => {
    const navigate = (to, options = {}) => {
      if (typeof to === 'number') {
        if (to === -1) {
          router.back()
        } else {
          // Forward navigation not supported, go to home
          router.push('/')
        }
      } else if (options.replace) {
        router.replace(to)
      } else {
        router.push(to)
      }
    }

    return navigate
  }, [router])
}

// Safe useSearchParams that doesn't crash during SSR
export function useSearchParams() {
  const searchParams = useNextSearchParams()
  return searchParams
}

// useLocation replacement
export function useLocation() {
  const pathname = usePathname()
  const [search, setSearch] = useState('')

  // Handle search params on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSearch(window.location.search)
    }
  }, [pathname])

  return useMemo(() => ({
    pathname,
    search,
    hash: typeof window !== 'undefined' ? window.location.hash : '',
    state: null, // Next.js doesn't have location state
  }), [pathname, search])
}

// useParams replacement
export function useParams() {
  return useNextParams()
}

// useSearchParams wrapper is exported above

// Link component wrapper
export function Link({ to, children, className, ...props }) {
  return (
    <NextLink href={to} className={className} {...props}>
      {children}
    </NextLink>
  )
}

// NavLink with active state
export function NavLink({ to, children, className, activeClassName, ...props }) {
  const pathname = usePathname()
  const isActive = pathname === to || pathname.startsWith(`${to}/`)

  const combinedClassName = typeof className === 'function'
    ? className({ isActive })
    : `${className || ''} ${isActive ? activeClassName || '' : ''}`.trim()

  return (
    <NextLink href={to} className={combinedClassName} {...props}>
      {typeof children === 'function' ? children({ isActive }) : children}
    </NextLink>
  )
}

// Outlet replacement (for nested routes)
// In Next.js App Router, this is handled by layout.jsx and {children}
export function Outlet() {
  console.warn('Outlet is not needed in Next.js App Router. Use {children} in layout.jsx instead.')
  return null
}

// Navigate component replacement (for programmatic redirect in render)
export function Navigate({ to, replace = false }) {
  const router = useRouter()

  useEffect(() => {
    if (replace) {
      router.replace(to)
    } else {
      router.push(to)
    }
  }, [router, to, replace])

  return null
}

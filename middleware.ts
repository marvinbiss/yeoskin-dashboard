/**
 * Next.js Middleware for Yeoskin
 * Handles:
 * - yeoskin.com -> /c/* routes (Next.js) + everything else proxied to Shopify
 * - apply.yeoskin.com -> /apply routes
 * - admin.yeoskin.com -> /admin routes
 * - dashboard.yeoskin.com -> /c/creator routes (legacy, redirects)
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Domains that should skip all processing (dev environments)
const SKIP_DOMAINS = ['localhost', '127.0.0.1', 'vercel.app']

// Domains that serve /c/ routes directly (no Shopify proxy needed)
const CREATOR_DOMAINS = ['yeoskin.fr', 'www.yeoskin.fr']

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // Skip for localhost and Vercel preview deployments
  const shouldSkip = SKIP_DOMAINS.some(domain => hostname.includes(domain))

  if (shouldSkip) {
    return NextResponse.next()
  }

  // Handle yeoskin.fr - serve /c/ routes + /auth/ routes + /shop/ routes, redirect everything else to yeoskin.com
  if (CREATOR_DOMAINS.includes(hostname.replace(':443', '').replace(':80', ''))) {
    const path = url.pathname

    // /c/* routes are handled by Next.js (creator pages + dashboard)
    if (path.startsWith('/c/') || path === '/c') {
      return NextResponse.next()
    }

    // /auth/* routes for password setup
    if (path.startsWith('/auth')) {
      return NextResponse.next()
    }

    // /shop/* routes for public sales pages
    if (path.startsWith('/shop')) {
      return NextResponse.next()
    }

    // Next.js internal assets needed for /c/ pages
    if (path.startsWith('/_next') || path.startsWith('/api')) {
      return NextResponse.next()
    }

    // Everything else → redirect to yeoskin.com
    return NextResponse.redirect(new URL(path, 'https://yeoskin.com'))
  }

  // Extract subdomain
  // Example: apply.yeoskin.com -> apply
  const subdomain = hostname.split('.')[0]

  // Handle apply.yeoskin.com subdomain
  if (subdomain === 'apply') {
    const path = url.pathname

    // Allow API routes
    if (path.startsWith('/api/apply')) {
      return NextResponse.next()
    }

    // Rewrite paths for apply subdomain to /apply routes
    if (path === '/') {
      return NextResponse.rewrite(new URL('/apply', request.url))
    }
    if (path === '/form' || path === '/apply/form') {
      return NextResponse.rewrite(new URL('/apply/form', request.url))
    }
    if (path === '/success' || path.startsWith('/success') || path === '/apply/success' || path.startsWith('/apply/success')) {
      const cleanPath = path.replace(/^\/apply/, '') || '/success'
      return NextResponse.rewrite(new URL(`/apply${cleanPath}`, request.url))
    }
    if (path === '/apply') {
      return NextResponse.rewrite(new URL('/apply', request.url))
    }

    // Allow static assets
    if (path.startsWith('/_next') || path.startsWith('/favicon') || path.startsWith('/images')) {
      return NextResponse.next()
    }

    // Allow /apply paths (in case links use full paths)
    if (path.startsWith('/apply')) {
      return NextResponse.rewrite(new URL(path, request.url))
    }

    // Block access to other routes on apply subdomain
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Handle admin.yeoskin.com subdomain
  // All routes allowed, no rewrites needed (dashboard is at root)
  if (subdomain === 'admin') {
    return NextResponse.next()
  }

  // Handle dashboard.yeoskin.com subdomain
  if (subdomain === 'dashboard') {
    const path = url.pathname

    // Allow creator routes, auth routes, API, and assets
    if (path.startsWith('/c/creator') || path.startsWith('/auth') || path.startsWith('/api') || path.startsWith('/_next')) {
      return NextResponse.next()
    }

    // Redirect old /creator paths to new /c/creator paths
    if (path.startsWith('/creator')) {
      const newPath = '/c' + path
      return NextResponse.redirect(new URL(newPath, request.url))
    }

    // Redirect root to creator dashboard
    if (path === '/') {
      return NextResponse.redirect(new URL('/c/creator', request.url))
    }
  }

  return NextResponse.next()
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

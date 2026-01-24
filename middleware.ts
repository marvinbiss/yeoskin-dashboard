/**
 * Next.js Middleware for Yeoskin
 * Handles subdomain routing for:
 * - apply.yeoskin.com -> /apply routes
 * - admin.yeoskin.com -> /admin routes (existing)
 * - dashboard.yeoskin.com -> /creator routes (existing)
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Subdomain configuration
const SUBDOMAINS = {
  apply: {
    // Routes that should be accessible on apply.yeoskin.com
    allowedPaths: ['/', '/form', '/success', '/api/apply'],
    // Rewrite root to /apply page (the (apply) route group)
    rewriteRoot: true,
  },
  admin: {
    allowedPaths: null, // null = all paths allowed
    rewriteRoot: false,
  },
  dashboard: {
    allowedPaths: null,
    rewriteRoot: false,
  },
}

// Domains that should skip subdomain processing
const SKIP_DOMAINS = ['localhost', '127.0.0.1', 'vercel.app']

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // Skip for localhost and Vercel preview deployments
  const shouldSkip = SKIP_DOMAINS.some(domain => hostname.includes(domain))

  if (shouldSkip) {
    return NextResponse.next()
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

    // Allow creator routes
    if (path.startsWith('/creator') || path.startsWith('/login') || path.startsWith('/api') || path.startsWith('/_next')) {
      return NextResponse.next()
    }

    // Redirect root to creator dashboard
    if (path === '/') {
      return NextResponse.redirect(new URL('/creator', request.url))
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

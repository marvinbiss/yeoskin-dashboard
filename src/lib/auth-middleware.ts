/**
 * Shared Authentication Middleware
 * Use this in all protected API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service role client for admin verification
const getServiceClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// User client for token verification
const getUserClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type AdminRole = 'super_admin' | 'admin' | 'viewer'

export interface AuthResult {
  authenticated: boolean
  userId?: string
  email?: string
  role?: AdminRole
  isAdmin?: boolean
  error?: string
}

/**
 * Verify if request has valid admin authentication
 * @param req - NextRequest object
 * @param requiredRoles - Optional array of required roles (default: any admin)
 * @returns AuthResult with authentication status
 */
export async function verifyAdminAuth(
  req: NextRequest,
  requiredRoles?: AdminRole[]
): Promise<AuthResult> {
  try {
    const authHeader = req.headers.get('authorization')

    if (!authHeader) {
      return { authenticated: false, error: 'No authorization header' }
    }

    const token = authHeader.replace('Bearer ', '')

    if (!token) {
      return { authenticated: false, error: 'No token provided' }
    }

    // Verify the token and get user
    const userClient = getUserClient()
    const { data: { user }, error: userError } = await userClient.auth.getUser(token)

    if (userError || !user) {
      return { authenticated: false, error: 'Invalid token' }
    }

    // Check if user is an active admin (try admin_profiles first, then admin_users)
    const supabase = getServiceClient()

    // Try admin_profiles table first
    let admin = null
    let adminError = null

    const { data: profileData, error: profileError } = await supabase
      .from('admin_profiles')
      .select('id, role, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (profileData) {
      admin = profileData
    } else {
      // Fallback to admin_users table
      const { data: userData, error: userError } = await supabase
        .from('admin_users')
        .select('user_id, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      if (userData) {
        admin = { id: userData.user_id, role: 'admin', is_active: true }
      }
      adminError = userError
    }

    if (adminError) {
      console.error('[Auth] Admin lookup error:', adminError)
      return { authenticated: false, error: 'Database error' }
    }

    if (!admin) {
      return { authenticated: false, error: 'Not an admin' }
    }

    // Check role requirements if specified
    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(admin.role as AdminRole)) {
        return {
          authenticated: true,
          userId: user.id,
          email: user.email,
          role: admin.role as AdminRole,
          isAdmin: true,
          error: 'Insufficient permissions'
        }
      }
    }

    return {
      authenticated: true,
      userId: user.id,
      email: user.email,
      role: admin.role as AdminRole,
      isAdmin: true
    }

  } catch (error) {
    console.error('[Auth] Verification error:', error)
    return { authenticated: false, error: 'Authentication failed' }
  }
}

/**
 * Verify if request has valid creator authentication
 * @param req - NextRequest object
 * @returns AuthResult with authentication status
 */
export async function verifyCreatorAuth(req: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = req.headers.get('authorization')

    if (!authHeader) {
      return { authenticated: false, error: 'No authorization header' }
    }

    const token = authHeader.replace('Bearer ', '')

    if (!token) {
      return { authenticated: false, error: 'No token provided' }
    }

    const userClient = getUserClient()
    const { data: { user }, error: userError } = await userClient.auth.getUser(token)

    if (userError || !user) {
      return { authenticated: false, error: 'Invalid token' }
    }

    // Check if user is a creator
    const supabase = getServiceClient()
    const { data: creator, error: creatorError } = await supabase
      .from('creators')
      .select('id, status')
      .eq('user_id', user.id)
      .maybeSingle()

    if (creatorError) {
      console.error('[Auth] Creator lookup error:', creatorError)
      return { authenticated: false, error: 'Database error' }
    }

    if (!creator || creator.status !== 'active') {
      return { authenticated: false, error: 'Not an active creator' }
    }

    return {
      authenticated: true,
      userId: user.id,
      email: user.email
    }

  } catch (error) {
    console.error('[Auth] Creator verification error:', error)
    return { authenticated: false, error: 'Authentication failed' }
  }
}

/**
 * Helper to create unauthorized response
 */
export function unauthorizedResponse(message = 'Unauthorized'): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 })
}

/**
 * Helper to create forbidden response
 */
export function forbiddenResponse(message = 'Forbidden'): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 })
}

/**
 * Middleware wrapper for admin-only routes
 * Usage: export const POST = withAdminAuth(async (req, auth) => { ... })
 */
export function withAdminAuth(
  handler: (req: NextRequest, auth: AuthResult) => Promise<NextResponse>,
  requiredRoles?: AdminRole[]
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const auth = await verifyAdminAuth(req, requiredRoles)

    if (!auth.authenticated) {
      return unauthorizedResponse(auth.error)
    }

    if (auth.error === 'Insufficient permissions') {
      return forbiddenResponse(auth.error)
    }

    return handler(req, auth)
  }
}

/**
 * Middleware wrapper for creator-only routes
 */
export function withCreatorAuth(
  handler: (req: NextRequest, auth: AuthResult) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const auth = await verifyCreatorAuth(req)

    if (!auth.authenticated) {
      return unauthorizedResponse(auth.error)
    }

    return handler(req, auth)
  }
}

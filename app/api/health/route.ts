/**
 * GET /api/health
 * Health check endpoint for monitoring and load balancers
 *
 * Returns:
 * - 200 OK: All systems operational
 * - 503 Service Unavailable: One or more services down
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  checks: {
    database: CheckResult
    auth: CheckResult
    storage: CheckResult
  }
}

interface CheckResult {
  status: 'ok' | 'error'
  latency?: number
  error?: string
}

const startTime = Date.now()

async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase
      .from('admin_profiles')
      .select('id')
      .limit(1)

    if (error) throw error

    return {
      status: 'ok',
      latency: Date.now() - start,
    }
  } catch (error) {
    return {
      status: 'error',
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function checkAuth(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Just verify we can connect to auth service
    const { error } = await supabase.auth.getSession()

    // No session is fine, we just want to check connectivity
    if (error && !error.message.includes('session')) throw error

    return {
      status: 'ok',
      latency: Date.now() - start,
    }
  } catch (error) {
    return {
      status: 'error',
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function checkStorage(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase.storage.listBuckets()

    if (error) throw error

    return {
      status: 'ok',
      latency: Date.now() - start,
    }
  } catch (error) {
    return {
      status: 'error',
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function GET(): Promise<NextResponse<HealthStatus>> {
  const [database, auth, storage] = await Promise.all([
    checkDatabase(),
    checkAuth(),
    checkStorage(),
  ])

  const checks = { database, auth, storage }

  // Determine overall status
  const allOk = Object.values(checks).every((c) => c.status === 'ok')
  const anyError = Object.values(checks).some((c) => c.status === 'error')

  let status: HealthStatus['status'] = 'healthy'
  if (anyError && !allOk) status = 'degraded'
  if (Object.values(checks).every((c) => c.status === 'error')) status = 'unhealthy'

  const healthStatus: HealthStatus = {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '2.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks,
  }

  const httpStatus = status === 'unhealthy' ? 503 : 200

  return NextResponse.json(healthStatus, { status: httpStatus })
}

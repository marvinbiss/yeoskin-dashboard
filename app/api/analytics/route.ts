import { NextRequest, NextResponse } from 'next/server'

/**
 * Analytics API Endpoint
 *
 * Receives analytics events from the frontend and processes them.
 * In production, this would forward to a data warehouse or analytics service.
 */

interface AnalyticsPayload {
  events: Array<{
    name: string
    category: string
    action: string
    label?: string
    value?: number
    metadata?: Record<string, unknown>
    timestamp: number
  }>
  pageViews: Array<{
    path: string
    title: string
    referrer: string
    timestamp: number
    duration?: number
  }>
  user?: {
    userId?: string
    role?: string
    creatorId?: string
    sessionId: string
  }
  sessionId: string
}

// In-memory store for development (replace with actual storage in production)
const analyticsStore: AnalyticsPayload[] = []

export async function POST(request: NextRequest) {
  try {
    const payload: AnalyticsPayload = await request.json()

    // Validate payload
    if (!payload.sessionId || !Array.isArray(payload.events)) {
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      )
    }

    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Received:', {
        events: payload.events.length,
        pageViews: payload.pageViews?.length || 0,
        sessionId: payload.sessionId,
        userId: payload.user?.userId,
      })
    }

    // Store events (in production, send to data warehouse)
    analyticsStore.push(payload)

    // Keep only last 1000 entries in memory (for dev)
    if (analyticsStore.length > 1000) {
      analyticsStore.shift()
    }

    // In production, forward to analytics service:
    // - Google Analytics
    // - Mixpanel
    // - Amplitude
    // - PostHog
    // - Custom data warehouse

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Analytics] Error processing events:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // In development, allow viewing stored analytics
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '100', 10)

  const recentEvents = analyticsStore.slice(-limit)

  const summary = {
    totalSessions: new Set(recentEvents.map((e) => e.sessionId)).size,
    totalEvents: recentEvents.reduce((sum, p) => sum + p.events.length, 0),
    totalPageViews: recentEvents.reduce(
      (sum, p) => sum + (p.pageViews?.length || 0),
      0
    ),
    topEvents: getTopEvents(recentEvents),
    topPages: getTopPages(recentEvents),
  }

  return NextResponse.json({
    summary,
    recentPayloads: recentEvents.slice(-10),
  })
}

function getTopEvents(payloads: AnalyticsPayload[]): Record<string, number> {
  const counts: Record<string, number> = {}

  payloads.forEach((payload) => {
    payload.events.forEach((event) => {
      counts[event.name] = (counts[event.name] || 0) + 1
    })
  })

  return Object.fromEntries(
    Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
  )
}

function getTopPages(payloads: AnalyticsPayload[]): Record<string, number> {
  const counts: Record<string, number> = {}

  payloads.forEach((payload) => {
    payload.pageViews?.forEach((pv) => {
      counts[pv.path] = (counts[pv.path] || 0) + 1
    })
  })

  return Object.fromEntries(
    Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
  )
}

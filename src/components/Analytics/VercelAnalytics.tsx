'use client'

import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

/**
 * Vercel Analytics Integration
 *
 * Provides automatic page view tracking and speed insights
 * when deployed to Vercel.
 */
export function VercelAnalytics() {
  return (
    <>
      {/* Vercel Web Analytics - automatic page view tracking */}
      <Analytics />

      {/* Vercel Speed Insights - Core Web Vitals monitoring */}
      <SpeedInsights />
    </>
  )
}

export default VercelAnalytics

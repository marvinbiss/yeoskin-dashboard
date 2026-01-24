/**
 * POST /api/apply
 * Submit a new creator application
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { anonRatelimit, getClientIp, rateLimitResponse } from '@/lib/ratelimit'
import { sendApplicationConfirmation } from '@/lib/email'

// Create Supabase client with service role for bypassing RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// Validation helpers
const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const sanitizeHandle = (handle: string | null): string | null => {
  if (!handle) return null
  return handle.replace(/^@/, '').trim().toLowerCase()
}

interface ApplicationBody {
  email: string
  first_name: string
  last_name: string
  phone?: string | null
  country?: string
  city?: string | null
  instagram_handle?: string | null
  instagram_followers?: number
  tiktok_handle?: string | null
  tiktok_followers?: number
  youtube_handle?: string | null
  youtube_subscribers?: number
  content_type?: string[]
  experience_level?: string
  motivation?: string
  website_url?: string | null
  source?: string | null
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request)
    const { success, reset } = await anonRatelimit.limit(`apply:${ip}`)

    if (!success) {
      return rateLimitResponse(reset)
    }

    // Parse body
    const body: ApplicationBody = await request.json()

    // Validate required fields
    if (!body.email || !isValidEmail(body.email)) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      )
    }

    if (!body.first_name?.trim() || !body.last_name?.trim()) {
      return NextResponse.json(
        { error: 'Prénom et nom requis' },
        { status: 400 }
      )
    }

    // Check at least one social handle
    const hasInstagram = body.instagram_handle?.trim()
    const hasTiktok = body.tiktok_handle?.trim()
    const hasYoutube = body.youtube_handle?.trim()

    if (!hasInstagram && !hasTiktok && !hasYoutube) {
      return NextResponse.json(
        { error: 'Au moins un réseau social requis' },
        { status: 400 }
      )
    }

    // Check for existing application with same email
    const { data: existingApp } = await supabase
      .from('creator_applications')
      .select('id, status')
      .eq('email', body.email.toLowerCase().trim())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existingApp && ['pending', 'under_review', 'approved'].includes(existingApp.status)) {
      return NextResponse.json(
        { error: 'Une candidature existe déjà pour cet email' },
        { status: 409 }
      )
    }

    // Check if email already exists as creator
    const { data: existingCreator } = await supabase
      .from('creators')
      .select('id')
      .eq('email', body.email.toLowerCase().trim())
      .single()

    if (existingCreator) {
      return NextResponse.json(
        { error: 'Un compte créateur existe déjà avec cet email' },
        { status: 409 }
      )
    }

    // Calculate total followers
    const instagramFollowers = body.instagram_followers || 0
    const tiktokFollowers = body.tiktok_followers || 0
    const youtubeSubscribers = body.youtube_subscribers || 0
    const totalFollowers = instagramFollowers + tiktokFollowers + youtubeSubscribers

    // Prepare application data
    const applicationData = {
      email: body.email.toLowerCase().trim(),
      first_name: body.first_name.trim(),
      last_name: body.last_name.trim(),
      phone: body.phone?.trim() || null,
      country: body.country || 'FR',
      city: body.city?.trim() || null,
      instagram_handle: sanitizeHandle(body.instagram_handle || null),
      instagram_followers: instagramFollowers,
      tiktok_handle: sanitizeHandle(body.tiktok_handle || null),
      tiktok_followers: tiktokFollowers,
      youtube_handle: sanitizeHandle(body.youtube_handle || null),
      youtube_subscribers: youtubeSubscribers,
      content_type: body.content_type || [],
      experience_level: body.experience_level || 'beginner',
      motivation: body.motivation?.trim() || null,
      website_url: body.website_url?.trim() || null,
      source: body.source || 'organic',
      utm_source: body.utm_source || null,
      utm_medium: body.utm_medium || null,
      utm_campaign: body.utm_campaign || null,
      ip_address: ip,
      user_agent: request.headers.get('user-agent') || null,
    }

    // Insert application
    const { data: application, error: insertError } = await supabase
      .from('creator_applications')
      .insert(applicationData)
      .select('id, auto_approved, suggested_tier_id, status')
      .single()

    if (insertError) {
      console.error('[Apply] Insert error:', insertError)
      return NextResponse.json(
        { error: 'Erreur lors de la soumission' },
        { status: 500 }
      )
    }

    // If auto-approved, update status and create creator
    let tierName = 'Bronze'
    if (application.auto_approved) {
      // Get tier info
      const { data: tier } = await supabase
        .from('commission_tiers')
        .select('name, display_name, commission_rate')
        .eq('id', application.suggested_tier_id)
        .single()

      tierName = tier?.display_name || 'Silver'
      const commissionRate = tier?.commission_rate || 0.15

      // Update application status to approved
      await supabase
        .from('creator_applications')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          review_notes: 'Auto-approved based on follower count',
        })
        .eq('id', application.id)

      // Generate discount code
      const prefix = (body.first_name || 'YEO').substring(0, 3).toUpperCase()
      const hash = Array.from(body.email + Date.now().toString())
        .reduce((acc: number, char: string) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0)
      const discountCode = prefix + Math.abs(hash).toString(36).substring(0, 5).toUpperCase()

      // Generate slug
      const slug = `${(body.first_name || '').toLowerCase()}-${(body.last_name || '').toLowerCase()}`
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      // Check if creator already exists
      const { data: existingCreator } = await supabase
        .from('creators')
        .select('id')
        .eq('email', body.email.toLowerCase().trim())
        .maybeSingle()

      if (!existingCreator) {
        // Check slug uniqueness
        const { data: slugExists } = await supabase
          .from('creators')
          .select('id')
          .eq('slug', slug)
          .maybeSingle()

        const finalSlug = slugExists ? slug + '-' + Math.random().toString(36).substring(2, 6) : slug

        // Create creator directly
        const { error: createError } = await supabase
          .from('creators')
          .insert({
            email: body.email.toLowerCase().trim(),
            discount_code: discountCode,
            commission_rate: commissionRate,
            tier_id: application.suggested_tier_id,
            slug: finalSlug,
            status: 'active',
          })

        if (createError) {
          console.error('[Apply] Creator creation error:', createError)
        }
      }
    }

    // Send confirmation email (fire and forget)
    sendApplicationConfirmation({
      to: body.email.toLowerCase().trim(),
      firstName: body.first_name.trim(),
      lastName: body.last_name.trim(),
      applicationId: application.id,
      autoApproved: application.auto_approved,
      totalFollowers,
      tierName,
    }).catch((err) => {
      console.error('[Apply] Email error:', err)
    })

    // Log success
    console.info('[Apply] Application submitted:', {
      id: application.id,
      email: body.email,
      totalFollowers,
      autoApproved: application.auto_approved,
    })

    return NextResponse.json({
      success: true,
      id: application.id,
      auto_approved: application.auto_approved,
      status: application.auto_approved ? 'approved' : 'pending',
    })
  } catch (error) {
    console.error('[Apply] Error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// GET endpoint to check application status
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get('id')
  const email = searchParams.get('email')

  if (!id && !email) {
    return NextResponse.json(
      { error: 'ID ou email requis' },
      { status: 400 }
    )
  }

  try {
    let query = supabase
      .from('creator_applications')
      .select('id, status, auto_approved, created_at, reviewed_at')

    if (id) {
      query = query.eq('id', id)
    } else if (email) {
      query = query.eq('email', email.toLowerCase().trim())
    }

    const { data, error } = await query.single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Candidature non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[Apply] Status check error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { logger } from '@/lib/logger'
import { checkoutRatelimit, getClientIp, rateLimitResponse } from '@/lib/ratelimit'
import { createCart, validateVariantIds, getShopifyCircuitStats, CircuitOpenError } from '@/lib/shopify'

// Initialize Supabase client with service role for this API route
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET method for testing and health check
export async function GET(request: NextRequest) {
  const circuitStats = getShopifyCircuitStats()

  // Debug mode with ?debug=emma
  const debugSlug = request.nextUrl.searchParams.get('debug')
  if (debugSlug) {
    try {
      const { data: creator, error: creatorErr } = await supabase
        .from('creators')
        .select('id, slug')
        .eq('slug', debugSlug)
        .maybeSingle()

      if (creatorErr) {
        return NextResponse.json({ error: 'creator_error', details: creatorErr.message })
      }
      if (!creator) {
        return NextResponse.json({ error: 'creator_not_found', slug: debugSlug })
      }

      const { data: creatorRoutine, error: crErr } = await supabase
        .from('creator_routines')
        .select('id, routine_id, is_active')
        .eq('creator_id', creator.id)
        .eq('is_active', true)
        .maybeSingle()

      if (crErr) {
        return NextResponse.json({ error: 'creator_routine_error', details: crErr.message })
      }
      if (!creatorRoutine) {
        return NextResponse.json({ error: 'no_active_routine', creator_id: creator.id })
      }

      const { data: routine, error: routineErr } = await supabase
        .from('routines')
        .select('id, title, base_shopify_variant_ids')
        .eq('id', creatorRoutine.routine_id)
        .maybeSingle()

      if (routineErr) {
        return NextResponse.json({ error: 'routine_error', details: routineErr.message })
      }

      return NextResponse.json({
        status: 'debug_ok',
        creator,
        creatorRoutine,
        routine,
        variantIds: routine?.base_shopify_variant_ids,
      })
    } catch (e) {
      return NextResponse.json({ error: 'exception', message: String(e) })
    }
  }

  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/routines/checkout',
    shopify: {
      circuit: circuitStats.state,
      failures: circuitStats.failures,
      totalRequests: circuitStats.totalRequests,
    },
  })
}

// Valid variants
const VALID_VARIANTS = ['base', 'upsell_1', 'upsell_2'] as const
type RoutineVariant = typeof VALID_VARIANTS[number]

// Expected product counts per variant
const VARIANT_PRODUCT_COUNTS: Record<RoutineVariant, number> = {
  base: 3,
  upsell_1: 4,
  upsell_2: 5,
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()
  let debugStep = 'init'

  try {
    // ============================================
    // 0) RATE LIMITING
    // ============================================
    debugStep = 'rate_limit'
    const clientIp = getClientIp(request)
    const rateLimitResult = await checkoutRatelimit.limit(clientIp)

    if (!rateLimitResult.success) {
      logger.warn(
        { requestId, clientIp, remaining: rateLimitResult.remaining },
        'Rate limit exceeded'
      )
      return rateLimitResponse(rateLimitResult.reset)
    }

    // ============================================
    // 1) VALIDATION INPUT
    // ============================================
    debugStep = 'parse_body'
    const body = await request.json()
    const { creator_slug, variant, routine_slug } = body

    debugStep = 'log_request'
    logger.info(
      { requestId, creator_slug, variant, clientIp },
      'Checkout request received'
    )

    if (!creator_slug || typeof creator_slug !== 'string' || creator_slug.trim() === '') {
      return NextResponse.json(
        { error: 'creator_slug is required' },
        { status: 400 }
      )
    }

    if (!variant || !VALID_VARIANTS.includes(variant)) {
      return NextResponse.json(
        { error: `variant must be one of: ${VALID_VARIANTS.join(', ')}` },
        { status: 400 }
      )
    }

    const typedVariant = variant as RoutineVariant

    // ============================================
    // 2) RÉSOLUTION CREATOR
    // ============================================
    debugStep = 'creator_lookup'
    const { data: creator, error: creatorError } = await supabase
      .from('creators')
      .select('id, email, slug, discount_code')
      .eq('slug', creator_slug)
      .maybeSingle()

    if (creatorError) {
      logger.error({ requestId, error: creatorError.message }, 'Creator lookup error')
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    // ============================================
    // 3) RÉSOLUTION ROUTINE
    // ============================================
    let routine: { id: string; title: string; base_shopify_variant_ids: (string|number)[]; upsell_1_shopify_variant_ids: (string|number)[]; upsell_2_shopify_variant_ids: (string|number)[] } | null = null

    if (creator) {
      // Path A: Creator found → look up assigned routine
      debugStep = 'creator_routine_lookup'
      const { data: creatorRoutine, error: creatorRoutineError } = await supabase
        .from('creator_routines')
        .select('id, routine_id, is_active')
        .eq('creator_id', creator.id)
        .eq('is_active', true)
        .maybeSingle()

      if (creatorRoutineError) {
        logger.error({ requestId, error: creatorRoutineError.message }, 'Creator routine lookup error')
        return NextResponse.json(
          { error: 'Database error' },
          { status: 500 }
        )
      }

      if (creatorRoutine) {
        debugStep = 'routine_lookup_via_creator'
        const { data: routineData } = await supabase
          .from('routines')
          .select('id, title, base_shopify_variant_ids, upsell_1_shopify_variant_ids, upsell_2_shopify_variant_ids')
          .eq('id', creatorRoutine.routine_id)
          .maybeSingle()
        routine = routineData
      }
    }

    // Path B: No creator or no assigned routine → fallback to routine_slug
    if (!routine && routine_slug) {
      debugStep = 'routine_lookup_by_slug'
      logger.info({ requestId, routine_slug }, 'Falling back to routine_slug lookup')
      const { data: routineData, error: routineError } = await supabase
        .from('routines')
        .select('id, title, base_shopify_variant_ids, upsell_1_shopify_variant_ids, upsell_2_shopify_variant_ids')
        .eq('slug', routine_slug)
        .eq('is_active', true)
        .maybeSingle()

      if (routineError) {
        logger.error({ requestId, error: routineError.message }, 'Routine slug lookup error')
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }
      routine = routineData
    }

    if (!routine) {
      logger.warn({ requestId, creator_slug, routine_slug }, 'No routine found')
      return NextResponse.json(
        { error: 'No active routine found. Ensure a routine is assigned or active.' },
        { status: 404 }
      )
    }

    // ============================================
    // 4) SÉLECTION VARIANT IDs
    // ============================================
    debugStep = 'variant_selection'
    let rawVariantIds: (string | number)[]

    switch (typedVariant) {
      case 'base':
        rawVariantIds = routine.base_shopify_variant_ids
        break
      case 'upsell_1':
        rawVariantIds = routine.upsell_1_shopify_variant_ids
        break
      case 'upsell_2':
        rawVariantIds = routine.upsell_2_shopify_variant_ids
        break
    }

    // Basic validation - check raw data first
    const expectedCount = VARIANT_PRODUCT_COUNTS[typedVariant]
    if (!rawVariantIds || !Array.isArray(rawVariantIds) || rawVariantIds.length !== expectedCount) {
      logger.error(
        { requestId, expected: expectedCount, got: rawVariantIds?.length },
        'Invalid variant configuration'
      )
      return NextResponse.json(
        { error: `Invalid variant configuration: expected ${expectedCount} products, got ${rawVariantIds?.length || 0}` },
        { status: 422 }
      )
    }

    // Convert string IDs to numbers (Supabase stores them as strings in JSON)
    const variantIds = rawVariantIds.map(id =>
      typeof id === 'string' ? parseInt(id, 10) : id
    )

    if (!variantIds.every(id => id > 0 && !isNaN(id))) {
      return NextResponse.json(
        { error: 'Invalid variant IDs: all IDs must be positive numbers' },
        { status: 422 }
      )
    }

    // ============================================
    // 4.5) PROACTIVE VARIANT VALIDATION
    // ============================================
    debugStep = 'shopify_validation'
    const validation = await validateVariantIds(variantIds, requestId)

    if (!validation.valid) {
      logger.error(
        { requestId, invalidIds: validation.invalidIds, errors: validation.errors },
        'Variant validation failed'
      )
      return NextResponse.json(
        {
          error: 'Some products are no longer available',
          details: validation.errors,
          invalidVariantIds: validation.invalidIds,
        },
        { status: 422 }
      )
    }

    // ============================================
    // 5) IDEMPOTENCY KEY + PAYLOAD HASH
    // ============================================
    // Priority 1: Header, Priority 2: body, Priority 3: generate
    let idempotencyKey = request.headers.get('Idempotency-Key') || body.idempotency_key

    if (!idempotencyKey) {
      const stablePayload = `${creator_slug}|${typedVariant}|${routine.id}|${variantIds.join(',')}`
      idempotencyKey = crypto
        .createHash('sha256')
        .update(stablePayload)
        .digest('hex')
        .substring(0, 32)
    }

    const creatorId = creator?.id || 'organic'
    const payloadHash = crypto
      .createHash('sha256')
      .update(`${creatorId}|${routine.id}|${typedVariant}|${variantIds.join(',')}`)
      .digest('hex')

    // ============================================
    // 6) RÉSERVATION IDEMPOTENCY (LOCK AVANT SHOPIFY)
    // Only for tracked creator traffic (skip for organic)
    // ============================================
    let rowId: string | null = null

    if (creator) {
    const { data: existing } = await supabase
      .from('routine_checkouts')
      .select('id, payload_hash, checkout_url, status, created_at')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()

    if (existing) {
      if (existing.status === 'creating') {
        const createdAt = new Date(existing.created_at)
        const ageMinutes = (Date.now() - createdAt.getTime()) / 1000 / 60

        if (ageMinutes > 2) {
          // Stale lock - mark as failed
          logger.warn({ requestId, existingId: existing.id, ageMinutes }, 'Stale lock detected')
          await supabase
            .from('routine_checkouts')
            .update({
              status: 'failed',
              last_error: 'stale_lock_timeout'
            })
            .eq('id', existing.id)
          // Continue to create new reservation
        } else {
          logger.info({ requestId, existingId: existing.id }, 'Checkout creation in progress')
          return NextResponse.json(
            { error: 'Checkout creation in progress, retry in a moment' },
            {
              status: 409,
              headers: { 'Retry-After': '2' }
            }
          )
        }
      } else if (existing.status === 'completed') {
        if (existing.payload_hash === payloadHash) {
          logger.info({ requestId, existingId: existing.id }, 'Returning cached checkout')
          return NextResponse.json(
            {
              checkout_url: existing.checkout_url,
              idempotency_key: idempotencyKey,
              cached: true,
            },
            { status: 200 }
          )
        } else {
          logger.warn({ requestId }, 'Idempotency key conflict')
          return NextResponse.json(
            { error: 'Idempotency key conflict: different payload' },
            { status: 409 }
          )
        }
      } else if (existing.status === 'failed') {
        if (existing.payload_hash === payloadHash) {
          // Retry failed checkout
          logger.info({ requestId, existingId: existing.id }, 'Retrying failed checkout')
          const { data: retryRow } = await supabase
            .from('routine_checkouts')
            .update({
              status: 'creating',
              cart_id: `pending-${idempotencyKey}`,
              checkout_url: '',
              payload_hash: payloadHash,
              last_error: null
            })
            .eq('id', existing.id)
            .select('id')
            .maybeSingle()

          if (retryRow) {
            rowId = retryRow.id
          }
        } else {
          return NextResponse.json(
            { error: 'Idempotency key conflict: different payload' },
            { status: 409 }
          )
        }
      }
    }

    // Create new reservation if needed (skip for organic traffic without creator)
    if (!rowId && creator) {
      const now = new Date().toISOString()
      const { data: reservation, error: reservationError } = await supabase
        .from('routine_checkouts')
        .insert({
          routine_id: routine.id,
          creator_id: creator.id,
          variant: typedVariant,
          cart_id: `pending-${idempotencyKey}`,
          checkout_url: '',
          idempotency_key: idempotencyKey,
          payload_hash: payloadHash,
          status: 'creating',
          last_error: null,
          created_at: now,
          updated_at: now
        })
        .select('id')
        .maybeSingle()

      if (reservationError) {
        if (reservationError.code === '23505') {
          // Unique constraint violation - race condition
          logger.info({ requestId }, 'Race condition on reservation')
          const { data: retry } = await supabase
            .from('routine_checkouts')
            .select('checkout_url, status, payload_hash, idempotency_key')
            .eq('idempotency_key', idempotencyKey)
            .maybeSingle()

          if (retry?.status === 'completed') {
            if (retry.payload_hash === payloadHash) {
              return NextResponse.json({
                checkout_url: retry.checkout_url,
                idempotency_key: retry.idempotency_key,
                cached: true,
              })
            } else {
              return NextResponse.json(
                { error: 'Idempotency key conflict: different payload' },
                { status: 409 }
              )
            }
          }

          return NextResponse.json(
            { error: 'Concurrent checkout creation, retry in a moment' },
            {
              status: 409,
              headers: { 'Retry-After': '2' }
            }
          )
        }
        throw reservationError
      }

      if (!reservation) {
        throw new Error('Failed to create reservation')
      }

      rowId = reservation.id
    }
    } // end if (creator) - idempotency block

    // ============================================
    // 7) APPEL SHOPIFY STOREFRONT API
    // ============================================
    let cart: { id: string; checkoutUrl: string }

    try {
      const attributes = [
        { key: 'creator_id', value: creator?.id || 'organic' },
        { key: 'creator_slug', value: creator_slug || 'organic' },
        { key: 'routine_id', value: routine.id },
        { key: 'routine_variant', value: typedVariant },
        { key: 'source', value: 'yeoskin_platform' },
        { key: 'idempotency_key', value: idempotencyKey }
      ]

      const note = `Routine ${routine.title} via ${creator_slug}`
      const discountCodes = creator?.discount_code ? [creator.discount_code] : []

      const result = await createCart(variantIds, attributes, note, requestId, discountCodes)

      if (result.userErrors?.length > 0) {
        throw new Error(result.userErrors[0].message)
      }

      if (!result.cart) {
        throw new Error('No cart returned from Shopify')
      }

      cart = result.cart

    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error))
      const errorMessage = err.message || 'Unknown Shopify error'
      const isCircuitOpen = error instanceof CircuitOpenError

      logger.error(
        {
          requestId,
          creator_slug,
          variant: typedVariant,
          routine_id: routine.id,
          error: errorMessage,
          circuitOpen: isCircuitOpen,
        },
        'Shopify cart creation failed'
      )

      if (rowId) {
        await supabase
          .from('routine_checkouts')
          .update({
            status: 'failed',
            last_error: errorMessage.substring(0, 500)
          })
          .eq('id', rowId)
      }

      if (isCircuitOpen) {
        return NextResponse.json(
          {
            error: 'Shopify service temporarily unavailable',
            retryAfter: 30,
            circuit: 'open',
          },
          {
            status: 503,
            headers: { 'Retry-After': '30' }
          }
        )
      }

      if (err.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Shopify request timeout' },
          { status: 504 }
        )
      }

      return NextResponse.json(
        { error: 'Shopify API error', details: errorMessage },
        { status: 502 }
      )
    }

    // ============================================
    // 8) UPDATE ROUTINE_CHECKOUTS (finaliser)
    // ============================================
    if (rowId) {
      const { error: updateError } = await supabase
        .from('routine_checkouts')
        .update({
          cart_id: cart.id,
          checkout_url: cart.checkoutUrl,
          status: 'completed',
          last_error: null
        })
        .eq('id', rowId)

      if (updateError) {
        logger.error({ requestId, error: updateError.message }, 'Failed to finalize checkout')
      }
    }

    // Increment cart stats (fire and forget, only if creator exists)
    if (creator) {
      void (async () => {
        try {
          await supabase.rpc('increment_routine_cart', {
            p_routine_id: routine.id,
            p_creator_id: creator.id,
            p_variant: typedVariant
          })
        } catch {
          // Ignore stats errors
        }
      })()
    }

    // ============================================
    // 9) RETURN SUCCESS
    // ============================================
    const duration = Date.now() - startTime
    logger.info(
      { requestId, duration, checkout_url: cart.checkoutUrl },
      'Checkout created successfully'
    )

    return NextResponse.json({
      checkout_url: cart.checkoutUrl,
      idempotency_key: idempotencyKey
    })

  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    const duration = Date.now() - startTime

    logger.error(
      { requestId, duration, error: err.message, stack: err.stack, debugStep },
      'Checkout error'
    )

    return NextResponse.json(
      { error: 'Internal server error', debugStep, details: err.message },
      { status: 500 }
    )
  }
}

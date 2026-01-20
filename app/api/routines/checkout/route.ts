import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Initialize Supabase client with service role for this API route
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET method for testing
export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: '/api/routines/checkout' })
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

// Shopify config
const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN || 'yeoskin.myshopify.com'
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-01'
const SHOPIFY_STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN

export async function POST(request: NextRequest) {
  try {
    // ============================================
    // 1) VALIDATION INPUT
    // ============================================
    const body = await request.json()
    const { creator_slug, variant } = body

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
    const { data: creator, error: creatorError } = await supabase
      .from('creators')
      .select('id, email, slug')
      .eq('slug', creator_slug)
      .maybeSingle()

    if (creatorError) {
      console.error('Creator lookup error:', creatorError.message)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      )
    }

    // ============================================
    // 3) RÉSOLUTION ROUTINE
    // ============================================
    const { data: creatorRoutine, error: routineError } = await supabase
      .from('creator_routines')
      .select(`
        id,
        routine_id,
        routines (
          id,
          title,
          slug,
          base_shopify_variant_ids,
          upsell_1_shopify_variant_ids,
          upsell_2_shopify_variant_ids
        )
      `)
      .eq('creator_id', creator.id)
      .eq('is_active', true)
      .maybeSingle()

    if (routineError) {
      console.error('Routine lookup error:', routineError.message)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    if (!creatorRoutine || !creatorRoutine.routines) {
      return NextResponse.json(
        { error: 'No active routine assigned to this creator' },
        { status: 404 }
      )
    }

    // Handle both array and single object from Supabase join
    const routineData = Array.isArray(creatorRoutine.routines)
      ? creatorRoutine.routines[0]
      : creatorRoutine.routines

    if (!routineData) {
      return NextResponse.json(
        { error: 'No active routine assigned to this creator' },
        { status: 404 }
      )
    }

    const routine = routineData as {
      id: string
      title: string
      slug: string
      base_shopify_variant_ids: number[]
      upsell_1_shopify_variant_ids: number[]
      upsell_2_shopify_variant_ids: number[]
    }

    // ============================================
    // 4) SÉLECTION VARIANT IDS
    // ============================================
    let variantIds: number[]

    switch (typedVariant) {
      case 'base':
        variantIds = routine.base_shopify_variant_ids
        break
      case 'upsell_1':
        variantIds = routine.upsell_1_shopify_variant_ids
        break
      case 'upsell_2':
        variantIds = routine.upsell_2_shopify_variant_ids
        break
    }

    // Validation
    const expectedCount = VARIANT_PRODUCT_COUNTS[typedVariant]
    if (!variantIds || variantIds.length !== expectedCount) {
      return NextResponse.json(
        { error: `Invalid variant configuration: expected ${expectedCount} products, got ${variantIds?.length || 0}` },
        { status: 422 }
      )
    }

    if (!variantIds.every(id => id > 0)) {
      return NextResponse.json(
        { error: 'Invalid variant IDs: all IDs must be positive' },
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

    const payloadHash = crypto
      .createHash('sha256')
      .update(`${creator.id}|${routine.id}|${typedVariant}|${variantIds.join(',')}`)
      .digest('hex')

    // ============================================
    // 6) RÉSERVATION IDEMPOTENCY (LOCK AVANT SHOPIFY)
    // ============================================
    const { data: existing } = await supabase
      .from('routine_checkouts')
      .select('id, payload_hash, checkout_url, status, created_at')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()

    let rowId: string | null = null

    if (existing) {
      if (existing.status === 'creating') {
        const createdAt = new Date(existing.created_at)
        const ageMinutes = (Date.now() - createdAt.getTime()) / 1000 / 60

        if (ageMinutes > 2) {
          // Stale lock - mark as failed
          await supabase
            .from('routine_checkouts')
            .update({
              status: 'failed',
              last_error: 'stale_lock_timeout'
            })
            .eq('id', existing.id)
          // Continue to create new reservation
        } else {
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
          return NextResponse.json(
            {
              checkout_url: existing.checkout_url,
              idempotency_key: idempotencyKey
            },
            { status: 200 }
          )
        } else {
          return NextResponse.json(
            { error: 'Idempotency key conflict: different payload' },
            { status: 409 }
          )
        }
      } else if (existing.status === 'failed') {
        if (existing.payload_hash === payloadHash) {
          // Retry failed checkout
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

    // Create new reservation if needed
    if (!rowId) {
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
          const { data: retry } = await supabase
            .from('routine_checkouts')
            .select('checkout_url, status, payload_hash, idempotency_key')
            .eq('idempotency_key', idempotencyKey)
            .maybeSingle()

          if (retry?.status === 'completed') {
            if (retry.payload_hash === payloadHash) {
              return NextResponse.json({
                checkout_url: retry.checkout_url,
                idempotency_key: retry.idempotency_key
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

    // ============================================
    // 7) APPEL SHOPIFY STOREFRONT API
    // ============================================
    if (!SHOPIFY_STOREFRONT_TOKEN) {
      await supabase
        .from('routine_checkouts')
        .update({
          status: 'failed',
          last_error: 'SHOPIFY_STOREFRONT_TOKEN not configured'
        })
        .eq('id', rowId)

      return NextResponse.json(
        { error: 'Shopify not configured' },
        { status: 500 }
      )
    }

    const shopifyEndpoint = `https://${SHOPIFY_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`

    const query = `
      mutation cartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart {
            id
            checkoutUrl
          }
          userErrors {
            field
            message
          }
        }
      }
    `

    const variables = {
      input: {
        lines: variantIds.map(id => ({
          merchandiseId: `gid://shopify/ProductVariant/${id}`,
          quantity: 1
        })),
        attributes: [
          { key: 'creator_id', value: creator.id },
          { key: 'creator_slug', value: creator_slug },
          { key: 'routine_id', value: routine.id },
          { key: 'routine_variant', value: typedVariant },
          { key: 'source', value: 'yeoskin_platform' },
          { key: 'idempotency_key', value: idempotencyKey }
        ],
        note: `Routine ${routine.title} via ${creator_slug}`
      }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    let cart: { id: string; checkoutUrl: string }

    try {
      const response = await fetch(shopifyEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status}`)
      }

      const result = await response.json()

      if (result.data?.cartCreate?.userErrors?.length > 0) {
        throw new Error(result.data.cartCreate.userErrors[0].message)
      }

      if (!result.data?.cartCreate?.cart) {
        throw new Error('No cart returned from Shopify')
      }

      cart = result.data.cartCreate.cart
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error))
      const errorMessage = err.message || 'Unknown Shopify error'

      // Log safely (no tokens)
      console.error('Shopify error:', {
        creator_slug,
        variant: typedVariant,
        routine_id: routine.id,
        idempotency_key: idempotencyKey,
        error: errorMessage
      })

      await supabase
        .from('routine_checkouts')
        .update({
          status: 'failed',
          last_error: errorMessage.substring(0, 500)
        })
        .eq('id', rowId)

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
    } finally {
      clearTimeout(timeoutId)
    }

    // ============================================
    // 8) UPDATE ROUTINE_CHECKOUTS (finaliser)
    // ============================================
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
      console.error('Failed to finalize checkout:', updateError.message)
      // Cart was created in Shopify, so we still return success
    }

    // Increment cart stats (fire and forget)
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

    // ============================================
    // 9) RETURN SUCCESS
    // ============================================
    return NextResponse.json({
      checkout_url: cart.checkoutUrl,
      idempotency_key: idempotencyKey
    })

  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('Checkout error:', err.message)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

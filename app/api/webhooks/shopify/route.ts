import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

// Verify Shopify webhook signature
function verifyShopifyWebhook(body: string, signature: string, secret: string): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64')
  return hash === signature
}

interface AttributionResult {
  creatorId: string | null
  routineId: string | null
  routineVariant: string | null
  attributionSource: 'cart_attributes' | 'cart_id' | 'discount_code' | null
  attributionPriority: number
}

/**
 * Attribution cascade following N8N workflow logic:
 * - Priority 3: cart_attributes (creator_id, routine_id from note_attributes)
 * - Priority 2: cart_id lookup in routine_checkouts table
 * - Priority 1: discount_code lookup in creators table
 */
async function findAttribution(
    supabase: any,
  order: Record<string, unknown>,
  requestId: string
): Promise<AttributionResult> {
  const result: AttributionResult = {
    creatorId: null,
    routineId: null,
    routineVariant: null,
    attributionSource: null,
    attributionPriority: 0,
  }

  const noteAttributes = order.note_attributes as Array<{ name: string; value: string }> | undefined

  // Priority 3: Check cart_attributes (note_attributes)
  const creatorAttr = noteAttributes?.find(a => a.name === 'creator_id')
  const routineAttr = noteAttributes?.find(a => a.name === 'routine_id')
  const variantAttr = noteAttributes?.find(a => a.name === 'routine_variant')

  if (creatorAttr?.value) {
    logger.info({ requestId, creatorId: creatorAttr.value }, 'Attribution found via cart_attributes (P3)')
    return {
      creatorId: creatorAttr.value,
      routineId: routineAttr?.value || null,
      routineVariant: variantAttr?.value || null,
      attributionSource: 'cart_attributes',
      attributionPriority: 3,
    }
  }

  // Priority 2: Check cart_id in routine_checkouts
  const cartToken = order.cart_token as string | undefined
  if (cartToken) {
    const { data: routineCheckout } = await supabase
      .from('routine_checkouts')
      .select('creator_id, routine_id, variant')
      .eq('cart_id', cartToken)
      .maybeSingle()

    if (routineCheckout && routineCheckout.creator_id) {
      logger.info({ requestId, cartToken, creatorId: routineCheckout.creator_id }, 'Attribution found via cart_id (P2)')
      return {
        creatorId: routineCheckout.creator_id,
        routineId: routineCheckout.routine_id,
        routineVariant: routineCheckout.variant,
        attributionSource: 'cart_id',
        attributionPriority: 2,
      }
    }
  }

  // Priority 1: Check discount_code in creators
  const discountCodes = order.discount_codes as Array<{ code: string }> | undefined
  if (discountCodes && discountCodes.length > 0) {
    const codes = discountCodes.map(d => d.code.toUpperCase())

    const { data: creator } = await supabase
      .from('creators')
      .select('id, discount_code')
      .in('discount_code', codes)
      .maybeSingle()

    if (creator && creator.id) {
      logger.info({ requestId, discountCode: creator.discount_code, creatorId: creator.id }, 'Attribution found via discount_code (P1)')
      return {
        creatorId: creator.id,
        routineId: null,
        routineVariant: null,
        attributionSource: 'discount_code',
        attributionPriority: 1,
      }
    }
  }

  logger.info({ requestId, orderId: order.id }, 'No attribution found for order')
  return result
}

/**
 * Check idempotency to prevent duplicate processing
 */
async function checkIdempotency(
    supabase: any,
  idempotencyKey: string,
  operationType: string
): Promise<{ isNew: boolean; existingData?: Record<string, unknown> }> {
  const { data: existing } = await supabase
    .from('idempotency_keys')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle()

  if (existing) {
    if (existing.status === 'completed') {
      return { isNew: false, existingData: existing.response_data }
    }
    // If still processing or failed, we'll retry
  }

  // Create new idempotency record
  await supabase.from('idempotency_keys').upsert({
    idempotency_key: idempotencyKey,
    operation_type: operationType,
    resource_type: 'shopify_order',
    status: 'processing',
  }, { onConflict: 'idempotency_key' })

  return { isNew: true }
}

/**
 * Mark idempotency as completed
 */
async function completeIdempotency(
    supabase: any,
  idempotencyKey: string,
  responseData: Record<string, unknown>
): Promise<void> {
  await supabase
    .from('idempotency_keys')
    .update({
      status: 'completed',
      response_data: responseData,
      completed_at: new Date().toISOString(),
    })
    .eq('idempotency_key', idempotencyKey)
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID()

  try {
    // Get raw body for signature verification
    const rawBody = await request.text()
    const signature = request.headers.get('x-shopify-hmac-sha256')
    const topic = request.headers.get('x-shopify-topic')
    const shopDomain = request.headers.get('x-shopify-shop-domain')

    // Verify webhook authenticity
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET
    if (webhookSecret && signature) {
      const isValid = verifyShopifyWebhook(rawBody, signature, webhookSecret)
      if (!isValid) {
        logger.warn({ requestId, topic }, 'Invalid Shopify webhook signature')
        return Response.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const body = JSON.parse(rawBody)

    logger.info({ requestId, topic, shopDomain, orderId: body.id }, 'Shopify webhook received')

    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Handle different webhook topics
    switch (topic) {
      case 'orders/create':
      case 'orders/updated':
        await handleOrderWebhook(supabase, body, requestId)
        break

      case 'orders/paid':
        await handleOrderPaid(supabase, body, requestId)
        break

      case 'checkouts/create':
      case 'checkouts/update':
        await handleCheckoutWebhook(supabase, body, requestId)
        break

      case 'refunds/create':
        await handleRefundWebhook(supabase, body, requestId)
        break

      default:
        logger.info({ requestId, topic }, 'Unhandled webhook topic')
    }

    return Response.json({ success: true, requestId })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error({ requestId, error: errorMessage }, 'Shopify webhook error')
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function handleOrderWebhook(supabase: any, order: Record<string, unknown>, requestId: string) {
  // Find attribution using cascade logic
  const attribution = await findAttribution(supabase, order, requestId)

  // Upsert order
  const { error } = await supabase.from('orders').upsert({
    shopify_order_id: String(order.id),
    order_number: order.order_number,
    customer_email: (order.customer as Record<string, unknown>)?.email || order.email,
    total_amount: parseFloat(order.total_price as string),
    discount_code: (order.discount_codes as Array<{ code: string }>)?.[0]?.code || null,
    creator_id: attribution.creatorId,
    routine_id: attribution.routineId,
    routine_variant: attribution.routineVariant,
    status: 'pending',
    order_date: order.created_at,
  }, {
    onConflict: 'shopify_order_id'
  })

  if (error) {
    logger.error({ requestId, orderId: order.id, error: error.message }, 'Failed to upsert order')
  } else {
    logger.info({
      requestId,
      orderId: order.id,
      attribution: attribution.attributionSource,
      creatorId: attribution.creatorId
    }, 'Order upserted successfully')
  }
}

async function handleOrderPaid(supabase: any, order: Record<string, unknown>, requestId: string) {
  const shopifyOrderId = String(order.id)
  const idempotencyKey = `order_paid_${shopifyOrderId}`

  // Check idempotency
  const { isNew, existingData } = await checkIdempotency(supabase, idempotencyKey, 'webhook_shopify_order')

  if (!isNew) {
    logger.info({ requestId, orderId: shopifyOrderId }, 'Order already processed (idempotent)')
    return existingData
  }

  try {
    // Find attribution using cascade logic
    const attribution = await findAttribution(supabase, order, requestId)

    if (!attribution.creatorId) {
      logger.info({ requestId, orderId: shopifyOrderId }, 'No creator attribution, skipping commission')
      await completeIdempotency(supabase, idempotencyKey, { skipped: true, reason: 'no_attribution' })
      return
    }

    // First, upsert the order
    const { data: orderRecord, error: orderError } = await supabase
      .from('orders')
      .upsert({
        shopify_order_id: shopifyOrderId,
        order_number: order.order_number,
        customer_email: (order.customer as Record<string, unknown>)?.email || order.email,
        total_amount: parseFloat(order.total_price as string),
        discount_code: (order.discount_codes as Array<{ code: string }>)?.[0]?.code || null,
        creator_id: attribution.creatorId,
        routine_id: attribution.routineId,
        routine_variant: attribution.routineVariant,
        status: 'confirmed',
        order_date: order.created_at,
      }, {
        onConflict: 'shopify_order_id'
      })
      .select('id')
      .single()

    if (orderError) {
      throw new Error(`Failed to upsert order: ${orderError.message}`)
    }

    // Get creator's commission rate
    const { data: creator } = await supabase
      .from('creators')
      .select('commission_rate')
      .eq('id', attribution.creatorId)
      .single()

    const commissionRate = creator?.commission_rate || 0.10 // Default 10%
    const orderTotal = parseFloat(order.subtotal_price as string)
    const commissionAmount = orderTotal * commissionRate

    // Create commission record
    const { error: commissionError } = await supabase.from('commissions').insert({
      creator_id: attribution.creatorId,
      order_id: orderRecord.id,
      order_total: orderTotal,
      commission_rate: commissionRate,
      commission_amount: commissionAmount,
      routine_id: attribution.routineId,
      routine_variant: attribution.routineVariant,
      status: 'pending',
    })

    if (commissionError) {
      throw new Error(`Failed to create commission: ${commissionError.message}`)
    }

    const responseData = {
      orderId: orderRecord.id,
      shopifyOrderId,
      creatorId: attribution.creatorId,
      attributionSource: attribution.attributionSource,
      attributionPriority: attribution.attributionPriority,
      commissionAmount,
      commissionRate,
    }

    await completeIdempotency(supabase, idempotencyKey, responseData)

    logger.info({
      requestId,
      ...responseData
    }, 'Commission created successfully')

    // Optional: Send Slack notification
    await sendSlackNotification(order, attribution, commissionAmount, requestId)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error({ requestId, orderId: shopifyOrderId, error: errorMessage }, 'Failed to process order paid')

    // Mark idempotency as failed
    await supabase
      .from('idempotency_keys')
      .update({ status: 'failed', error_message: errorMessage })
      .eq('idempotency_key', idempotencyKey)

    throw error
  }
}

async function handleCheckoutWebhook(supabase: any, checkout: Record<string, unknown>, requestId: string) {
  // Track checkout for conversion analysis
  const cartId = checkout.cart_token || checkout.token

  // Check if this is a routine checkout
  const { data: routineCheckout } = await supabase
    .from('routine_checkouts')
    .select('*')
    .eq('cart_id', cartId)
    .single()

  if (routineCheckout) {
    logger.info({
      requestId,
      checkoutId: checkout.id,
      routineId: routineCheckout.routine_id,
      creatorId: routineCheckout.creator_id,
      variant: routineCheckout.variant
    }, 'Routine checkout tracked')
  }
}

async function handleRefundWebhook(supabase: any, refund: Record<string, unknown>, requestId: string) {
  // Update commission status if order is refunded
  const { error } = await supabase
    .from('commissions')
    .update({ status: 'canceled' })
    .eq('order_id', String(refund.order_id))

  if (error) {
    logger.error({ requestId, orderId: refund.order_id, error: error.message }, 'Failed to cancel commission')
  } else {
    logger.info({ requestId, orderId: refund.order_id }, 'Commission cancelled due to refund')
  }
}

/**
 * Send Slack notification for new commission
 */
async function sendSlackNotification(
  order: Record<string, unknown>,
  attribution: AttributionResult,
  commissionAmount: number,
  requestId: string
) {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!slackWebhookUrl) return

  try {
    const message = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'Nouvelle Commission Yeoskin',
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Commande:*\n#${order.order_number}`
            },
            {
              type: 'mrkdwn',
              text: `*Montant:*\n${order.total_price}EUR`
            },
            {
              type: 'mrkdwn',
              text: `*Commission:*\n${commissionAmount.toFixed(2)}EUR`
            },
            {
              type: 'mrkdwn',
              text: `*Attribution:*\n${attribution.attributionSource} (P${attribution.attributionPriority})`
            }
          ]
        }
      ]
    }

    await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })

    logger.info({ requestId, orderNumber: order.order_number }, 'Slack notification sent')
  } catch (error) {
    logger.warn({ requestId, error }, 'Failed to send Slack notification')
  }
}

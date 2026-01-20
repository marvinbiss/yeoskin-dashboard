import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

// Verify Shopify webhook signature
function verifyShopifyWebhook(body, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64')
  return hash === signature
}

export async function POST(request) {
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
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
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
    logger.error({ requestId, error: error.message }, 'Shopify webhook error')
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function handleOrderWebhook(supabase, order, requestId) {
  // Extract attribution from note_attributes or cart attributes
  const routineAttr = order.note_attributes?.find(a => a.name === 'routine_id')
  const creatorAttr = order.note_attributes?.find(a => a.name === 'creator_id')
  const variantAttr = order.note_attributes?.find(a => a.name === 'routine_variant')

  // Upsert order
  const { error } = await supabase.from('orders').upsert({
    shopify_order_id: order.id.toString(),
    order_number: order.order_number,
    email: order.email,
    total_price: parseFloat(order.total_price),
    subtotal_price: parseFloat(order.subtotal_price),
    currency: order.currency,
    financial_status: order.financial_status,
    fulfillment_status: order.fulfillment_status,
    routine_id: routineAttr?.value || null,
    creator_id: creatorAttr?.value || null,
    routine_variant: variantAttr?.value || null,
    line_items: order.line_items,
    customer: order.customer,
    created_at: order.created_at,
    updated_at: order.updated_at,
  }, {
    onConflict: 'shopify_order_id'
  })

  if (error) {
    logger.error({ requestId, orderId: order.id, error: error.message }, 'Failed to upsert order')
  } else {
    logger.info({ requestId, orderId: order.id }, 'Order upserted successfully')
  }
}

async function handleOrderPaid(supabase, order, requestId) {
  // Check for routine attribution
  const routineAttr = order.note_attributes?.find(a => a.name === 'routine_id')
  const creatorAttr = order.note_attributes?.find(a => a.name === 'creator_id')
  const variantAttr = order.note_attributes?.find(a => a.name === 'routine_variant')

  if (!creatorAttr?.value) {
    logger.info({ requestId, orderId: order.id }, 'No creator attribution, skipping commission')
    return
  }

  // Calculate commission (example: 10% of subtotal)
  const commissionRate = 0.10
  const commissionAmount = parseFloat(order.subtotal_price) * commissionRate

  // Create commission record
  const { error } = await supabase.from('commissions').insert({
    order_id: order.id.toString(),
    creator_id: creatorAttr.value,
    routine_id: routineAttr?.value || null,
    routine_variant: variantAttr?.value || null,
    order_total: parseFloat(order.total_price),
    commission_rate: commissionRate,
    commission_amount: commissionAmount,
    currency: order.currency,
    status: 'pending',
  })

  if (error) {
    logger.error({ requestId, orderId: order.id, error: error.message }, 'Failed to create commission')
  } else {
    logger.info({ requestId, orderId: order.id, commissionAmount }, 'Commission created')
  }
}

async function handleCheckoutWebhook(supabase, checkout, requestId) {
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

async function handleRefundWebhook(supabase, refund, requestId) {
  // Update commission status if order is refunded
  const { error } = await supabase
    .from('commissions')
    .update({ status: 'cancelled', cancelled_reason: 'refund' })
    .eq('order_id', refund.order_id.toString())

  if (error) {
    logger.error({ requestId, orderId: refund.order_id, error: error.message }, 'Failed to cancel commission')
  } else {
    logger.info({ requestId, orderId: refund.order_id }, 'Commission cancelled due to refund')
  }
}

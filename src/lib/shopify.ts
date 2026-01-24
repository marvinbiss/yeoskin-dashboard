/**
 * Shopify Storefront API Client with Circuit Breaker
 */

import { shopifyCircuitBreaker, CircuitOpenError } from './circuit-breaker'
import { logger } from './logger'

const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN || 'vqgpah-fb.myshopify.com'
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-01'
const SHOPIFY_STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN

const SHOPIFY_ENDPOINT = `https://${SHOPIFY_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`

interface ShopifyError {
  message: string
  field?: string[]
}

interface CartCreateResult {
  cart: {
    id: string
    checkoutUrl: string
  } | null
  userErrors: ShopifyError[]
}

interface VariantValidationResult {
  valid: boolean
  invalidIds: number[]
  errors: string[]
}

/**
 * Execute a Shopify Storefront API query with circuit breaker
 */
export async function shopifyQuery<T>(
  query: string,
  variables: Record<string, unknown>,
  requestId: string
): Promise<T> {
  if (!SHOPIFY_STOREFRONT_TOKEN) {
    throw new Error('SHOPIFY_STOREFRONT_TOKEN not configured')
  }

  return shopifyCircuitBreaker.execute(async () => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      logger.info({ requestId, query: query.slice(0, 100) }, 'Shopify API request')

      const response = await fetch(SHOPIFY_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error(
          { requestId, status: response.status, error: errorText },
          'Shopify API HTTP error'
        )
        throw new Error(`Shopify API error: ${response.status}`)
      }

      const result = await response.json()

      if (result.errors) {
        logger.error({ requestId, errors: result.errors }, 'Shopify GraphQL errors')
        throw new Error(result.errors[0]?.message || 'Shopify GraphQL error')
      }

      logger.info({ requestId }, 'Shopify API request successful')
      return result.data as T

    } finally {
      clearTimeout(timeoutId)
    }
  })
}

/**
 * Validate that variant IDs exist and are purchasable
 */
export async function validateVariantIds(
  variantIds: number[],
  requestId: string
): Promise<VariantValidationResult> {
  const query = `
    query validateVariants($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on ProductVariant {
          id
          availableForSale
        }
      }
    }
  `

  const gids = variantIds.map(id => `gid://shopify/ProductVariant/${id}`)

  try {
    const result = await shopifyQuery<{ nodes: Array<{
      id: string
      availableForSale: boolean
    } | null> }>(query, { ids: gids }, requestId)

    const invalidIds: number[] = []
    const errors: string[] = []

    variantIds.forEach((id, index) => {
      const node = result.nodes[index]

      if (!node) {
        invalidIds.push(id)
        errors.push(`Variant ${id} does not exist`)
      } else if (!node.availableForSale) {
        invalidIds.push(id)
        errors.push(`Variant ${id} is not available for sale`)
      }
    })

    return {
      valid: invalidIds.length === 0,
      invalidIds,
      errors,
    }

  } catch (error) {
    // If circuit is open, we can't validate - allow the request to proceed
    if (error instanceof CircuitOpenError) {
      logger.warn({ requestId }, 'Circuit open, skipping variant validation')
      return { valid: true, invalidIds: [], errors: [] }
    }
    throw error
  }
}

/**
 * Create a cart with the given variant IDs
 */
export async function createCart(
  variantIds: number[],
  attributes: Array<{ key: string; value: string }>,
  note: string,
  requestId: string,
  discountCodes?: string[]
): Promise<CartCreateResult> {
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
        quantity: 1,
      })),
      attributes,
      note,
      ...(discountCodes?.length ? { discountCodes } : {}),
    },
  }

  const result = await shopifyQuery<{ cartCreate: CartCreateResult }>(
    query,
    variables,
    requestId
  )

  return result.cartCreate
}

/**
 * Get circuit breaker stats for monitoring
 */
export function getShopifyCircuitStats() {
  return shopifyCircuitBreaker.getStats()
}

export { CircuitOpenError }

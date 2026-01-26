/**
 * Shopify Admin API Client
 * Used for administrative operations like creating discount codes
 */

const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN || 'vqgpah-fb.myshopify.com'
const SHOPIFY_ADMIN_API_VERSION = process.env.SHOPIFY_ADMIN_API_VERSION || '2024-01'
const SHOPIFY_ADMIN_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN

const ADMIN_API_ENDPOINT = `https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/graphql.json`

interface ShopifyAdminError {
  message: string
  field?: string[]
}

interface DiscountCodeCreateResult {
  success: boolean
  discountCode?: string
  shopifyCodeId?: string
  errors?: string[]
}

/**
 * Execute a Shopify Admin API GraphQL query
 */
async function shopifyAdminQuery<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  if (!SHOPIFY_ADMIN_ACCESS_TOKEN) {
    throw new Error('SHOPIFY_ADMIN_ACCESS_TOKEN not configured')
  }

  const response = await fetch(ADMIN_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_ACCESS_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[Shopify Admin] HTTP error:', response.status, errorText)
    throw new Error(`Shopify Admin API error: ${response.status}`)
  }

  const result = await response.json()

  if (result.errors) {
    console.error('[Shopify Admin] GraphQL errors:', result.errors)
    throw new Error(result.errors[0]?.message || 'Shopify Admin GraphQL error')
  }

  return result.data as T
}

/**
 * Create a discount code on Shopify for a creator
 * Creates a percentage-based discount code with the given parameters
 */
export async function createShopifyDiscountCode(params: {
  code: string
  discountPercent: number
  title?: string
}): Promise<DiscountCodeCreateResult> {
  const { code, discountPercent, title } = params

  // First, create a Price Rule (discount configuration)
  const createPriceRuleMutation = `
    mutation priceRuleCreate($priceRule: PriceRuleInput!) {
      priceRuleCreate(priceRule: $priceRule) {
        priceRule {
          id
          title
        }
        priceRuleUserErrors {
          field
          message
        }
      }
    }
  `

  const priceRuleVariables = {
    priceRule: {
      title: title || `Créateur - ${code}`,
      target: 'LINE_ITEM',
      allocationMethod: 'ACROSS',
      valueType: 'PERCENTAGE',
      value: -discountPercent, // Negative value for discount
      customerSelection: 'ALL',
      oncePerCustomer: false,
      usageLimit: null, // Unlimited uses
      startsAt: new Date().toISOString(),
      endsAt: null, // No end date
    },
  }

  try {
    // Create price rule
    const priceRuleResult = await shopifyAdminQuery<{
      priceRuleCreate: {
        priceRule: { id: string; title: string } | null
        priceRuleUserErrors: ShopifyAdminError[]
      }
    }>(createPriceRuleMutation, priceRuleVariables)

    if (priceRuleResult.priceRuleCreate.priceRuleUserErrors.length > 0) {
      const errors = priceRuleResult.priceRuleCreate.priceRuleUserErrors.map(e => e.message)
      console.error('[Shopify Admin] Price rule errors:', errors)
      return { success: false, errors }
    }

    const priceRuleId = priceRuleResult.priceRuleCreate.priceRule?.id
    if (!priceRuleId) {
      return { success: false, errors: ['Failed to create price rule'] }
    }

    // Now create the discount code linked to the price rule
    const createDiscountCodeMutation = `
      mutation priceRuleDiscountCodeCreate($priceRuleId: ID!, $code: String!) {
        priceRuleDiscountCodeCreate(priceRuleId: $priceRuleId, code: $code) {
          priceRuleDiscountCode {
            id
            code
          }
          priceRuleUserErrors {
            field
            message
          }
        }
      }
    `

    const discountCodeResult = await shopifyAdminQuery<{
      priceRuleDiscountCodeCreate: {
        priceRuleDiscountCode: { id: string; code: string } | null
        priceRuleUserErrors: ShopifyAdminError[]
      }
    }>(createDiscountCodeMutation, { priceRuleId, code })

    if (discountCodeResult.priceRuleDiscountCodeCreate.priceRuleUserErrors.length > 0) {
      const errors = discountCodeResult.priceRuleDiscountCodeCreate.priceRuleUserErrors.map(e => e.message)
      console.error('[Shopify Admin] Discount code errors:', errors)
      return { success: false, errors }
    }

    const discountCodeData = discountCodeResult.priceRuleDiscountCodeCreate.priceRuleDiscountCode
    if (!discountCodeData) {
      return { success: false, errors: ['Failed to create discount code'] }
    }

    console.info('[Shopify Admin] Discount code created:', discountCodeData.code)

    return {
      success: true,
      discountCode: discountCodeData.code,
      shopifyCodeId: discountCodeData.id,
    }
  } catch (error) {
    const err = error as Error
    console.error('[Shopify Admin] Create discount error:', err)
    return {
      success: false,
      errors: [err.message],
    }
  }
}

/**
 * Alternative: Create discount using Discount Code Basic Create (newer API)
 * This is the recommended approach for Shopify 2024+
 */
export async function createShopifyDiscountCodeBasic(params: {
  code: string
  discountPercent: number
  title?: string
  creatorEmail?: string
}): Promise<DiscountCodeCreateResult> {
  const { code, discountPercent, title, creatorEmail } = params

  const mutation = `
    mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
      discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
        codeDiscountNode {
          id
          codeDiscount {
            ... on DiscountCodeBasic {
              title
              codes(first: 1) {
                nodes {
                  code
                  id
                }
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const variables = {
    basicCodeDiscount: {
      title: title || `Créateur - ${code}`,
      code: code,
      startsAt: new Date().toISOString(),
      endsAt: null,
      usageLimit: null,
      appliesOncePerCustomer: false,
      customerSelection: {
        all: true,
      },
      customerGets: {
        value: {
          percentage: discountPercent / 100, // 0.10 for 10%
        },
        items: {
          all: true,
        },
      },
      combinesWith: {
        orderDiscounts: false,
        productDiscounts: false,
        shippingDiscounts: true,
      },
      // Store creator email as metafield for tracking
      ...(creatorEmail && {
        metafields: [
          {
            namespace: 'yeoskin',
            key: 'creator_email',
            value: creatorEmail,
            type: 'single_line_text_field',
          },
        ],
      }),
    },
  }

  try {
    const result = await shopifyAdminQuery<{
      discountCodeBasicCreate: {
        codeDiscountNode: {
          id: string
          codeDiscount: {
            title: string
            codes: {
              nodes: Array<{ code: string; id: string }>
            }
          }
        } | null
        userErrors: ShopifyAdminError[]
      }
    }>(mutation, variables)

    if (result.discountCodeBasicCreate.userErrors.length > 0) {
      const errors = result.discountCodeBasicCreate.userErrors.map(e => e.message)
      console.error('[Shopify Admin] Discount code basic errors:', errors)
      return { success: false, errors }
    }

    const codeNode = result.discountCodeBasicCreate.codeDiscountNode
    if (!codeNode) {
      return { success: false, errors: ['Failed to create discount code'] }
    }

    const createdCode = codeNode.codeDiscount.codes.nodes[0]
    console.info('[Shopify Admin] Discount code created:', createdCode?.code)

    return {
      success: true,
      discountCode: createdCode?.code || code,
      shopifyCodeId: codeNode.id,
    }
  } catch (error) {
    const err = error as Error
    console.error('[Shopify Admin] Create discount basic error:', err)
    return {
      success: false,
      errors: [err.message],
    }
  }
}

/**
 * Check if a discount code already exists on Shopify
 */
export async function checkDiscountCodeExists(code: string): Promise<boolean> {
  const query = `
    query codeDiscountNodeByCode($code: String!) {
      codeDiscountNodeByCode(code: $code) {
        id
      }
    }
  `

  try {
    const result = await shopifyAdminQuery<{
      codeDiscountNodeByCode: { id: string } | null
    }>(query, { code })

    return result.codeDiscountNodeByCode !== null
  } catch (error) {
    console.error('[Shopify Admin] Check discount code error:', error)
    return false
  }
}

/**
 * Delete a discount code from Shopify
 */
export async function deleteShopifyDiscountCode(shopifyCodeId: string): Promise<boolean> {
  const mutation = `
    mutation discountCodeDelete($id: ID!) {
      discountCodeDelete(id: $id) {
        deletedCodeDiscountId
        userErrors {
          field
          message
        }
      }
    }
  `

  try {
    const result = await shopifyAdminQuery<{
      discountCodeDelete: {
        deletedCodeDiscountId: string | null
        userErrors: ShopifyAdminError[]
      }
    }>(mutation, { id: shopifyCodeId })

    if (result.discountCodeDelete.userErrors.length > 0) {
      console.error('[Shopify Admin] Delete errors:', result.discountCodeDelete.userErrors)
      return false
    }

    return result.discountCodeDelete.deletedCodeDiscountId !== null
  } catch (error) {
    console.error('[Shopify Admin] Delete discount code error:', error)
    return false
  }
}

/**
 * Check if Admin API is configured
 */
export function isShopifyAdminConfigured(): boolean {
  return !!SHOPIFY_ADMIN_ACCESS_TOKEN
}

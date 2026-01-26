-- Migration: Add Shopify discount tracking to creators
-- This allows tracking which Shopify discount code ID is associated with each creator

-- Add shopify_discount_id column to creators table
ALTER TABLE creators
ADD COLUMN IF NOT EXISTS shopify_discount_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_creators_shopify_discount_id
ON creators(shopify_discount_id)
WHERE shopify_discount_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN creators.shopify_discount_id IS
'Shopify GraphQL ID of the discount code (gid://shopify/DiscountCodeNode/...)';

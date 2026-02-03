/**
 * Tests for ratelimit.ts
 * Note: Tests that require NextRequest run in integration tests
 */

describe('ratelimit', () => {
  describe('module exports', () => {
    it('should export getClientIp function', async () => {
      const ratelimit = await import('../ratelimit')
      expect(typeof ratelimit.getClientIp).toBe('function')
    })

    it('should export checkoutRatelimit', async () => {
      const ratelimit = await import('../ratelimit')
      expect(ratelimit.checkoutRatelimit).toBeDefined()
    })

    it('should export rateLimitResponse function', async () => {
      const ratelimit = await import('../ratelimit')
      expect(typeof ratelimit.rateLimitResponse).toBe('function')
    })
  })
})

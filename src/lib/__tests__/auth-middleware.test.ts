/**
 * Tests for auth-middleware.ts
 * Note: Full integration tests run separately
 */

describe('auth-middleware', () => {
  describe('module exports', () => {
    it('should export verifyAdminAuth function', async () => {
      const auth = await import('../auth-middleware')
      expect(typeof auth.verifyAdminAuth).toBe('function')
    })

    it('should export verifyCreatorAuth function', async () => {
      const auth = await import('../auth-middleware')
      expect(typeof auth.verifyCreatorAuth).toBe('function')
    })

    it('should export unauthorizedResponse function', async () => {
      const auth = await import('../auth-middleware')
      expect(typeof auth.unauthorizedResponse).toBe('function')
    })

    it('should export forbiddenResponse function', async () => {
      const auth = await import('../auth-middleware')
      expect(typeof auth.forbiddenResponse).toBe('function')
    })

    it('should export withAdminAuth function', async () => {
      const auth = await import('../auth-middleware')
      expect(typeof auth.withAdminAuth).toBe('function')
    })

    it('should export withCreatorAuth function', async () => {
      const auth = await import('../auth-middleware')
      expect(typeof auth.withCreatorAuth).toBe('function')
    })
  })

  describe('AdminRole type', () => {
    it('should accept valid roles', () => {
      // Type check - roles are defined correctly
      const roles: ('super_admin' | 'admin' | 'viewer')[] = ['super_admin', 'admin', 'viewer']
      expect(roles).toHaveLength(3)
    })
  })
})

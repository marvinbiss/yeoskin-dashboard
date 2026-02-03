/**
 * Tests for logger.ts
 */

import { logger } from '../logger'

describe('logger', () => {
  it('should be defined', () => {
    expect(logger).toBeDefined()
  })

  it('should have info method', () => {
    expect(typeof logger.info).toBe('function')
  })

  it('should have error method', () => {
    expect(typeof logger.error).toBe('function')
  })

  it('should have warn method', () => {
    expect(typeof logger.warn).toBe('function')
  })

  it('should have debug method', () => {
    expect(typeof logger.debug).toBe('function')
  })

  it('should log info without throwing', () => {
    expect(() => {
      logger.info({ test: true }, 'Test message')
    }).not.toThrow()
  })

  it('should log error without throwing', () => {
    expect(() => {
      logger.error({ error: 'test error' }, 'Error message')
    }).not.toThrow()
  })
})

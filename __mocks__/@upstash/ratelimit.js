// Mock for @upstash/ratelimit
class Ratelimit {
  constructor() {}

  async limit() {
    return {
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60000,
    }
  }

  static slidingWindow() {
    return {}
  }
}

module.exports = { Ratelimit }

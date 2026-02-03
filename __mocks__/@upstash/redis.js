// Mock for @upstash/redis
class Redis {
  constructor() {}

  async get() { return null }
  async set() { return 'OK' }
  async incr() { return 1 }
  async expire() { return 1 }
}

module.exports = { Redis }

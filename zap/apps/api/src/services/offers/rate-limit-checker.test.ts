import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Redis } from 'ioredis'
import { RateLimitChecker } from './rate-limit-checker.js'

describe('RateLimitChecker', () => {
  let checker: RateLimitChecker
  let mockRedis: Record<string, unknown>

  beforeEach(() => {
    checker = new RateLimitChecker()
    mockRedis = {}
  })

  // Mock Redis get/set/incr/expire
  const createMockRedis = (initial: Record<string, string> = {}) => {
    const data = { ...initial }
    return {
      get: vi.fn((key: string) => Promise.resolve(data[key] ?? null)),
      set: vi.fn((key: string, value: string) => {
        data[key] = value
        return Promise.resolve('OK')
      }),
      incr: vi.fn((key: string) => {
        const current = parseInt(data[key] as string) || 0
        const next = current + 1
        data[key] = next.toString()
        return Promise.resolve(next)
      }),
      expire: vi.fn((key: string) => Promise.resolve(1)),
    } as unknown as Redis
  }

  describe('AC-048.2: Per-group rate limiting (1 offer / 2 min)', () => {
    it('allows first offer to a group', async () => {
      const redis = createMockRedis()

      const result = await checker.checkGroupLimit('group-123', redis)

      expect(result.allowed).toBe(true)
      expect(result.nextAvailableAt).toEqual(expect.any(Date))
    })

    it('blocks second offer within 2 minutes', async () => {
      const now = Date.now()
      const redis = createMockRedis({
        'offer:sent:group-123': now.toString(),
      })

      const result = await checker.checkGroupLimit('group-123', redis)

      expect(result.allowed).toBe(false)
      expect(result.nextAvailableAt.getTime()).toBeGreaterThan(now)
    })

    it('allows second offer after 2 minutes', async () => {
      const twoMinutesAgo = Date.now() - 2 * 60 * 1000 - 1000 // 2 min + 1 sec ago
      const redis = createMockRedis({
        'offer:sent:group-123': twoMinutesAgo.toString(),
      })

      const result = await checker.checkGroupLimit('group-123', redis)

      expect(result.allowed).toBe(true)
    })

    it('calculates correct nextAvailableAt time', async () => {
      const lastSent = Date.now() - 60 * 1000 // 1 min ago
      const redis = createMockRedis({
        'offer:sent:group-123': lastSent.toString(),
      })

      const result = await checker.checkGroupLimit('group-123', redis)

      expect(result.allowed).toBe(false)
      // Next available should be ~1 min in future (2 min - 1 min elapsed)
      const nextAvailableTime = result.nextAvailableAt.getTime()
      const minuteFromNow = Date.now() + 60 * 1000
      expect(nextAvailableTime).toBeGreaterThan(Date.now())
      expect(nextAvailableTime).toBeLessThan(minuteFromNow + 5000) // 5s margin
    })

    it('works independently for different groups', async () => {
      const now = Date.now()
      const redis = createMockRedis({
        'offer:sent:group-111': now.toString(),
        'offer:sent:group-222': (now - 3 * 60 * 1000).toString(), // 3 min ago
      })

      const result1 = await checker.checkGroupLimit('group-111', redis)
      const result2 = await checker.checkGroupLimit('group-222', redis)

      expect(result1.allowed).toBe(false) // Within 2 min
      expect(result2.allowed).toBe(true) // After 2 min
    })
  })

  describe('AC-048.3: Per-connection rate limiting (3 offers / 5 min)', () => {
    it('allows up to 3 offers in 5 minute window', async () => {
      const redis = createMockRedis()

      const result1 = await checker.checkConnectionLimit('conn-123', redis)
      const result2 = await checker.checkConnectionLimit('conn-123', redis)
      const result3 = await checker.checkConnectionLimit('conn-123', redis)

      expect(result1.allowed).toBe(true)
      expect(result1.backoffMinutes).toBe(0)
      expect(result2.allowed).toBe(true)
      expect(result2.backoffMinutes).toBe(0)
      expect(result3.allowed).toBe(true)
      expect(result3.backoffMinutes).toBe(0)
    })

    it('blocks 4th offer and applies exponential backoff', async () => {
      const redis = createMockRedis()

      await checker.checkConnectionLimit('conn-123', redis)
      await checker.checkConnectionLimit('conn-123', redis)
      await checker.checkConnectionLimit('conn-123', redis)
      const result4 = await checker.checkConnectionLimit('conn-123', redis)

      expect(result4.allowed).toBe(false)
      expect(result4.backoffMinutes).toBe(5) // (4 - 3) * 5
    })

    it('increases backoff exponentially for 5th, 6th offers', async () => {
      const redis = createMockRedis()

      await checker.checkConnectionLimit('conn-123', redis)
      await checker.checkConnectionLimit('conn-123', redis)
      await checker.checkConnectionLimit('conn-123', redis)
      await checker.checkConnectionLimit('conn-123', redis)

      const result5 = await checker.checkConnectionLimit('conn-123', redis)
      expect(result5.allowed).toBe(false)
      expect(result5.backoffMinutes).toBe(10) // (5 - 3) * 5

      const result6 = await checker.checkConnectionLimit('conn-123', redis)
      expect(result6.allowed).toBe(false)
      expect(result6.backoffMinutes).toBe(15) // (6 - 3) * 5
    })

    it('sets 5 minute window expiration on first call', async () => {
      const redis = createMockRedis()

      await checker.checkConnectionLimit('conn-123', redis)

      expect(redis.expire).toHaveBeenCalledWith(
        'offer:sent:conn-123:last5m',
        5 * 60
      )
    })

    it('does not reset window on subsequent calls', async () => {
      const redis = createMockRedis()

      await checker.checkConnectionLimit('conn-123', redis)
      const expireCalls = (redis.expire as any).mock.calls.length

      await checker.checkConnectionLimit('conn-123', redis)
      await checker.checkConnectionLimit('conn-123', redis)

      // expire() called only once (on first call)
      expect((redis.expire as any).mock.calls.length).toBe(expireCalls)
    })

    it('works independently for different connections', async () => {
      const redis = createMockRedis()

      const conn1_1 = await checker.checkConnectionLimit('conn-111', redis)
      const conn1_2 = await checker.checkConnectionLimit('conn-111', redis)
      const conn1_3 = await checker.checkConnectionLimit('conn-111', redis)
      const conn1_4 = await checker.checkConnectionLimit('conn-111', redis)

      const conn2_1 = await checker.checkConnectionLimit('conn-222', redis)

      expect(conn1_4.allowed).toBe(false) // 4th offer on conn-111
      expect(conn2_1.allowed).toBe(true) // 1st offer on conn-222 (different limit)
    })
  })

  describe('AC-048.5: Redis tracking with auto-expiration', () => {
    it('stores group send timestamp with 1 hour expiration', async () => {
      const redis = createMockRedis()

      await checker.recordGroupSend('group-123', redis)

      expect(redis.set).toHaveBeenCalledWith(
        'offer:sent:group-123',
        expect.any(String),
        'EX',
        3600
      )
    })

    it('stores timestamp as current time (approximate)', async () => {
      const redis = createMockRedis()
      const beforeCall = Date.now()

      await checker.recordGroupSend('group-123', redis)

      const storedValue = (redis.set as any).mock.calls[0][1]
      const storedTime = parseInt(storedValue)
      const afterCall = Date.now()

      expect(storedTime).toBeGreaterThanOrEqual(beforeCall - 1000)
      expect(storedTime).toBeLessThanOrEqual(afterCall + 1000)
    })

    it('uses correct key format for group tracking', async () => {
      const redis = createMockRedis()

      await checker.recordGroupSend('group-456', redis)

      expect(redis.set).toHaveBeenCalledWith(
        'offer:sent:group-456',
        expect.any(String),
        'EX',
        3600
      )
    })

    it('uses correct key format for connection window', async () => {
      const redis = createMockRedis()

      await checker.checkConnectionLimit('conn-789', redis)

      expect(redis.incr).toHaveBeenCalledWith('offer:sent:conn-789:last5m')
    })
  })

  describe('Integration scenarios', () => {
    it('handles multiple groups for same connection independently', async () => {
      const redis = createMockRedis()

      // Group 1: Allow first, record it, then try second
      const g1_1 = await checker.checkGroupLimit('group-1', redis)
      expect(g1_1.allowed).toBe(true)
      await checker.recordGroupSend('group-1', redis)

      const g1_2 = await checker.checkGroupLimit('group-1', redis)
      expect(g1_2.allowed).toBe(false) // Group 1 rate limited (sent < 2 min ago)

      // Group 2: Allow first, record it, then try second
      const g2_1 = await checker.checkGroupLimit('group-2', redis)
      expect(g2_1.allowed).toBe(true) // Different group
      await checker.recordGroupSend('group-2', redis)

      const g2_2 = await checker.checkGroupLimit('group-2', redis)
      expect(g2_2.allowed).toBe(false) // Group 2 rate limited

      // Connection limit (spans all groups)
      const c1_1 = await checker.checkConnectionLimit('conn-1', redis)
      const c1_2 = await checker.checkConnectionLimit('conn-1', redis)

      expect(c1_1.allowed).toBe(true)
      expect(c1_2.allowed).toBe(true) // Still under 3 per connection
    })

    it('allows multiple offers if rate limits respected', async () => {
      const redis = createMockRedis()

      // Offer 1 to group A
      const offer1 = await checker.checkGroupLimit('group-a', redis)
      expect(offer1.allowed).toBe(true)

      // Offer 2 to group B (different group)
      const offer2 = await checker.checkGroupLimit('group-b', redis)
      expect(offer2.allowed).toBe(true)

      // Offer 3 to group C (different group)
      const offer3 = await checker.checkGroupLimit('group-c', redis)
      expect(offer3.allowed).toBe(true)

      // All allowed because different groups
      expect([offer1, offer2, offer3].every((o) => o.allowed)).toBe(true)
    })
  })
})

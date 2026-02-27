import type { Redis } from 'ioredis'

/**
 * RateLimitChecker — AC-048.2 & AC-048.3: Per-group and per-connection rate limiting
 *
 * Two separate rate limit checks:
 * 1. Per-group: 1 offer per 2 minutes (AC-048.2)
 * 2. Per-connection: 3 offers per 5 minutes (AC-048.3)
 */
export class RateLimitChecker {
  /**
   * Check if group has capacity to receive an offer
   * AC-048.2: Max 1 offer per 2 minutes per group
   *
   * @param groupId WhatsApp group ID
   * @param redis Redis client
   * @returns { allowed, nextAvailableAt }
   */
  async checkGroupLimit(
    groupId: string,
    redis: Redis
  ): Promise<{ allowed: boolean; nextAvailableAt: Date }> {
    const key = `offer:sent:${groupId}`
    const lastSentAt = await redis.get(key)

    if (!lastSentAt) {
      // First offer to this group — always allowed
      return { allowed: true, nextAvailableAt: new Date() }
    }

    const elapsed = Date.now() - parseInt(lastSentAt)
    const minInterval = 2 * 60 * 1000 // 2 min

    if (elapsed < minInterval) {
      const nextAt = new Date(parseInt(lastSentAt) + minInterval)
      return { allowed: false, nextAvailableAt: nextAt }
    }

    return { allowed: true, nextAvailableAt: new Date() }
  }

  /**
   * Check if connection (WhatsApp number) has capacity
   * AC-048.3: Max 3 offers per 5 minutes per connection
   *
   * @param connectionId WhatsApp connection ID
   * @param redis Redis client
   * @returns { allowed, backoffMinutes }
   */
  async checkConnectionLimit(
    connectionId: string,
    redis: Redis
  ): Promise<{ allowed: boolean; backoffMinutes: number }> {
    const key = `offer:sent:${connectionId}:last5m`
    const count = await redis.incr(key)

    if (count === 1) {
      // First offer in this 5-minute window
      await redis.expire(key, 5 * 60) // 5 min window
    }

    const maxPerWindow = 3
    if (count > maxPerWindow) {
      // Exponential backoff: (count - maxPerWindow) * 5 min
      const backoffMinutes = (count - maxPerWindow) * 5
      return { allowed: false, backoffMinutes }
    }

    return { allowed: true, backoffMinutes: 0 }
  }

  /**
   * Update last sent timestamp for a group
   * Called after successfully scheduling send
   *
   * @param groupId Group ID
   * @param redis Redis client
   */
  async recordGroupSend(groupId: string, redis: Redis): Promise<void> {
    const key = `offer:sent:${groupId}`
    // Set to current timestamp, with 1 hour expiration
    await redis.set(key, Date.now().toString(), 'EX', 3600)
  }
}

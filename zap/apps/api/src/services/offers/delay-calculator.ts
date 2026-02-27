/**
 * DelayCalculator — AC-048.4: Delay calculation with jitter
 *
 * Calculates deterministic delay per (offerId, groupId) to prevent pattern detection.
 * Base delay: 2 minutes
 * Jitter: 0-30 seconds (pseudorandom but deterministic)
 */
export class DelayCalculator {
  /**
   * Calculate delay for an offer in a specific group
   * @param groupId Group ID where offer will be sent
   * @param offerId Unique offer ID
   * @returns Delay in milliseconds
   */
  calculateDelay(groupId: string, offerId: string): number {
    const baseDelay = 2 * 60 * 1000 // 2 min

    // Jitter: pseudo-random but deterministic per (offerId, groupId)
    const seed = offerId + groupId
    const jitter = this.pseudoRandom(seed) * 30 * 1000 // 0-30s

    return baseDelay + jitter
  }

  /**
   * Pseudorandom hash-based generator (deterministic)
   * Same input always produces same output
   * @param seed Input string
   * @returns Number between 0 and 1
   */
  private pseudoRandom(seed: string): number {
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash % 1000) / 1000 // 0-1
  }
}

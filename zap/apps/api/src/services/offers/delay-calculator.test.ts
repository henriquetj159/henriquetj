import { describe, it, expect } from 'vitest'
import { DelayCalculator } from './delay-calculator.js'

describe('DelayCalculator', () => {
  const calculator = new DelayCalculator()

  describe('AC-048.4: Delay calculation with jitter', () => {
    it('returns base delay of 2 minutes', () => {
      const offerId = 'offer-123'
      const groupId = 'group-456'
      const delay = calculator.calculateDelay(groupId, offerId)

      const twoMinutes = 2 * 60 * 1000
      expect(delay).toBeGreaterThanOrEqual(twoMinutes)
    })

    it('adds jitter between 0 and 30 seconds', () => {
      const offerId = 'offer-123'
      const groupId = 'group-456'
      const delay = calculator.calculateDelay(groupId, offerId)

      const twoMinutes = 2 * 60 * 1000
      const twoMinutesThirty = 2 * 60 * 1000 + 30 * 1000

      expect(delay).toBeGreaterThanOrEqual(twoMinutes)
      expect(delay).toBeLessThanOrEqual(twoMinutesThirty)
    })

    it('produces deterministic results for same input', () => {
      const offerId = 'offer-123'
      const groupId = 'group-456'

      const delay1 = calculator.calculateDelay(groupId, offerId)
      const delay2 = calculator.calculateDelay(groupId, offerId)

      expect(delay1).toBe(delay2)
    })

    it('produces different jitter for different offers', () => {
      const groupId = 'group-456'

      const delay1 = calculator.calculateDelay(groupId, 'offer-111')
      const delay2 = calculator.calculateDelay(groupId, 'offer-222')

      // Very unlikely to be identical (though possible due to hash collision)
      expect(delay1).not.toBe(delay2)
    })

    it('produces different jitter for different groups', () => {
      const offerId = 'offer-123'

      const delay1 = calculator.calculateDelay('group-111', offerId)
      const delay2 = calculator.calculateDelay('group-222', offerId)

      expect(delay1).not.toBe(delay2)
    })

    it('handles long offerId and groupId strings', () => {
      const longOfferId = 'offer-' + 'x'.repeat(100)
      const longGroupId = 'group-' + 'y'.repeat(100)

      const delay = calculator.calculateDelay(longGroupId, longOfferId)

      const twoMinutes = 2 * 60 * 1000
      const twoMinutesThirty = 2 * 60 * 1000 + 30 * 1000

      expect(delay).toBeGreaterThanOrEqual(twoMinutes)
      expect(delay).toBeLessThanOrEqual(twoMinutesThirty)
    })

    it('prevents pattern detection via pseudorandom jitter', () => {
      const groupId = 'group-456'

      // Generate 10 delays for different offers
      const delays = Array.from({ length: 10 }, (_, i) =>
        calculator.calculateDelay(groupId, `offer-${i}`)
      )

      // All should be in [2min, 2:30] range
      delays.forEach((delay) => {
        const twoMinutes = 2 * 60 * 1000
        const twoMinutesThirty = 2 * 60 * 1000 + 30 * 1000
        expect(delay).toBeGreaterThanOrEqual(twoMinutes)
        expect(delay).toBeLessThanOrEqual(twoMinutesThirty)
      })

      // Should have variation (not all same value)
      const uniqueDelays = new Set(delays)
      expect(uniqueDelays.size).toBeGreaterThan(1)
    })
  })
})

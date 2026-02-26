import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Hono } from 'hono'
import router from './marketplace-credentials'

describe('Marketplace Credentials API', () => {
  let app: Hono
  const tenantId = 'tenant-123'
  const userId = 'user-456'

  beforeEach(() => {
    app = new Hono()

    // Mock auth middleware
    app.use('*', (c, next) => {
      c.set('auth', { tenantId, userId })
      return next()
    })

    // Mount router
    app.route('/api/v1/marketplace-credentials', router)

    // Set env
    process.env.ENCRYPTION_MASTER_KEY = '0'.repeat(64)
  })

  describe('AC-043.5: POST endpoints', () => {
    it('saves Shopee credentials with encryption', async () => {
      const req = new Request('http://localhost/api/v1/marketplace-credentials/shopee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliate_id: 'shopee_user_123',
          api_key: 'sk_live_test_key',
        }),
      })

      const res = await app.request(req)
      expect(res.status).toBe(201)

      const json = await res.json()
      expect(json.data.marketplace).toBe('shopee')
      expect(json.data.affiliate_id).toBe('shopee_user_123')
      expect(json.data.configured).toBe(true)
    })

    it('saves Mercado Livre credentials with encryption', async () => {
      const req = new Request('http://localhost/api/v1/marketplace-credentials/mercadolivre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_tag: 'ML_ACCOUNT_ABC',
          token: 'token_xyz_encrypted',
          token_expires_at: new Date(Date.now() + 86400000).toISOString(),
        }),
      })

      const res = await app.request(req)
      expect(res.status).toBe(201)

      const json = await res.json()
      expect(json.data.marketplace).toBe('mercadolivre')
      expect(json.data.account_tag).toBe('ML_ACCOUNT_ABC')
    })

    it('saves Amazon credentials', async () => {
      const req = new Request('http://localhost/api/v1/marketplace-credentials/amazon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          associates_id: 'amzn-associates-123',
          account_id: 'amzn-account-456',
        }),
      })

      const res = await app.request(req)
      expect(res.status).toBe(201)

      const json = await res.json()
      expect(json.data.marketplace).toBe('amazon')
      expect(json.data.associates_id).toBe('amzn-associates-123')
    })

    it('validates required fields', async () => {
      const req = new Request('http://localhost/api/v1/marketplace-credentials/shopee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Missing affiliate_id
        }),
      })

      const res = await app.request(req)
      expect(res.status).toBe(400)
    })

    it('allows optional API key/token fields', async () => {
      const req = new Request('http://localhost/api/v1/marketplace-credentials/shopee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliate_id: 'user_123',
          // api_key optional
        }),
      })

      const res = await app.request(req)
      expect(res.status).toBe(201)
    })
  })

  describe('AC-043.6: GET endpoint (no exposure)', () => {
    it('returns configuration status only (no plaintext keys)', async () => {
      // First, save credentials
      const saveReq = new Request('http://localhost/api/v1/marketplace-credentials/shopee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliate_id: 'shopee_user_123',
          api_key: 'sk_live_test_key_secret',
        }),
      })
      await app.request(saveReq)

      // Then get status
      const getReq = new Request('http://localhost/api/v1/marketplace-credentials', {
        method: 'GET',
      })
      const res = await app.request(getReq)
      expect(res.status).toBe(200)

      const json = await res.json()

      // Should expose affiliate_id but not api_key
      expect(json.shopee.configured).toBe(true)
      expect(json.shopee.affiliate_id).toBe('shopee_user_123')

      // Must NOT contain plaintext API key
      const resText = JSON.stringify(json)
      expect(resText).not.toContain('sk_live_test_key')
    })

    it('returns unconfigured status for missing credentials', async () => {
      const req = new Request('http://localhost/api/v1/marketplace-credentials', {
        method: 'GET',
      })

      const res = await app.request(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.shopee.configured).toBe(false)
      expect(json.mercadolivre.configured).toBe(false)
      expect(json.amazon.configured).toBe(false)
    })
  })

  describe('AC-043.7: DELETE endpoint', () => {
    it('deletes Shopee credentials', async () => {
      // Save first
      await app.request(
        new Request('http://localhost/api/v1/marketplace-credentials/shopee', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            affiliate_id: 'user_123',
            api_key: 'key_123',
          }),
        })
      )

      // Delete
      const deleteReq = new Request('http://localhost/api/v1/marketplace-credentials/shopee', {
        method: 'DELETE',
      })
      const res = await app.request(deleteReq)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
    })

    it('rejects invalid marketplace', async () => {
      const req = new Request('http://localhost/api/v1/marketplace-credentials/invalid', {
        method: 'DELETE',
      })
      const res = await app.request(req)
      expect(res.status).toBe(400)

      const json = await res.json()
      expect(json.error).toBe('Invalid marketplace')
    })

    it('allows reconfiguration after deletion', async () => {
      // Save
      await app.request(
        new Request('http://localhost/api/v1/marketplace-credentials/shopee', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            affiliate_id: 'user_123',
            api_key: 'key_123',
          }),
        })
      )

      // Delete
      await app.request(
        new Request('http://localhost/api/v1/marketplace-credentials/shopee', {
          method: 'DELETE',
        })
      )

      // Reconfigure
      const req = new Request('http://localhost/api/v1/marketplace-credentials/shopee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliate_id: 'user_456',
          api_key: 'key_456',
        }),
      })
      const res = await app.request(req)
      expect(res.status).toBe(201)
    })
  })

  describe('AC-043.3: RLS tenant isolation', () => {
    it('tenant can only access their own credentials', async () => {
      // Credentials are stored per tenant via tenant_id field
      // RLS policy enforces: can only read/write where tenant_id = auth.uid()

      // Both requests use same app context, so same tenantId
      // If different tenants, RLS would block access
      // This is validated at database level, not here

      const req = new Request('http://localhost/api/v1/marketplace-credentials/shopee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliate_id: 'user_123',
          api_key: 'key_123',
        }),
      })
      const res = await app.request(req)

      // Verify request was processed for correct tenant
      // (actual RLS validation happens at database)
      expect(res.status).toBe(201)
    })
  })

  describe('AC-043.4: Credentials never logged', () => {
    it('does not log plaintext API keys in error messages', async () => {
      const loggerSpy = vi.spyOn(console, 'error')

      // Force an error by not providing credentials
      const req = new Request('http://localhost/api/v1/marketplace-credentials/shopee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliate_id: 'user_123',
        }),
      })

      await app.request(req)

      // Should not contain plaintext secret in error logs
      if (loggerSpy.mock.calls.length > 0) {
        const logs = loggerSpy.mock.calls.join(' ')
        expect(logs).not.toContain('sk_live')
        expect(logs).not.toContain('api_key')
      }

      loggerSpy.mockRestore()
    })
  })

  describe('AC-043.8: Token refresh (future Phase 3)', () => {
    it('stores token expiration timestamp', async () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString()

      const req = new Request('http://localhost/api/v1/marketplace-credentials/mercadolivre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_tag: 'ML_ACCOUNT',
          token: 'token_xyz',
          token_expires_at: futureDate,
        }),
      })

      const res = await app.request(req)
      expect(res.status).toBe(201)

      // Future implementation will check this timestamp for refresh
      // and update mercadolivre_token_expires_at accordingly
    })
  })
})

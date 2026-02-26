import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { EncryptionService } from '@/services/encryption.service'
import { supabaseAdmin, supabase } from '@/clients/supabase'
import { logger } from '@/utils/logger'

const router = new Hono()

// Validation schemas
const shopeeCredentialSchema = z.object({
  affiliate_id: z.string().min(1, 'Shopee affiliate ID required'),
  api_key: z.string().min(1, 'Shopee API key required').optional(),
})

const mercadolivreCredentialSchema = z.object({
  account_tag: z.string().min(1, 'Mercado Livre account tag required'),
  token: z.string().min(1, 'Mercado Livre token required').optional(),
  token_expires_at: z.string().datetime().optional(),
})

const amazonCredentialSchema = z.object({
  associates_id: z.string().min(1, 'Amazon Associates ID required'),
  account_id: z.string().optional(),
})

type AuthContext = {
  auth: {
    tenantId: string
    userId: string
  }
}

/**
 * POST /api/v1/marketplace-credentials/shopee
 * Save Shopee affiliate credentials
 */
router.post(
  '/shopee',
  zValidator('json', shopeeCredentialSchema),
  async (c) => {
    const { auth } = c.get('auth') as AuthContext
    const { affiliate_id, api_key } = c.req.valid('json')

    try {
      const encryption = new EncryptionService()

      // Encrypt API key if provided
      const encrypted_api_key = api_key ? encryption.encrypt(api_key, auth.tenantId) : null

      // Upsert credentials
      const { data, error } = await supabaseAdmin
        .from('marketplace_credentials')
        .upsert(
          {
            tenant_id: auth.tenantId,
            shopee_affiliate_id: affiliate_id,
            shopee_api_key: encrypted_api_key,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'tenant_id' }
        )
        .select()
        .single()

      if (error) throw error

      // SECURITY: Return safe response (never expose keys)
      logger.info(`Shopee credentials saved for tenant ${auth.tenantId}`)

      return c.json(
        {
          data: {
            marketplace: 'shopee',
            affiliate_id: affiliate_id,
            configured: true,
          },
        },
        201
      )
    } catch (error) {
      logger.error(`Failed to save Shopee credentials for tenant ${auth.tenantId}`, { error })
      return c.json(
        {
          error: 'Failed to save credentials',
        },
        500
      )
    }
  }
)

/**
 * POST /api/v1/marketplace-credentials/mercadolivre
 * Save Mercado Livre affiliate credentials
 */
router.post(
  '/mercadolivre',
  zValidator('json', mercadolivreCredentialSchema),
  async (c) => {
    const { auth } = c.get('auth') as AuthContext
    const { account_tag, token, token_expires_at } = c.req.valid('json')

    try {
      const encryption = new EncryptionService()

      // Encrypt token if provided
      const encrypted_token = token ? encryption.encrypt(token, auth.tenantId) : null

      // Upsert credentials
      const { data, error } = await supabaseAdmin
        .from('marketplace_credentials')
        .upsert(
          {
            tenant_id: auth.tenantId,
            mercadolivre_account_tag: account_tag,
            mercadolivre_token: encrypted_token,
            mercadolivre_token_expires_at: token_expires_at || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'tenant_id' }
        )
        .select()
        .single()

      if (error) throw error

      logger.info(`Mercado Livre credentials saved for tenant ${auth.tenantId}`)

      return c.json(
        {
          data: {
            marketplace: 'mercadolivre',
            account_tag: account_tag,
            configured: true,
          },
        },
        201
      )
    } catch (error) {
      logger.error(`Failed to save Mercado Livre credentials for tenant ${auth.tenantId}`, { error })
      return c.json(
        {
          error: 'Failed to save credentials',
        },
        500
      )
    }
  }
)

/**
 * POST /api/v1/marketplace-credentials/amazon
 * Save Amazon affiliate credentials
 */
router.post(
  '/amazon',
  zValidator('json', amazonCredentialSchema),
  async (c) => {
    const { auth } = c.get('auth') as AuthContext
    const { associates_id, account_id } = c.req.valid('json')

    try {
      // Upsert credentials (no encryption for Amazon IDs - they're not secrets)
      const { data, error } = await supabaseAdmin
        .from('marketplace_credentials')
        .upsert(
          {
            tenant_id: auth.tenantId,
            amazon_associates_id: associates_id,
            amazon_account_id: account_id || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'tenant_id' }
        )
        .select()
        .single()

      if (error) throw error

      logger.info(`Amazon credentials saved for tenant ${auth.tenantId}`)

      return c.json(
        {
          data: {
            marketplace: 'amazon',
            associates_id: associates_id,
            configured: true,
          },
        },
        201
      )
    } catch (error) {
      logger.error(`Failed to save Amazon credentials for tenant ${auth.tenantId}`, { error })
      return c.json(
        {
          error: 'Failed to save credentials',
        },
        500
      )
    }
  }
)

/**
 * GET /api/v1/marketplace-credentials
 * Get credential status (no exposure of actual keys/tokens)
 */
router.get('/', async (c) => {
  const { auth } = c.get('auth') as AuthContext

  try {
    // SECURITY: Only select public fields (affiliate IDs)
    const { data, error } = await supabase
      .from('marketplace_credentials')
      .select(
        'shopee_affiliate_id, shopee_api_key, mercadolivre_account_tag, mercadolivre_token, amazon_associates_id'
      )
      .eq('tenant_id', auth.tenantId)
      .single()

    if (!data) {
      return c.json({
        shopee: { configured: false },
        mercadolivre: { configured: false },
        amazon: { configured: false },
      })
    }

    // Return configuration status only (never expose keys/tokens)
    return c.json({
      shopee: {
        configured: !!data.shopee_affiliate_id && !!data.shopee_api_key,
        affiliate_id: data.shopee_affiliate_id || undefined,
      },
      mercadolivre: {
        configured: !!data.mercadolivre_account_tag && !!data.mercadolivre_token,
        account_tag: data.mercadolivre_account_tag || undefined,
      },
      amazon: {
        configured: !!data.amazon_associates_id,
        associates_id: data.amazon_associates_id || undefined,
      },
    })
  } catch (error) {
    logger.error(`Failed to get credentials status for tenant ${auth.tenantId}`, { error })
    return c.json(
      {
        error: 'Failed to retrieve credentials',
      },
      500
    )
  }
})

/**
 * DELETE /api/v1/marketplace-credentials/:marketplace
 * Delete credentials for a specific marketplace
 */
router.delete('/:marketplace', async (c) => {
  const { auth } = c.get('auth') as AuthContext
  const marketplace = c.req.param('marketplace')

  if (!['shopee', 'mercadolivre', 'amazon'].includes(marketplace)) {
    return c.json(
      {
        error: 'Invalid marketplace',
      },
      400
    )
  }

  try {
    // Build update object to clear the marketplace fields
    const updateObj: Record<string, null> = {}

    if (marketplace === 'shopee') {
      updateObj.shopee_affiliate_id = null
      updateObj.shopee_api_key = null
    } else if (marketplace === 'mercadolivre') {
      updateObj.mercadolivre_account_tag = null
      updateObj.mercadolivre_token = null
      updateObj.mercadolivre_token_expires_at = null
    } else if (marketplace === 'amazon') {
      updateObj.amazon_associates_id = null
      updateObj.amazon_account_id = null
    }

    const { error } = await supabaseAdmin
      .from('marketplace_credentials')
      .update({
        ...updateObj,
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', auth.tenantId)

    if (error) throw error

    logger.info(`${marketplace} credentials deleted for tenant ${auth.tenantId}`)

    return c.json({
      success: true,
      message: `${marketplace} credentials deleted`,
    })
  } catch (error) {
    logger.error(`Failed to delete ${marketplace} credentials for tenant ${auth.tenantId}`, { error })
    return c.json(
      {
        error: 'Failed to delete credentials',
      },
      500
    )
  }
})

export default router

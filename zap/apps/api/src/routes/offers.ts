import { Hono } from 'hono'
import { supabaseAdmin } from '../db/client.js'
import { logger } from '../lib/logger.js'

export const offersRouter = new Hono()

/**
 * AC-042.1-5: Get paginated, filtered list of captured offers
 *
 * Query params:
 * - marketplace: Filter by marketplace (shopee, mercadolivre, amazon)
 * - dateFrom: Filter from date (YYYY-MM-DD)
 * - dateTo: Filter to date (YYYY-MM-DD)
 * - showDuplicates: Include duplicates (true/false, default true)
 * - search: Search by product_title (ILIKE)
 * - page: Page number (default 1)
 */
offersRouter.get('/captured-offers', async (c) => {
  try {
    // Get tenant from auth context
    // TODO: Get from actual auth middleware
    const tenantId = c.req.header('x-tenant-id') || 'default'

    const marketplace = c.req.query('marketplace')
    const dateFrom = c.req.query('dateFrom')
    const dateTo = c.req.query('dateTo')
    const showDuplicates = c.req.query('showDuplicates') === 'true' || true
    const search = c.req.query('search')
    const page = parseInt(c.req.query('page') || '1')
    const limit = 20

    let query = supabaseAdmin
      .from('captured_offers')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)

    // AC-042.2: Filter by marketplace
    if (marketplace && marketplace !== 'null' && marketplace !== '') {
      query = query.eq('marketplace', marketplace)
    }

    // AC-042.3: Filter by date range
    if (dateFrom && dateFrom !== 'null' && dateFrom !== '') {
      const startDate = new Date(dateFrom)
      query = query.gte('captured_at', startDate.toISOString())
    }

    if (dateTo && dateTo !== 'null' && dateTo !== '') {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      query = query.lte('captured_at', endDate.toISOString())
    }

    // AC-042.4: Filter by duplicate status
    if (!showDuplicates) {
      query = query.eq('is_duplicate', false)
    }

    // AC-042.5: Search by product title
    if (search && search !== 'null' && search !== '') {
      query = query.ilike('product_title', `%${search}%`)
    }

    // Execute query with sorting and pagination
    // AC-042.1: Newest first
    const { data, count, error } = await query
      .order('captured_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (error) {
      logger.error('Failed to fetch captured offers', { error, tenantId })
      return c.json(
        { error: `Failed to fetch offers: ${error.message}` },
        500
      )
    }

    logger.info('Fetched captured offers', {
      tenantId,
      count: data?.length,
      total: count,
      page,
    })

    return c.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
      },
    })
  } catch (error) {
    logger.error('Error in captured-offers endpoint', {
      error: error instanceof Error ? error.message : error,
    })
    return c.json(
      { error: 'Internal server error' },
      500
    )
  }
})

/**
 * AC-042.6: Get single offer detail by ID
 */
offersRouter.get('/captured-offers/:id', async (c) => {
  try {
    const tenantId = c.req.header('x-tenant-id') || 'default'
    const offerId = c.req.param('id')

    const { data, error } = await supabaseAdmin
      .from('captured_offers')
      .select('*')
      .eq('id', offerId)
      .eq('tenant_id', tenantId)
      .single()

    if (error || !data) {
      logger.warn('Offer not found', { offerId, tenantId })
      return c.json({ error: 'Offer not found' }, 404)
    }

    return c.json({ data })
  } catch (error) {
    logger.error('Error fetching offer detail', {
      error: error instanceof Error ? error.message : error,
    })
    return c.json({ error: 'Internal server error' }, 500)
  }
})

/**
 * AC-042.7: Get counter statistics
 *
 * Returns:
 * - totalCapturedToday: Count of offers captured today
 * - totalNew: Count of offers with status 'new'
 * - byMarketplace: Count by marketplace
 */
offersRouter.get('/captured-offers-stats', async (c) => {
  try {
    const tenantId = c.req.header('x-tenant-id') || 'default'

    // Get today's date at midnight
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Count offers captured today
    const { count: todayCount } = await supabaseAdmin
      .from('captured_offers')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('captured_at', today.toISOString())

    // Count new offers
    const { count: newCount } = await supabaseAdmin
      .from('captured_offers')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'new')

    // Count by marketplace (get all, then group in memory)
    const { data: allOffers } = await supabaseAdmin
      .from('captured_offers')
      .select('marketplace')
      .eq('tenant_id', tenantId)

    const byMarketplace: Record<string, number> = {}
    allOffers?.forEach((offer) => {
      byMarketplace[offer.marketplace] =
        (byMarketplace[offer.marketplace] || 0) + 1
    })

    logger.info('Fetched offer stats', {
      tenantId,
      todayCount,
      newCount,
      byMarketplace,
    })

    return c.json({
      data: {
        totalCapturedToday: todayCount || 0,
        totalNew: newCount || 0,
        byMarketplace,
      },
    })
  } catch (error) {
    logger.error('Error fetching offer stats', {
      error: error instanceof Error ? error.message : error,
    })
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default offersRouter

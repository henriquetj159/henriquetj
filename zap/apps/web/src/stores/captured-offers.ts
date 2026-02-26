import { create } from 'zustand'

export interface CapturedOffer {
  id: string
  tenant_id: string
  marketplace: 'shopee' | 'mercadolivre' | 'amazon'
  product_id: string
  product_title: string
  product_image_url?: string
  original_price: number
  discounted_price: number
  discount_percent: number
  original_url: string
  original_affiliate_id?: string
  source_group_jid: string
  captured_from_message_id?: string
  captured_at: string
  dedup_hash: string
  is_duplicate: boolean
  duplicate_of_offer_id?: string | null
  status: 'new' | 'pending_substitution' | 'ready' | 'sent' | 'expired'
  expires_at?: string | null
}

export interface Filters {
  marketplace?: string | null
  dateFrom?: Date | null
  dateTo?: Date | null
  showDuplicates: boolean
  search: string
  page: number
}

export interface CapturedOffersStore {
  // State
  offers: CapturedOffer[]
  filters: Filters
  loading: boolean
  error: string | null
  total: number
  counts: {
    by_marketplace: Record<string, number>
    today: number
    new: number
  }

  // Actions
  setFilters: (partial: Partial<Filters>) => void
  fetchOffers: () => Promise<void>
  subscribeToUpdates: () => void
  setError: (error: string | null) => void
  resetFilters: () => void
}

const DEFAULT_FILTERS: Filters = {
  marketplace: null,
  dateFrom: null,
  dateTo: null,
  showDuplicates: true,
  search: '',
  page: 1,
}

export const useCapturedOffersStore = create<CapturedOffersStore>(
  (set, get) => ({
    offers: [],
    filters: DEFAULT_FILTERS,
    loading: false,
    error: null,
    total: 0,
    counts: {
      by_marketplace: {},
      today: 0,
      new: 0,
    },

    setError: (error) => set({ error }),

    resetFilters: () => {
      set({ filters: DEFAULT_FILTERS, offers: [], total: 0 })
    },

    setFilters: (partial) => {
      set((state) => ({
        filters: { ...state.filters, ...partial, page: 1 }, // Reset to page 1 on filter change
      }))
      // Auto-fetch when filters change
      get().fetchOffers()
    },

    fetchOffers: async () => {
      set({ loading: true, error: null })
      try {
        const { filters } = get()

        // Build query parameters
        const params = new URLSearchParams()

        if (filters.marketplace) {
          params.append('marketplace', filters.marketplace)
        }

        if (filters.dateFrom) {
          params.append('dateFrom', filters.dateFrom.toISOString().split('T')[0])
        }

        if (filters.dateTo) {
          params.append('dateTo', filters.dateTo.toISOString().split('T')[0])
        }

        params.append('showDuplicates', String(filters.showDuplicates))

        if (filters.search) {
          params.append('search', filters.search)
        }

        params.append('page', String(filters.page))

        const response = await fetch(`/api/offers/captured-offers?${params.toString()}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch offers: ${response.statusText}`)
        }

        const json = await response.json()
        const { data, pagination } = json

        // Calculate counts from the response
        const by_marketplace: Record<string, number> = {}
        let today = 0
        let new_count = 0

        const now = new Date()
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        data.forEach((offer: CapturedOffer) => {
          // Count by marketplace
          by_marketplace[offer.marketplace] = (by_marketplace[offer.marketplace] || 0) + 1

          // Count today
          if (new Date(offer.captured_at) >= startOfToday) {
            today++
          }

          // Count new offers
          if (offer.status === 'new') {
            new_count++
          }
        })

        set({
          offers: data,
          total: pagination.total || 0,
          counts: {
            by_marketplace,
            today,
            new: new_count,
          },
          error: null,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        set({ error: message })
      } finally {
        set({ loading: false })
      }
    },

    subscribeToUpdates: () => {
      // TODO: Implement Supabase realtime subscription or polling
      // For now, polling every 5 seconds when component is mounted
      const interval = setInterval(() => {
        get().fetchOffers()
      }, 5000)

      // Return cleanup function (would be called on unmount)
      return () => clearInterval(interval)
    },
  })
)

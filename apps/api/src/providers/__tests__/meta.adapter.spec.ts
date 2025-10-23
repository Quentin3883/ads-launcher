import { MetaAdapter } from '../meta/meta.adapter'

describe('MetaAdapter', () => {
  let adapter: MetaAdapter

  beforeEach(() => {
    adapter = new MetaAdapter({
      accessToken: 'test_token',
      adAccountId: 'act_123456',
    })
    // Désactive le délai pour les tests
    adapter.setMockDelay(0)
  })

  describe('ensureAuth', () => {
    it('should authenticate successfully', async () => {
      await expect(
        adapter.ensureAuth('org-1', 'connection-1')
      ).resolves.not.toThrow()
    })

    it('should work without access token (stub mode)', async () => {
      const noTokenAdapter = new MetaAdapter()
      await expect(
        noTokenAdapter.ensureAuth('org-1', 'connection-1')
      ).resolves.not.toThrow()
    })
  })

  describe('createCampaign', () => {
    it('should create a campaign with mocked ID', async () => {
      const result = await adapter.createCampaign({
        name: 'Test Campaign',
        objective: 'CONVERSIONS',
        status: 'ACTIVE',
        budget: {
          amount: 1000,
          type: 'DAILY',
        },
      })

      expect(result).toMatchObject({
        platform: 'META',
        name: 'Test Campaign',
        objective: 'CONVERSIONS',
        status: 'ACTIVE',
      })
      expect(result.id).toMatch(/^meta_campaign_/)
      expect(result.createdAt).toBeInstanceOf(Date)
    })

    it('should generate unique IDs for different campaigns', async () => {
      const result1 = await adapter.createCampaign({
        name: 'Campaign 1',
        objective: 'CONVERSIONS',
        status: 'ACTIVE',
      })

      const result2 = await adapter.createCampaign({
        name: 'Campaign 2',
        objective: 'CONVERSIONS',
        status: 'ACTIVE',
      })

      expect(result1.id).not.toBe(result2.id)
    })
  })

  describe('createAdSet', () => {
    it('should create an ad set with mocked ID', async () => {
      const result = await adapter.createAdSet({
        campaignId: 'meta_campaign_abc123',
        name: 'Test Ad Set',
        status: 'ACTIVE',
        targeting: {
          ageMin: 25,
          ageMax: 45,
          locations: ['US', 'CA'],
          interests: ['technology', 'marketing'],
        },
        budget: {
          amount: 500,
          type: 'DAILY',
        },
      })

      expect(result).toMatchObject({
        platform: 'META',
        name: 'Test Ad Set',
        campaignId: 'meta_campaign_abc123',
      })
      expect(result.id).toMatch(/^meta_adset_/)
      expect(result.createdAt).toBeInstanceOf(Date)
    })
  })

  describe('createAd', () => {
    it('should create an ad with mocked ID', async () => {
      const result = await adapter.createAd({
        adSetId: 'meta_adset_xyz789',
        name: 'Test Ad',
        status: 'ACTIVE',
        creative: {
          title: 'Amazing Product',
          body: 'Get 50% off today!',
          imageUrl: 'https://example.com/image.jpg',
          callToAction: 'SHOP_NOW',
          link: 'https://example.com/shop',
        },
      })

      expect(result).toMatchObject({
        platform: 'META',
        name: 'Test Ad',
        adSetId: 'meta_adset_xyz789',
      })
      expect(result.id).toMatch(/^meta_ad_/)
      expect(result.createdAt).toBeInstanceOf(Date)
    })
  })

  describe('getMetrics', () => {
    it('should return mocked metrics', async () => {
      const metrics = await adapter.getMetrics(
        { campaignId: 'meta_campaign_abc123' },
        '2025-01-01',
        '2025-01-31'
      )

      expect(metrics).toHaveLength(1)
      const firstMetric = metrics[0]
      expect(firstMetric).toBeDefined()

      if (!firstMetric) {
        throw new Error('Expected at least one metric')
      }

      expect(firstMetric).toHaveProperty('impressions')
      expect(firstMetric).toHaveProperty('clicks')
      expect(firstMetric).toHaveProperty('spend')
      expect(firstMetric).toHaveProperty('conversions')
      expect(firstMetric).toHaveProperty('ctr')
      expect(firstMetric).toHaveProperty('cpc')
      expect(firstMetric).toHaveProperty('cpm')

      // Vérifie que les valeurs sont dans des ranges réalistes
      expect(firstMetric.impressions).toBeGreaterThan(0)
      expect(firstMetric.clicks).toBeGreaterThan(0)
      expect(firstMetric.spend).toBeGreaterThan(0)

      // Vérifie que les métriques calculées sont cohérentes
      expect(firstMetric.ctr).toBeGreaterThan(0)
      expect(firstMetric.cpc).toBeGreaterThan(0)
      expect(firstMetric.cpm).toBeGreaterThan(0)
    })

    it('should accept different scopes', async () => {
      const campaignMetrics = await adapter.getMetrics(
        { campaignId: 'campaign_123' },
        '2025-01-01',
        '2025-01-31'
      )

      const adSetMetrics = await adapter.getMetrics(
        { adSetId: 'adset_456' },
        '2025-01-01',
        '2025-01-31'
      )

      const adMetrics = await adapter.getMetrics(
        { adId: 'ad_789' },
        '2025-01-01',
        '2025-01-31'
      )

      expect(campaignMetrics).toHaveLength(1)
      expect(adSetMetrics).toHaveLength(1)
      expect(adMetrics).toHaveLength(1)
    })
  })

  describe('name property', () => {
    it('should have META as platform name', () => {
      expect(adapter.name).toBe('META')
    })
  })
})

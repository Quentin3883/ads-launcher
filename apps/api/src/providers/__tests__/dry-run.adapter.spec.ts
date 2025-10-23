import { DryRunAdapter } from '../dry-run.adapter'

describe('DryRunAdapter', () => {
  let adapter: DryRunAdapter

  beforeEach(() => {
    adapter = new DryRunAdapter('META')
  })

  afterEach(() => {
    adapter.reset()
  })

  describe('constructor', () => {
    it('should create adapter with META platform by default', () => {
      const metaAdapter = new DryRunAdapter('META')
      expect(metaAdapter.name).toBe('META')
    })

    it('should create adapter with specified platform', () => {
      const googleAdapter = new DryRunAdapter('GOOGLE')
      expect(googleAdapter.name).toBe('GOOGLE')
    })
  })

  describe('ensureAuth', () => {
    it('should not throw error', async () => {
      await expect(
        adapter.ensureAuth('org-1', 'connection-1')
      ).resolves.not.toThrow()
    })
  })

  describe('createCampaign', () => {
    it('should create campaign and track operation', async () => {
      const result = await adapter.createCampaign({
        name: 'Dry Run Campaign',
        objective: 'CONVERSIONS',
        status: 'ACTIVE',
      })

      expect(result.id).toMatch(/^dryrun_campaign_/)
      expect(result.platform).toBe('META')
      expect(result.createdAt).toBeInstanceOf(Date)

      const operations = adapter.getOperations()
      expect(operations).toHaveLength(1)
      expect(operations[0]?.type).toBe('createCampaign')
    })
  })

  describe('createAdSet', () => {
    it('should create ad set and track operation', async () => {
      const result = await adapter.createAdSet({
        campaignId: 'campaign_123',
        name: 'Dry Run Ad Set',
        status: 'ACTIVE',
      })

      expect(result.id).toMatch(/^dryrun_adset_/)
      expect(result.platform).toBe('META')

      const operations = adapter.getOperations()
      expect(operations).toHaveLength(1)
      expect(operations[0]?.type).toBe('createAdSet')
    })
  })

  describe('createAd', () => {
    it('should create ad and track operation', async () => {
      const result = await adapter.createAd({
        adSetId: 'adset_456',
        name: 'Dry Run Ad',
        status: 'ACTIVE',
        creative: {
          title: 'Test Ad',
          body: 'Test description',
        },
      })

      expect(result.id).toMatch(/^dryrun_ad_/)
      expect(result.platform).toBe('META')

      const operations = adapter.getOperations()
      expect(operations).toHaveLength(1)
      expect(operations[0]?.type).toBe('createAd')
    })
  })

  describe('getMetrics', () => {
    it('should return fixed test metrics', async () => {
      const metrics = await adapter.getMetrics(
        { campaignId: 'campaign_123' },
        '2025-01-01',
        '2025-01-31'
      )

      expect(metrics).toHaveLength(1)
      expect(metrics[0]).toMatchObject({
        impressions: 10000,
        clicks: 500,
        spend: 100,
        conversions: 50,
        ctr: 5.0,
        cpc: 0.2,
        cpm: 10.0,
      })
    })
  })

  describe('operation tracking', () => {
    it('should track multiple operations in order', async () => {
      await adapter.createCampaign({
        name: 'Campaign 1',
        objective: 'CONVERSIONS',
        status: 'ACTIVE',
      })
      await adapter.createAdSet({
        campaignId: 'campaign_1',
        name: 'Ad Set 1',
        status: 'ACTIVE',
      })
      await adapter.createAd({
        adSetId: 'adset_1',
        name: 'Ad 1',
        status: 'ACTIVE',
        creative: { title: 'Test', body: 'Test' },
      })

      const operations = adapter.getOperations()
      expect(operations).toHaveLength(3)
      expect(operations[0]?.type).toBe('createCampaign')
      expect(operations[1]?.type).toBe('createAdSet')
      expect(operations[2]?.type).toBe('createAd')
    })

    it('should reset operations', async () => {
      await adapter.createCampaign({
        name: 'Campaign',
        objective: 'CONVERSIONS',
        status: 'ACTIVE',
      })

      expect(adapter.getOperations()).toHaveLength(1)

      adapter.reset()

      expect(adapter.getOperations()).toHaveLength(0)
    })
  })
})

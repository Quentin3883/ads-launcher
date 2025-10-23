import { Blueprint } from '@launcher-ads/sdk'
import { DryRunAdapter } from '../../providers'
import { runLaunch, validateBlueprint } from '../run-launch'

describe('runLaunch', () => {
  let adapter: DryRunAdapter
  let mockBlueprint: Blueprint

  beforeEach(() => {
    adapter = new DryRunAdapter('META')
    mockBlueprint = {
      id: 'blueprint-123',
      name: 'Test Campaign Blueprint',
      platform: 'meta' as const,
      status: 'active' as const,
      config: {
        budget: 1000,
        duration: 30,
        targetAudience: {
          age: { min: 25, max: 45 },
          locations: ['US', 'CA'],
          interests: ['technology', 'marketing'],
        },
        creative: {
          headline: 'Amazing Product',
          description: 'Get 50% off today',
          callToAction: 'Shop Now',
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  })

  afterEach(() => {
    adapter.reset()
  })

  it('should successfully launch a blueprint', async () => {
    const result = await runLaunch(mockBlueprint, adapter)

    expect(result.blueprintId).toBe('blueprint-123')
    expect(result.blueprintName).toBe('Test Campaign Blueprint')
    expect(result.platform).toBe('meta')
    expect(result.created).toBeDefined()
    expect(result.totalCreated).toBeDefined()
    expect(result.errors).toEqual([])
  })

  it('should create correct number of entities', async () => {
    const result = await runLaunch(mockBlueprint, adapter)

    // 1 value prop x 1 audience = 1 campaign, 1 adset, 1 ad
    expect(result.totalCreated.campaigns).toBe(1)
    expect(result.totalCreated.adsets).toBe(1)
    expect(result.totalCreated.ads).toBe(1)
    expect(result.created.length).toBe(3)
  })

  it('should create entities in correct order', async () => {
    const result = await runLaunch(mockBlueprint, adapter)

    expect(result.created[0]?.type).toBe('campaign')
    expect(result.created[1]?.type).toBe('adset')
    expect(result.created[2]?.type).toBe('ad')
  })

  it('should link entities correctly with parentIds', async () => {
    const result = await runLaunch(mockBlueprint, adapter)

    const campaign = result.created.find((e) => e.type === 'campaign')
    const adset = result.created.find((e) => e.type === 'adset')
    const ad = result.created.find((e) => e.type === 'ad')

    expect(adset?.parentId).toBe(campaign?.externalId)
    expect(ad?.parentId).toBe(adset?.externalId)
  })

  it('should track operations in adapter', async () => {
    await runLaunch(mockBlueprint, adapter)

    const operations = adapter.getOperations()
    expect(operations.length).toBe(3) // campaign, adset, ad

    expect(operations[0]?.type).toBe('createCampaign')
    expect(operations[1]?.type).toBe('createAdSet')
    expect(operations[2]?.type).toBe('createAd')
  })

  it('should measure duration', async () => {
    const result = await runLaunch(mockBlueprint, adapter)

    expect(result.durationMs).toBeGreaterThanOrEqual(0)
    expect(result.startedAt).toBeInstanceOf(Date)
    expect(result.completedAt).toBeInstanceOf(Date)
    expect(result.completedAt.getTime()).toBeGreaterThanOrEqual(
      result.startedAt.getTime()
    )
  })

  it('should create entities with correct names', async () => {
    const result = await runLaunch(mockBlueprint, adapter)

    const campaign = result.created.find((e) => e.type === 'campaign')
    const adset = result.created.find((e) => e.type === 'adset')
    const ad = result.created.find((e) => e.type === 'ad')

    expect(campaign?.name).toContain('Test Campaign Blueprint')
    expect(adset?.name).toContain('Primary Audience')
    expect(ad?.name).toContain('Ad')
  })

  it('should create entities with PAUSED status', async () => {
    await runLaunch(mockBlueprint, adapter)

    const operations = adapter.getOperations()

    operations.forEach((op) => {
      const input = op.input as { status?: string }
      expect(input.status).toBe('PAUSED')
    })
  })
})

describe('validateBlueprint', () => {
  let validBlueprint: Blueprint

  beforeEach(() => {
    validBlueprint = {
      id: 'bp-1',
      name: 'Valid Blueprint',
      platform: 'meta' as const,
      status: 'active' as const,
      config: {
        budget: 1000,
        duration: 30,
        targetAudience: {
          age: { min: 25, max: 45 },
          locations: ['US'],
          interests: ['tech'],
        },
        creative: {
          headline: 'Test',
          description: 'Test desc',
          callToAction: 'Click',
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  })

  it('should pass for valid blueprint', () => {
    expect(() => validateBlueprint(validBlueprint)).not.toThrow()
  })

  it('should throw if name is missing', () => {
    const invalid = { ...validBlueprint, name: '' }
    expect(() => validateBlueprint(invalid)).toThrow('must have a name')
  })

  it('should throw if platform is missing', () => {
    const invalid = { ...validBlueprint, platform: '' as 'meta' }
    expect(() => validateBlueprint(invalid)).toThrow('must have a platform')
  })

  it('should throw if config is missing', () => {
    const invalid = { ...validBlueprint, config: null as unknown as never }
    expect(() => validateBlueprint(invalid)).toThrow('must have a config')
  })

  it('should throw if budget is invalid', () => {
    const invalid = {
      ...validBlueprint,
      config: { ...validBlueprint.config, budget: 0 },
    }
    expect(() => validateBlueprint(invalid)).toThrow('valid budget')
  })

  it('should throw if creative is invalid', () => {
    const invalid = {
      ...validBlueprint,
      config: {
        ...validBlueprint.config,
        creative: {
          headline: '',
          description: '',
          callToAction: '',
        },
      },
    }
    expect(() => validateBlueprint(invalid)).toThrow('valid creative')
  })

  it('should throw if no target locations', () => {
    const invalid = {
      ...validBlueprint,
      config: {
        ...validBlueprint.config,
        targetAudience: {
          ...validBlueprint.config.targetAudience,
          locations: [],
        },
      },
    }
    expect(() => validateBlueprint(invalid)).toThrow('at least one target location')
  })
})

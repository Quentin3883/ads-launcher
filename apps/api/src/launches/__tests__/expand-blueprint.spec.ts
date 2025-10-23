import { BlueprintConfig } from '@launcher-ads/sdk'
import {
  expandBlueprint,
  createCreativeVariant,
  calculateExpansionSize,
} from '../expand-blueprint'

describe('expandBlueprint', () => {
  const mockConfig: BlueprintConfig = {
    budget: 1000,
    duration: 30,
    targetAudience: {
      age: { min: 25, max: 45 },
      locations: ['US', 'CA', 'UK'],
      interests: ['technology', 'startups'],
    },
    creative: {
      headline: 'Amazing Product',
      description: 'Get it now with 50% off',
      callToAction: 'Shop Now',
      imageUrl: 'https://example.com/image.jpg',
    },
  }

  it('should expand blueprint config into expansion params', () => {
    const result = expandBlueprint(mockConfig)

    expect(result).toHaveProperty('valueProps')
    expect(result).toHaveProperty('audiences')
    expect(result).toHaveProperty('budget')
    expect(result).toHaveProperty('creative')
  })

  it('should extract value props (V1: uses headline)', () => {
    const result = expandBlueprint(mockConfig)

    expect(result.valueProps).toEqual(['Amazing Product'])
  })

  it('should create audiences from targetAudience', () => {
    const result = expandBlueprint(mockConfig)

    expect(result.audiences).toHaveLength(1)
    expect(result.audiences?.[0]).toMatchObject({
      name: 'Primary Audience',
      ageMin: 25,
      ageMax: 45,
      locations: ['US', 'CA', 'UK'],
      interests: ['technology', 'startups'],
    })
  })

  it('should extract budget', () => {
    const result = expandBlueprint(mockConfig)

    expect(result.budget).toEqual({
      amount: 1000,
      type: 'DAILY',
    })
  })

  it('should extract creative', () => {
    const result = expandBlueprint(mockConfig)

    expect(result.creative).toMatchObject({
      headline: 'Amazing Product',
      description: 'Get it now with 50% off',
      callToAction: 'Shop Now',
      imageUrl: 'https://example.com/image.jpg',
    })
  })
})

describe('createCreativeVariant', () => {
  it('should create variant with value prop prefix', () => {
    const creative = {
      headline: 'Buy Now',
      description: 'Great product',
      callToAction: 'Shop',
    }

    const variant = createCreativeVariant(creative, 'Fast Delivery')

    expect(variant.headline).toBe('Fast Delivery - Buy Now')
    expect(variant.description).toBe('Fast Delivery: Great product')
    expect(variant.callToAction).toBe('Shop')
  })

  it('should preserve other creative fields', () => {
    const creative = {
      headline: 'Test',
      description: 'Test desc',
      callToAction: 'Click',
      imageUrl: 'https://example.com/img.jpg',
    }

    const variant = createCreativeVariant(creative, 'Reliable')

    expect(variant.imageUrl).toBe('https://example.com/img.jpg')
  })
})

describe('calculateExpansionSize', () => {
  it('should calculate correct expansion size', () => {
    const params = {
      valueProps: ['Fast', 'Reliable', 'Affordable'],
      audiences: [
        {
          name: 'Audience 1',
          ageMin: 25,
          ageMax: 45,
          locations: ['US'],
          interests: ['tech'],
        },
        {
          name: 'Audience 2',
          ageMin: 30,
          ageMax: 55,
          locations: ['CA'],
          interests: ['business'],
        },
      ],
      budget: { amount: 1000, type: 'DAILY' as const },
      creative: {
        headline: 'Test',
        description: 'Test',
        callToAction: 'Test',
      },
    }

    const size = calculateExpansionSize(params)

    expect(size).toEqual({
      campaigns: 3, // 3 value props
      adsets: 6, // 3 value props x 2 audiences
      ads: 6, // 1 ad per adset
    })
  })

  it('should handle single value prop and audience', () => {
    const params = {
      valueProps: ['Single'],
      audiences: [
        {
          name: 'Single Audience',
          ageMin: 25,
          ageMax: 45,
          locations: ['US'],
          interests: ['tech'],
        },
      ],
      budget: { amount: 1000, type: 'DAILY' as const },
      creative: {
        headline: 'Test',
        description: 'Test',
        callToAction: 'Test',
      },
    }

    const size = calculateExpansionSize(params)

    expect(size).toEqual({
      campaigns: 1,
      adsets: 1,
      ads: 1,
    })
  })
})

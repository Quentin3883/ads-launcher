import { ProviderFactory } from '../provider.factory'
import { MetaAdapter } from '../meta/meta.adapter'
import { DryRunAdapter } from '../dry-run.adapter'

describe('ProviderFactory', () => {
  describe('create', () => {
    it('should create DryRunAdapter when dryRun is true', () => {
      const adapter = ProviderFactory.create({
        platform: 'META',
        dryRun: true,
      })

      expect(adapter).toBeInstanceOf(DryRunAdapter)
      expect(adapter.name).toBe('META')
    })

    it('should create MetaAdapter for META platform', () => {
      const adapter = ProviderFactory.create({
        platform: 'META',
        credentials: {
          accessToken: 'test_token',
          adAccountId: 'act_123',
        },
      })

      expect(adapter).toBeInstanceOf(MetaAdapter)
      expect(adapter.name).toBe('META')
    })

    it('should throw error for unsupported platforms', () => {
      expect(() =>
        ProviderFactory.create({
          platform: 'GOOGLE',
        })
      ).toThrow('GoogleAdapter not implemented yet')

      expect(() =>
        ProviderFactory.create({
          platform: 'LINKEDIN',
        })
      ).toThrow('LinkedInAdapter not implemented yet')

      expect(() =>
        ProviderFactory.create({
          platform: 'SNAP',
        })
      ).toThrow('SnapAdapter not implemented yet')
    })

    it('should pass credentials to adapter', () => {
      const credentials = {
        accessToken: 'my_token',
        adAccountId: 'my_account',
      }

      const adapter = ProviderFactory.create({
        platform: 'META',
        credentials,
      })

      expect(adapter).toBeInstanceOf(MetaAdapter)
    })
  })

  describe('getSupportedPlatforms', () => {
    it('should return all supported platforms', () => {
      const platforms = ProviderFactory.getSupportedPlatforms()

      expect(platforms).toEqual(['META', 'GOOGLE', 'LINKEDIN', 'SNAP'])
    })
  })

  describe('isPlatformSupported', () => {
    it('should return true for supported platforms', () => {
      expect(ProviderFactory.isPlatformSupported('META')).toBe(true)
      expect(ProviderFactory.isPlatformSupported('GOOGLE')).toBe(true)
      expect(ProviderFactory.isPlatformSupported('LINKEDIN')).toBe(true)
      expect(ProviderFactory.isPlatformSupported('SNAP')).toBe(true)
    })

    it('should return false for unsupported platforms', () => {
      expect(ProviderFactory.isPlatformSupported('TWITTER')).toBe(false)
      expect(ProviderFactory.isPlatformSupported('TIKTOK')).toBe(false)
      expect(ProviderFactory.isPlatformSupported('INVALID')).toBe(false)
    })
  })
})

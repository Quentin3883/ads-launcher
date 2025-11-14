# Audit d'Intégration Meta - État Actuel & Architecture Multi-Plateforme

**Date**: 2025-01-14
**Contexte**: Finaliser Meta à 100% avant Google Ads, tout en préparant l'architecture multi-plateforme
**Fichier Principal**: `apps/api/src/facebook/facebook.service.ts` (3,125 lignes)

---

## 📊 État Actuel de l'Intégration Meta

### ✅ Ce qui est DÉJÀ implémenté (Production-Ready)

#### 1. **Bulk Campaign Launch** 🚀
```typescript
async launchBulkCampaign(userId, adAccountId, campaignData)
```
- ✅ Création complète: Campaign → Ad Sets → Ads → Creatives
- ✅ Support CBO/ABO budgets
- ✅ Support daily/lifetime budgets
- ✅ Targeting (age, gender, locations, interests, custom audiences)
- ✅ Placements (Facebook, Instagram, Stories, Reels, etc.)
- ✅ Promoted Object (Pixel + Events + Custom Conversions)
- ✅ URL parameters (UTM tracking)
- ✅ Lead forms support
- ✅ Image + Video creative upload
- ✅ Multi-creative per ad (Feed + Story)

**Code**: 3,125 lignes très complètes

#### 2. **Media Management** 📸
- ✅ `uploadImage()` - Upload images to Ad Account
- ✅ `uploadVideo()` - Upload videos with resumable upload
- ✅ `getVideoThumbnail()` - Get video preview
- ✅ `getAdImages()` - Fetch media library (images)
- ✅ `getAdVideos()` - Fetch media library (videos)

#### 3. **Campaign Management** ⚙️
- ✅ `createCampaign()` - Create campaign
- ✅ `createAdSet()` - Create ad set
- ✅ `createAdCreative()` - Create creative
- ✅ `createAd()` - Create ad
- ✅ `updateCampaignStatus()` - Pause/resume campaigns
- ✅ `updateCampaignBudget()` - Update budget

#### 4. **Analytics & Insights** 📈
- ✅ `syncAllCampaignsWithInsights()` - Sync metrics (impressions, clicks, spend, CPC, CPM, CTR)
- ✅ `getCampaignsWithInsightsFromDB()` - Get campaigns with metrics from DB
- ✅ `getClientAnalyticsByDate()` - Analytics by date range

#### 5. **Resource Fetching** 🔍
- ✅ `getUserPages()` - Get Facebook pages
- ✅ `getLeadForms()` - Get lead forms per page
- ✅ `getAdAccountPixels()` - Get pixels per ad account
- ✅ `getPixelEvents()` - Get pixel events
- ✅ `getCustomConversions()` - Get custom conversions
- ✅ `getInterestSuggestions()` - Interest autocomplete

#### 6. **Authentication** 🔐
- ✅ `getToken()` - Fetch access token from DB

---

## ⚠️ Ce qui MANQUE pour Meta à 100%

### 🔴 **CRITICAL** (Manque pour usage complet)

#### 1. **Delete Operations**
**Status**: ❌ Pas implémenté

**Besoin**:
```typescript
// À ajouter à facebook.service.ts
async deleteCampaign(campaignId: string): Promise<void>
async deleteAdSet(adSetId: string): Promise<void>
async deleteAd(adId: string): Promise<void>
async deleteCreative(creativeId: string): Promise<void>
```

**Impact**:
- ❌ Impossible de nettoyer les campagnes de test
- ❌ Impossible de supprimer des erreurs de lancement
- ❌ Pollution du Ad Account avec campagnes inutilisées

**Priorité**: HIGH (2h de dev)

---

#### 2. **Update Operations** (Partielles)
**Status**: ⚠️ Partiellement implémenté

**Déjà fait**:
- ✅ `updateCampaignStatus()` (pause/resume)
- ✅ `updateCampaignBudget()`

**Manque**:
```typescript
// À ajouter
async updateAdSet(adSetId: string, updates: Partial<AdSetData>): Promise<void>
async updateAd(adId: string, updates: Partial<AdData>): Promise<void>
async updateCreative(creativeId: string, updates: Partial<CreativeData>): Promise<void>

// Spécifiques
async updateAdSetBudget(adSetId: string, budget: number): Promise<void>
async updateAdSetTargeting(adSetId: string, targeting: Targeting): Promise<void>
async updateAdCopy(adId: string, headline: string, primaryText: string): Promise<void>
```

**Impact**:
- ❌ Impossible de modifier une campagne après lancement
- ❌ Impossible de A/B tester des budgets
- ❌ Impossible d'ajuster targeting sans recréer

**Priorité**: MEDIUM (4h de dev)

---

#### 3. **Batch Status Update**
**Status**: ❌ Pas implémenté

**Besoin**:
```typescript
// Pause/Resume multiple campaigns/adsets/ads à la fois
async batchUpdateStatus(
  type: 'campaign' | 'adset' | 'ad',
  ids: string[],
  status: 'ACTIVE' | 'PAUSED'
): Promise<void>
```

**Impact**:
- ❌ Inefficient si besoin de pause 50 campagnes (50 API calls vs 1)
- ❌ Pas pratique pour utilisateur

**Priorité**: MEDIUM (2h de dev)

---

### 🟡 **NICE TO HAVE** (Améliore l'UX)

#### 4. **Duplicate Campaign**
**Status**: ❌ Pas implémenté

**Besoin**:
```typescript
async duplicateCampaign(campaignId: string, newName: string): Promise<CampaignResult>
```

**Impact**:
- Sans: User doit recréer toute la structure dans l'UI
- Avec: Copy-paste rapide d'une campagne qui performe

**Priorité**: LOW (3h de dev)

---

#### 5. **Advanced Reporting**
**Status**: ⚠️ Basique

**Déjà fait**:
- ✅ Metrics basiques (impressions, clicks, spend, CPC, CPM, CTR)
- ✅ Sync historique

**Manque**:
```typescript
// Breakdown par age/gender/placement/country
async getInsightsBreakdown(
  scope: { campaignId?, adSetId?, adId? },
  breakdownBy: 'age' | 'gender' | 'placement' | 'country' | 'device',
  dateFrom: string,
  dateTo: string
): Promise<BreakdownInsights[]>

// Conversion tracking détaillé
async getConversionInsights(
  pixelId: string,
  dateFrom: string,
  dateTo: string
): Promise<ConversionInsights[]>
```

**Impact**:
- Sans: Reporting limité, pas de deep analysis
- Avec: Data-driven optimizations

**Priorité**: LOW (6h de dev)

---

#### 6. **Custom Audience Management**
**Status**: ❌ Pas implémenté

**Déjà fait**:
- ✅ Utiliser des custom audiences existantes (par ID)

**Manque**:
```typescript
// Créer custom audiences
async createCustomAudience(
  adAccountId: string,
  name: string,
  description: string,
  type: 'CUSTOM' | 'LOOKALIKE',
  source?: CustomAudienceSource
): Promise<CustomAudienceResult>

// Lister custom audiences
async getCustomAudiences(adAccountId: string): Promise<CustomAudience[]>

// Créer Lookalike
async createLookalikeAudience(
  adAccountId: string,
  sourceAudienceId: string,
  countries: string[],
  ratio: number // 1-10%
): Promise<LookalikeResult>
```

**Impact**:
- Sans: User doit créer audiences manuellement dans Meta Ads Manager
- Avec: Workflow complet dans l'app

**Priorité**: LOW (8h de dev)

---

## 🏗️ Architecture Multi-Plateforme

### État Actuel vs. Cible

#### **ACTUELLEMENT** (Structure Meta-Specific):
```
apps/api/src/
├── facebook/
│   ├── facebook.service.ts (3,125 lignes - MONOLITHIC)
│   ├── facebook.module.ts
│   ├── controllers/ (Debug, Media, Insights)
│   └── services/
│       └── facebook-api-client.service.ts
└── providers/
    ├── meta/
    │   └── meta.adapter.ts (STUB - mock data)
    ├── provider.adapter.ts (interface)
    └── provider.factory.ts
```

**Problèmes**:
1. ❌ `facebook.service.ts` = 3,125 lignes (MASSIVE, hard to maintain)
2. ❌ `meta.adapter.ts` = STUB (mock data, not used in production)
3. ❌ Duplication: Real Meta logic in `facebook.service.ts`, but stub in `meta.adapter.ts`
4. ❌ `FacebookService` est NestJS-specific (Dependency Injection), pas réutilisable
5. ❌ Pas de séparation claire entre "Meta API calls" et "Business logic"

---

### **ARCHITECTURE CIBLE** (Multi-Plateforme):

```
apps/api/src/
├── campaigns/
│   ├── campaigns.service.ts (Business logic, platform-agnostic)
│   └── campaigns.controller.ts (tRPC router)
│
├── providers/
│   ├── provider.adapter.ts (Interface commune)
│   ├── provider.factory.ts (Factory pattern)
│   ├── connection.manager.ts (OAuth + Token management)
│   │
│   ├── meta/
│   │   ├── meta.adapter.ts (Implémente ProviderAdapter)
│   │   ├── meta.api-client.ts (Pure Meta API calls)
│   │   └── meta.mapper.ts (Map SDK types ↔ Meta API types)
│   │
│   ├── google/
│   │   ├── google.adapter.ts (Implémente ProviderAdapter)
│   │   ├── google.api-client.ts (Pure Google Ads API calls)
│   │   └── google.mapper.ts
│   │
│   ├── tiktok/
│   │   ├── tiktok.adapter.ts
│   │   ├── tiktok.api-client.ts
│   │   └── tiktok.mapper.ts
│   │
│   └── linkedin/
│       ├── linkedin.adapter.ts
│       ├── linkedin.api-client.ts
│       └── linkedin.mapper.ts
│
└── trpc/
    └── routers/
        └── campaigns.router.ts (Utilise CampaignsService + ProviderFactory)
```

---

### **Séparation des Responsabilités**

#### 1. **ProviderAdapter** (Interface)
```typescript
// apps/api/src/providers/provider.adapter.ts
export interface ProviderAdapter {
  readonly name: PlatformType

  // Auth
  ensureAuth(orgId: string, connectionId: string): Promise<void>

  // Campaign CRUD
  createCampaign(input: CreateCampaignInput): Promise<CreateResult>
  updateCampaign(campaignId: string, updates: Partial<CreateCampaignInput>): Promise<CreateResult>
  deleteCampaign(campaignId: string): Promise<void>
  pauseCampaign(campaignId: string): Promise<void>
  resumeCampaign(campaignId: string): Promise<void>

  // Ad Set CRUD
  createAdSet(input: CreateAdSetInput): Promise<CreateResult>
  updateAdSet(adSetId: string, updates: Partial<CreateAdSetInput>): Promise<CreateResult>
  deleteAdSet(adSetId: string): Promise<void>

  // Ad CRUD
  createAd(input: CreateAdInput): Promise<CreateResult>
  updateAd(adId: string, updates: Partial<CreateAdInput>): Promise<CreateResult>
  deleteAd(adId: string): Promise<void>

  // Resources
  getAdAccounts(): Promise<AdAccount[]>
  getPages(adAccountId: string): Promise<Page[]>
  getPixels(adAccountId: string): Promise<Pixel[]>
  getAudiences(adAccountId: string): Promise<Audience[]>
  getLeadForms(pageId: string): Promise<LeadForm[]>

  // Media
  uploadImage(adAccountId: string, imageData: Buffer, fileName: string): Promise<MediaResult>
  uploadVideo(adAccountId: string, videoData: Buffer, fileName: string): Promise<MediaResult>
  getMediaLibrary(adAccountId: string, type: 'image' | 'video'): Promise<Media[]>

  // Insights
  getMetrics(scope: MetricsScope, dateFrom: string, dateTo: string): Promise<AdMetrics[]>
  getBreakdownMetrics(scope: MetricsScope, breakdownBy: string, dateFrom: string, dateTo: string): Promise<BreakdownMetrics[]>
}
```

#### 2. **MetaAdapter** (Implémentation)
```typescript
// apps/api/src/providers/meta/meta.adapter.ts
export class MetaAdapter implements ProviderAdapter {
  readonly name = 'META' as const

  constructor(
    private apiClient: MetaApiClient,
    private mapper: MetaMapper
  ) {}

  async createCampaign(input: CreateCampaignInput): Promise<CreateResult> {
    // 1. Map SDK types → Meta API types
    const metaPayload = this.mapper.toMetaCampaign(input)

    // 2. Call Meta API
    const response = await this.apiClient.createCampaign(metaPayload)

    // 3. Map Meta response → SDK types
    return this.mapper.toCreateResult(response)
  }

  async uploadVideo(adAccountId: string, videoData: Buffer, fileName: string): Promise<MediaResult> {
    return this.apiClient.uploadVideo(adAccountId, videoData, fileName)
  }

  // ... other methods
}
```

#### 3. **MetaApiClient** (Pure API calls)
```typescript
// apps/api/src/providers/meta/meta.api-client.ts
export class MetaApiClient {
  private readonly baseUrl = 'https://graph.facebook.com/v24.0'

  constructor(
    private accessToken: string,
    private adAccountId: string
  ) {}

  async createCampaign(payload: MetaCampaignPayload): Promise<MetaCampaignResponse> {
    const response = await axios.post(
      `${this.baseUrl}/act_${this.adAccountId}/campaigns`,
      payload,
      { params: { access_token: this.accessToken } }
    )
    return response.data
  }

  async uploadVideo(adAccountId: string, videoData: Buffer, fileName: string): Promise<MetaVideoResponse> {
    // Resumable upload logic
    // ...
  }

  // ... other API methods (GET, POST, DELETE)
}
```

#### 4. **MetaMapper** (Type conversion)
```typescript
// apps/api/src/providers/meta/meta.mapper.ts
export class MetaMapper {
  /**
   * Convert SDK CampaignInput → Meta API payload
   */
  toMetaCampaign(input: CreateCampaignInput): MetaCampaignPayload {
    return {
      name: input.name,
      objective: this.mapObjective(input.objective),
      status: input.status,
      special_ad_categories: [],
      // ... other Meta-specific fields
    }
  }

  /**
   * Convert Meta API response → SDK CreateResult
   */
  toCreateResult(response: MetaCampaignResponse): CreateResult {
    return {
      id: response.id,
      platform: 'META',
      createdAt: new Date(),
      // ... other fields
    }
  }

  private mapObjective(objective: string): string {
    const map: Record<string, string> = {
      'Awareness': 'OUTCOME_AWARENESS',
      'Traffic': 'OUTCOME_TRAFFIC',
      'Engagement': 'OUTCOME_ENGAGEMENT',
      'Leads': 'OUTCOME_LEADS',
      'AppPromotion': 'OUTCOME_APP_PROMOTION',
      'Sales': 'OUTCOME_SALES',
    }
    return map[objective] || 'OUTCOME_TRAFFIC'
  }
}
```

#### 5. **CampaignsService** (Business Logic)
```typescript
// apps/api/src/campaigns/campaigns.service.ts
export class CampaignsService {
  constructor(
    private providerFactory: ProviderFactory,
    private connectionManager: ConnectionManager
  ) {}

  async launchBulkCampaign(
    organizationId: string,
    platform: PlatformType,
    bulkData: BulkCampaignData
  ): Promise<BulkLaunchResult> {
    // 1. Get connection (access token)
    const connection = await this.connectionManager.getConnection(organizationId, platform)

    // 2. Create adapter
    const adapter = this.providerFactory.create({
      platform,
      credentials: {
        accessToken: connection.accessToken,
        adAccountId: connection.adAccountId,
      },
    })

    // 3. Launch campaigns (platform-agnostic logic)
    const results = []
    for (const campaign of bulkData.campaigns) {
      const campaignResult = await adapter.createCampaign(campaign)

      for (const adSet of campaign.adSets) {
        const adSetResult = await adapter.createAdSet({
          ...adSet,
          campaignId: campaignResult.id,
        })

        for (const ad of adSet.ads) {
          const adResult = await adapter.createAd({
            ...ad,
            adSetId: adSetResult.id,
          })
          results.push(adResult)
        }
      }
    }

    return { results, platform, totalAds: results.length }
  }
}
```

---

## 📋 Plan de Refactoring Meta → Multi-Plateforme

### **Phase 1: Refactor Meta (1 semaine)**

#### Étape 1.1: Créer MetaApiClient (1 jour)
- [ ] Extraire tous les `axios` calls de `facebook.service.ts`
- [ ] Créer `meta.api-client.ts` avec méthodes pures
- [ ] Tester unitairement chaque méthode

#### Étape 1.2: Créer MetaMapper (0.5 jour)
- [ ] Créer `meta.mapper.ts`
- [ ] Implémenter conversions SDK ↔ Meta API
- [ ] Tests unitaires

#### Étape 1.3: Implémenter MetaAdapter (1 jour)
- [ ] Remplacer le stub `meta.adapter.ts`
- [ ] Implémenter toutes les méthodes de `ProviderAdapter`
- [ ] Utiliser `MetaApiClient` + `MetaMapper`

#### Étape 1.4: Migrer facebook.service.ts → CampaignsService (2 jours)
- [ ] Créer `campaigns.service.ts` (business logic)
- [ ] Utiliser `ProviderFactory` pour créer adapters
- [ ] Migrer `launchBulkCampaign()` en platform-agnostic
- [ ] Tester avec Meta

#### Étape 1.5: Cleanup (0.5 jour)
- [ ] Supprimer `facebook.service.ts` (ou le réduire drastiquement)
- [ ] Update tRPC routers pour utiliser `CampaignsService`
- [ ] Tests end-to-end

---

### **Phase 2: Ajouter Opérations Manquantes (3 jours)**

#### Étape 2.1: Delete Operations (0.5 jour)
- [ ] `MetaAdapter.deleteCampaign()`
- [ ] `MetaAdapter.deleteAdSet()`
- [ ] `MetaAdapter.deleteAd()`

#### Étape 2.2: Update Operations (1 jour)
- [ ] `MetaAdapter.updateCampaign()`
- [ ] `MetaAdapter.updateAdSet()`
- [ ] `MetaAdapter.updateAd()`

#### Étape 2.3: Batch Operations (0.5 jour)
- [ ] `MetaAdapter.batchUpdateStatus()`

#### Étape 2.4: UI pour Delete/Update (1 jour)
- [ ] Boutons Delete dans Dashboard
- [ ] Formulaires Update
- [ ] Tests

---

### **Phase 3: Préparer Google Ads (1 semaine)**

#### Étape 3.1: Setup Google Ads API (1 jour)
- [ ] Créer compte Google Ads Developer
- [ ] Obtenir credentials OAuth
- [ ] Setup `google-ads-api` npm package

#### Étape 3.2: Créer GoogleAdsAdapter (3 jours)
- [ ] `google.api-client.ts` (Google Ads API calls)
- [ ] `google.mapper.ts` (SDK ↔ Google types)
- [ ] `google.adapter.ts` (implémente `ProviderAdapter`)

#### Étape 3.3: Tester Google Ads (1 jour)
- [ ] Créer campagne de test
- [ ] Vérifier metrics
- [ ] Comparer avec Meta

#### Étape 3.4: UI Multi-Platform (2 jours)
- [ ] Platform selector (Meta vs Google)
- [ ] Connection settings per platform
- [ ] Launch sur Google depuis Bulk Launcher

---

## 🎯 Priorités IMMÉDIATES (Avant Google Ads)

### **Option A: Finir Meta à 100% d'abord** ⭐ RECOMMANDÉ
1. **Ajouter Delete/Update operations** (1-2 jours)
   - Delete campaign/adset/ad
   - Update campaign/adset/ad
   - UI pour ces actions

2. **Refactor vers architecture multi-plateforme** (1 semaine)
   - MetaApiClient + MetaMapper
   - Implémenter vrai MetaAdapter (pas stub)
   - CampaignsService platform-agnostic

**Avantage**: Base solide pour Google Ads, pas de dette technique

---

### **Option B: Google Ads Direct (Quick & Dirty)** ⚠️
1. **Créer `google.service.ts`** (comme `facebook.service.ts`)
2. **Duplicate toute la logique Meta pour Google**
3. **Tester Google Ads rapidement**

**Avantage**: Rapide (3-4 jours)
**Inconvénient**: Duplication de code, dette technique

---

## 💡 Ma Recommandation

**Option A: Refactor d'abord, Google ensuite**

**Raisons**:
1. ✅ Tu as déjà un Provider pattern en place (mais stub)
2. ✅ `facebook.service.ts` = 3,125 lignes (trop gros, dur à maintenir)
3. ✅ Si tu duplicates cette logique pour Google, tu auras 6,000+ lignes de duplication
4. ✅ Refactorer maintenant = investissement qui paye pour chaque nouvelle plateforme
5. ✅ Architecture propre = plus facile d'ajouter TikTok, LinkedIn, Snap ensuite

**Timeline**:
- **Semaine 1**: Refactor Meta (MetaAdapter réel + CampaignsService)
- **Semaine 2**: Add Delete/Update operations
- **Semaine 3**: Google Ads Adapter
- **Semaine 4**: Tests + UI multi-platform

**Total: 1 mois pour avoir Meta + Google, architecture scalable**

---

## ✅ Checklist Finale

### Meta à 100%
- [ ] MetaApiClient (pure API calls)
- [ ] MetaMapper (type conversions)
- [ ] MetaAdapter (implémente ProviderAdapter)
- [ ] Delete operations (campaign, adset, ad)
- [ ] Update operations (campaign, adset, ad)
- [ ] Batch operations (status update)
- [ ] UI pour delete/update

### Architecture Multi-Plateforme
- [ ] ProviderAdapter interface complète
- [ ] ProviderFactory fonctionnel
- [ ] ConnectionManager (simple, sans OAuth pour le moment)
- [ ] CampaignsService (business logic platform-agnostic)
- [ ] Tests unitaires pour chaque adapter

### Google Ads Ready
- [ ] GoogleApiClient
- [ ] GoogleMapper
- [ ] GoogleAdapter
- [ ] Tests end-to-end
- [ ] UI platform selector

---

## 🚀 Prochaine Étape

**Tu veux que je commence par quoi ?**

1. **Refactor Meta**: Créer MetaApiClient + MetaMapper + MetaAdapter réel
2. **Add Delete/Update**: Ajouter les opérations manquantes à Meta
3. **Simple ConnectionManager**: Table locale pour stocker tokens (SQLite + Prisma)
4. **Google Ads Direct**: Commencer Google sans refactorer (quick & dirty)

**Mon conseil**: Commencer par **#1 Refactor Meta** pour avoir une base solide. Ça prendra 3-4 jours mais ça va faciliter Google Ads (et toutes les futures plateformes).

Qu'est-ce que tu en penses ?

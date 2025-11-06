# Facebook API v24 - Guide de Référence

## 📋 Vue d'ensemble

Ce document décrit l'implémentation complète de Facebook API v24 dans le Bulk Launcher.

**Structure hiérarchique :**
```
Campaign
 ├── Ad Set(s)
 │     ├── Ad(s)
 │     │     └── Creative(s)
```

## 🎯 Configuration du Launcher

### Auto-complétion intelligente

Le launcher auto-complète automatiquement les champs Facebook API v24 selon l'objectif choisi :

```typescript
import { autoCompleteCampaignConfig } from '@launcher-ads/sdk'

const campaign = autoCompleteCampaignConfig({
  type: 'Traffic',
  name: 'Ma campagne',
  redirectionType: 'LANDING_PAGE',
  redirectionUrl: 'https://example.com',
})

// Résultat auto-complété :
// {
//   ...
//   objective: 'OUTCOME_TRAFFIC',
//   optimizationGoal: 'LINK_CLICKS',
//   billingEvent: 'IMPRESSIONS',
//   bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
//   buyingType: 'AUCTION',
//   destinationType: 'WEBSITE',
// }
```

### Validation de configuration

```typescript
import { validateCampaignConfiguration } from '@launcher-ads/sdk'

const { valid, errors, warnings } = validateCampaignConfiguration(campaign)

if (!valid) {
  console.error('Erreurs de configuration :', errors)
}
```

## 📊 Objectifs supportés

| Type Campaign | Objectif Facebook | Usage typique |
|---------------|-------------------|---------------|
| `Awareness` | `OUTCOME_AWARENESS` | Notoriété, reach |
| `Traffic` | `OUTCOME_TRAFFIC` | Trafic vers site/app |
| `Engagement` | `OUTCOME_ENGAGEMENT` | Interactions, likes |
| `Leads` | `OUTCOME_LEADS` | Formulaires lead |
| `AppPromotion` | `OUTCOME_APP_PROMOTION` | Installation app |
| `Sales` | `OUTCOME_SALES` | Conversions, achats |

## 🔧 Champs CampaignConfig

### Champs de base

```typescript
interface CampaignConfig {
  // Identité
  name: string
  type: CampaignType // 'Traffic', 'Sales', etc.

  // Redirection
  redirectionType: 'LANDING_PAGE' | 'LEAD_FORM' | 'DEEPLINK'
  redirectionUrl?: string
  redirectionFormId?: string
  redirectionDeeplink?: string

  // Budget
  budgetMode: 'CBO' | 'ABO'
  budgetType: 'daily' | 'lifetime'
  budget: number

  // Dates
  startDate: string
  endDate?: string
}
```

### Champs Facebook API v24

```typescript
interface CampaignConfig {
  // Auto-complétés selon le type
  objective?: string // Ex: 'OUTCOME_TRAFFIC'
  optimizationGoal?: string // Ex: 'LINK_CLICKS'
  billingEvent?: string // Ex: 'IMPRESSIONS'
  bidStrategy?: string // Ex: 'LOWEST_COST_WITHOUT_CAP'
  buyingType?: string // 'AUCTION' (défaut)
  destinationType?: string // 'WEBSITE', 'APP', etc.

  // Promoted Object (conversions)
  pixelId?: string // Pour conversions off-Facebook
  customEventType?: string // 'PURCHASE', 'LEAD', etc.
  applicationId?: string // Pour app promotion
  objectStoreUrl?: string // URL App/Play Store
  productCatalogId?: string // Pour dynamic ads
  productSetId?: string

  // Special Ad Categories
  specialAdCategories?: string[] // ['HOUSING'], ['CREDIT'], etc.
  specialAdCategoryCountry?: string[] // ['FR'], ['US'], etc.
}
```

## 🎨 Exemples par cas d'usage

### 1. Campagne Traffic simple

```typescript
const campaign: Partial<CampaignConfig> = {
  name: 'Traffic vers site',
  type: 'Traffic',
  redirectionType: 'LANDING_PAGE',
  redirectionUrl: 'https://example.com',
  budget: 50,
  budgetType: 'daily',
  budgetMode: 'CBO',
}

// Auto-complété avec :
// objective: 'OUTCOME_TRAFFIC'
// optimizationGoal: 'LINK_CLICKS'
// destinationType: 'WEBSITE'
```

### 2. Campagne Conversions avec Pixel

```typescript
const campaign: Partial<CampaignConfig> = {
  name: 'Ventes e-commerce',
  type: 'Sales',
  redirectionType: 'LANDING_PAGE',
  redirectionUrl: 'https://shop.example.com',
  pixelId: '123456789',
  customEventType: 'PURCHASE',
  budget: 100,
  budgetType: 'daily',
}

// Auto-complété avec :
// objective: 'OUTCOME_SALES'
// optimizationGoal: 'OFFSITE_CONVERSIONS'
```

### 3. Campagne Lead Form natif

```typescript
const campaign: Partial<CampaignConfig> = {
  name: 'Génération leads',
  type: 'Leads',
  redirectionType: 'LEAD_FORM',
  redirectionFormId: 'form_123',
  budget: 30,
  budgetType: 'daily',
}

// Auto-complété avec :
// objective: 'OUTCOME_LEADS'
// optimizationGoal: 'LEAD_GENERATION'
// destinationType: 'ON_AD'
```

### 4. App Promotion

```typescript
const campaign: Partial<CampaignConfig> = {
  name: 'Installation app mobile',
  type: 'AppPromotion',
  redirectionType: 'DEEPLINK',
  redirectionDeeplink: 'myapp://welcome',
  applicationId: 'app_456',
  objectStoreUrl: 'https://apps.apple.com/app/...',
  budget: 75,
  budgetType: 'daily',
}

// Auto-complété avec :
// objective: 'OUTCOME_APP_PROMOTION'
// optimizationGoal: 'APP_INSTALLS'
// destinationType: 'APP'
```

### 5. Special Ad Category (Logement)

```typescript
const campaign: Partial<CampaignConfig> = {
  name: 'Promotion immobilière',
  type: 'Traffic',
  redirectionType: 'LANDING_PAGE',
  redirectionUrl: 'https://realestate.example.com',
  specialAdCategories: ['HOUSING'],
  specialAdCategoryCountry: ['FR'],
  budget: 40,
  budgetType: 'daily',
}

// ⚠️ Ciblage restreint :
// - Pas de ciblage par âge précis (18-65+ uniquement)
// - Pas de ciblage par sexe
// - Pas d'intérêts détaillés
```

## ⚙️ Mappings disponibles

### Optimization Goals par objectif

```typescript
import {
  OBJECTIVE_TO_OPTIMIZATION_GOALS,
  DEFAULT_OPTIMIZATION_GOAL
} from '@launcher-ads/sdk'

// Objectif → Goals autorisés
OBJECTIVE_TO_OPTIMIZATION_GOALS['OUTCOME_TRAFFIC']
// → ['LINK_CLICKS', 'LANDING_PAGE_VIEWS']

// Goal recommandé par défaut
DEFAULT_OPTIMIZATION_GOAL['OUTCOME_TRAFFIC']
// → 'LINK_CLICKS'
```

### Billing Events par objectif

```typescript
import {
  OBJECTIVE_TO_BILLING_EVENTS,
  DEFAULT_BILLING_EVENT
} from '@launcher-ads/sdk'

OBJECTIVE_TO_BILLING_EVENTS['OUTCOME_TRAFFIC']
// → ['IMPRESSIONS', 'LINK_CLICKS']

DEFAULT_BILLING_EVENT['OUTCOME_TRAFFIC']
// → 'IMPRESSIONS'
```

### Destination Types par objectif

```typescript
import { OBJECTIVE_TO_DESTINATION_TYPES } from '@launcher-ads/sdk'

OBJECTIVE_TO_DESTINATION_TYPES['OUTCOME_TRAFFIC']
// → ['WEBSITE', 'APP', 'MESSENGER', 'WHATSAPP', 'INSTAGRAM_DIRECT']
```

## 🔍 Validation et champs requis

### Vérifier les champs requis

```typescript
import { getRequiredPromotedObjectFields } from '@launcher-ads/sdk'

const required = getRequiredPromotedObjectFields(
  'OUTCOME_SALES',
  'OFFSITE_CONVERSIONS'
)

// Résultat :
// {
//   pixelId: true,       // REQUIS
//   pageId: false,
//   applicationId: false,
//   objectStoreUrl: false,
//   customEventType: false,
//   productCatalogId: false,
// }
```

### Suggestions d'amélioration

```typescript
import { suggestCampaignImprovements } from '@launcher-ads/sdk'

const suggestions = suggestCampaignImprovements(campaign)

// Exemple de suggestions :
// [
//   'Pixel Facebook fortement recommandé pour optimiser les conversions',
//   'Pour du trafic qualifié, considérez LANDING_PAGE_VIEWS au lieu de LINK_CLICKS'
// ]
```

## 📚 Ressources

### Fichiers de configuration

- **Mappings complets** : `packages/sdk/src/constants/facebook-api-v24-config.ts`
- **Helpers** : `packages/sdk/src/utils/campaign-config-helpers.ts`
- **Schéma** : `packages/sdk/src/schemas/bulk-launcher.schema.ts`

### Fonctions utilitaires

```typescript
import {
  // Auto-complétion
  autoCompleteCampaignConfig,

  // Validation
  validateCampaignConfiguration,
  validateCampaignConfig,

  // Helpers
  getRequiredPromotedObjectFields,
  suggestCampaignImprovements,

  // Configs recommandées
  getRecommendedConfig,

  // Mappings
  FACEBOOK_OBJECTIVES,
  OBJECTIVE_TO_OPTIMIZATION_GOALS,
  OBJECTIVE_TO_BILLING_EVENTS,
  OBJECTIVE_TO_DESTINATION_TYPES,
  STANDARD_EVENTS,
} from '@launcher-ads/sdk'
```

## ⚠️ Points d'attention

### Special Ad Categories

Quand `specialAdCategories` est défini (HOUSING, EMPLOYMENT, CREDIT, ISSUES_ELECTIONS_POLITICS) :

1. **Ciblage restreint obligatoire**
   - Âge : 18-65+ uniquement (pas de tranche spécifique)
   - Pas de ciblage par sexe
   - Pas d'intérêts détaillés

2. **Champ obligatoire**
   - `specialAdCategoryCountry` doit être défini (ex: `['FR']`)

3. **Politique spéciale**
   - Pour `ISSUES_ELECTIONS_POLITICS` : autorisation + disclaimer requis

### Conversions off-Facebook

Pour `OUTCOME_SALES` ou `OUTCOME_LEADS` avec redirect externe :

- `pixelId` est **obligatoire**
- `customEventType` recommandé (ex: 'PURCHASE', 'LEAD')
- Pixel doit être installé et actif sur le site

### App Promotion

Pour `OUTCOME_APP_PROMOTION` :

- `applicationId` est **obligatoire**
- `objectStoreUrl` est **obligatoire**
- `destinationType` doit être 'APP'

## 🚀 Prochaines étapes

Le launcher supporte maintenant **toutes les configurations Facebook API v24**.

Pour ajouter un nouveau type de campagne :

1. Mettre à jour `facebook-api-v24-config.ts` avec les mappings
2. Ajouter le type dans `campaignTypeSchema`
3. Créer l'interface utilisateur correspondante
4. Tester la validation avec `validateCampaignConfiguration`

---

**Documentation complète :** [Facebook Marketing API v24](https://developers.facebook.com/docs/marketing-api)

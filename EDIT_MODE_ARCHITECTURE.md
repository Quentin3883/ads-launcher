# Architecture : Mode Édition & Duplication

## 📋 Vue d'ensemble

Le launcher doit supporter 2 modes :
1. **Mode CREATE** (actuel) - Création de nouvelles campagnes from scratch
2. **Mode EDIT** (nouveau) - Modification/duplication de campagnes existantes

## 🎯 Cas d'usage

### 1. Modification de campagnes existantes
- **Ajuster budget** d'un ou plusieurs ad sets
- **Ajouter audiences** à une campagne existante
- **Ajouter creatives** à un ad set existant ou nouveau ad set
- **Modifier targeting** (geo, demographics, placements)

### 2. Duplication intelligente
- **Dupliquer ad set** avec possibilité de modifier paramètres
  - Example : Passer de Broad → Interest sans re-upload creatives
  - Example : Changer geo targeting France → USA
- **Dupliquer campagne** entière avec modifications
  - Changer budget structure (ABO → CBO)
  - Modifier objectif de campagne

### 3. Combinaison Create + Edit
- Créer nouvel ad set dans campagne existante
- Ajouter creatives existants à nouveaux ad sets

## 🏗️ Impact Architecture

### 1. Store State (bulk-launcher.ts)

```typescript
export interface BulkLauncherState {
  // Nouveau : Mode d'opération
  mode: 'create' | 'edit' | null
  setMode: (mode: 'create' | 'edit' | null) => void

  // Nouveau : Référence aux objets existants
  editContext: {
    campaignId?: string
    adSetIds?: string[]
    sourceData?: {
      campaign?: FacebookCampaign
      adSets?: FacebookAdSet[]
      ads?: FacebookAd[]
    }
  } | null
  setEditContext: (context: EditContext | null) => void

  // Nouveau : Stratégie de merge
  editStrategy: {
    keepExistingCreatives: boolean
    keepExistingAudiences: boolean
    duplicateMode: 'reference' | 'copy' // reference = réutiliser creatives, copy = dupliquer
  }

  // Existant - reste inchangé
  campaign: Partial<CampaignConfig>
  bulkAudiences: BulkAudiencesConfig
  bulkCreatives: BulkCreativesConfig
  // ...
}
```

### 2. API Endpoints nécessaires

#### Fetch existant (pour pré-remplir le launcher)
```typescript
GET /facebook/campaigns/:campaignId/full
Response: {
  campaign: Campaign
  adSets: AdSet[]
  ads: Ad[]
  creatives: Creative[] // avec media URLs
}

GET /facebook/ad-sets/:adSetId/full
Response: {
  adSet: AdSet
  ads: Ad[]
  creatives: Creative[]
}
```

#### Update/Create hybride
```typescript
POST /facebook/campaigns/:campaignId/update-with-matrix
Body: {
  mode: 'add' | 'replace' | 'duplicate'
  campaignUpdates?: Partial<Campaign>
  newAdSets: GeneratedAdSet[]
  existingAdSetUpdates?: { id: string, updates: Partial<AdSet> }[]
  creativeStrategy: 'reference' | 'upload' // référencer existants ou upload nouveaux
  creativeReferences?: { existingCreativeId: string, useIn: string[] }[]
}
```

### 3. UI Flow

#### Point d'entrée Edit Mode
```
Launches Page → Row Actions → [Edit | Duplicate]
  ↓
BulkLauncherModal (mode='edit', campaignId='xxx')
  ↓
1. Fetch campaign data
2. Hydrate store with existing data
3. Show wizard with pre-filled values
4. User modifies what they want
5. Generate diff & apply changes
```

#### Pre-fill Logic
```typescript
// Dans BulkLauncherModal
useEffect(() => {
  if (mode === 'edit' && campaignId) {
    // 1. Fetch existing campaign
    const data = await fetchCampaignFull(campaignId)

    // 2. Transform Facebook data → Launcher format
    const launcherCampaign = transformToLauncherFormat(data)

    // 3. Hydrate store
    bulkLauncherStore.setState({
      mode: 'edit',
      editContext: { campaignId, sourceData: data },
      campaign: launcherCampaign.campaign,
      bulkAudiences: launcherCampaign.audiences,
      bulkCreatives: launcherCampaign.creatives,
    })
  }
}, [mode, campaignId])
```

### 4. Transformer Functions

```typescript
// Transform Facebook API format → Launcher format
function transformFacebookToLauncher(data: FacebookCampaignFull): LauncherState {
  return {
    campaign: {
      name: data.campaign.name,
      objective: data.campaign.objective,
      budgetType: data.campaign.budget_optimization ? 'cbo' : 'abo',
      // ...
    },
    bulkAudiences: {
      audiences: data.adSets.map(adSet => ({
        id: adSet.id,
        type: inferAudienceType(adSet.targeting),
        name: adSet.name,
        targeting: adSet.targeting,
      })),
      // ...
    },
    bulkCreatives: {
      creatives: data.ads.map(ad => ({
        id: ad.creative.id,
        type: ad.creative.object_type,
        mediaUrl: ad.creative.image_url || ad.creative.video_id,
        existingCreativeId: ad.creative.id, // IMPORTANT : référence
      })),
      // ...
    }
  }
}

// Transform Launcher format → Facebook API updates
function transformLauncherToFacebookUpdates(
  state: BulkLauncherState,
  editContext: EditContext
): FacebookUpdatePayload {
  // Compare state vs editContext.sourceData
  // Generate diff
  // Return only what changed
}
```

### 5. Creative Re-use Strategy

**Problème** : Éviter re-upload de videos/images déjà sur Facebook

**Solution** :
```typescript
interface Creative {
  id: string // Local ID
  type: 'image' | 'video' | 'carousel'

  // Option 1 : Nouveau creative (upload requis)
  file?: File
  mediaUrl?: string // pour preview

  // Option 2 : Référence à creative existant
  existingCreativeId?: string // Facebook creative ID
  existingAdId?: string // Facebook ad ID to copy from

  // Metadata
  name?: string
  headline?: string
  primaryText?: string
}

// Dans generation logic
if (creative.existingCreativeId) {
  // Réutiliser le creative Facebook existant
  adPayload.creative_id = creative.existingCreativeId
} else if (creative.file) {
  // Upload nouveau creative
  const uploadedCreative = await uploadCreative(creative.file)
  adPayload.creative_id = uploadedCreative.id
}
```

### 6. Matrix Generation adaptée

```typescript
function generateAdSetsFromMatrix(config: MatrixConfig, mode: 'create' | 'edit') {
  const adSets = []

  if (mode === 'edit') {
    // Logique spéciale pour edit mode
    // - Garder IDs des ad sets existants si on modifie
    // - Générer nouveaux IDs seulement pour nouveaux ad sets
    // - Merger avec existant
  } else {
    // Logique actuelle (create from scratch)
  }

  return adSets
}
```

## 📊 UI/UX Considerations

### 1. Visual Indicators
- Badge "EDIT MODE" en haut du modal
- Highlight des valeurs qui ont changé vs original
- Option "Reset to original" pour chaque section

### 2. Creatives Section
```
┌─────────────────────────────────────┐
│ Existing Creatives (3)              │
│ [✓] Video_1.mp4  [Edit copy]        │
│ [✓] Image_2.jpg  [Edit copy]        │
│ [ ] Video_3.mp4                      │ ← checkbox : garder ou non
│                                      │
│ + Add new creatives                  │
└─────────────────────────────────────┘
```

### 3. Audiences Section
```
┌─────────────────────────────────────┐
│ Existing Ad Sets (2)                 │
│ • Broad - France (Active) [Edit]     │
│ • Interest - Sports (Active) [Edit]  │
│                                      │
│ + Add new audiences                  │
│ + Duplicate existing                 │
└─────────────────────────────────────┘
```

### 4. Preview Changes
Avant soumission, montrer diff :
```
Changes to Campaign "Summer Sale":
✏️ Budget: $500/day → $800/day
➕ New Ad Set: Interest - Gaming (France)
➕ New Ad Set: Lookalike 1% (USA)
✏️ Ad Set "Broad - France": Added 2 new creatives
```

## 🔄 Duplicate Flow specifique

### Dupliquer un Ad Set
```typescript
// User clicks "Duplicate" sur un ad set
async function duplicateAdSet(adSetId: string) {
  // 1. Open launcher in edit mode
  openBulkLauncher({
    mode: 'edit',
    duplicateFrom: { type: 'adset', id: adSetId }
  })

  // 2. Pre-fill TOUT (audiences, creatives, copy)
  // 3. User peut changer ce qu'il veut (ex: Broad → Interest)
  // 4. Submit crée NOUVEAU ad set avec références aux creatives existants
}
```

**Key insight** : La duplication = Edit mode + flag `createNew: true`

## 🚀 Plan d'implémentation

### Phase 1 : Foundation (Sprint actuel ?)
- [ ] Ajouter `mode` et `editContext` au store
- [ ] Créer transformer functions (Facebook ↔ Launcher)
- [ ] API endpoint pour fetch campaign/adset full data
- [ ] Support `existingCreativeId` dans Creative interface

### Phase 2 : Edit Mode basique
- [ ] UI pour entrer en edit mode depuis Launches page
- [ ] Hydratation du store avec data existante
- [ ] Visual indicators (badges, highlights)
- [ ] Generation logic adaptée pour merge

### Phase 3 : Duplicate
- [ ] Duplicate button UI
- [ ] Logique de duplication (copy vs reference)
- [ ] Preview des changes avant submit

### Phase 4 : Advanced
- [ ] Budget bulk edit (modifier plusieurs ad sets à la fois)
- [ ] Creative library (réutiliser creatives across campaigns)
- [ ] Version history / Rollback

## 🤔 Questions à résoudre

1. **Permissions** : Comment gérer les ad sets qu'on ne peut pas modifier (ex: archivés) ?
2. **Validation** : Quelles validations Facebook spécifiques en edit mode ?
3. **Optimistic updates** : Update UI avant confirmation Facebook ?
4. **Error handling** : Si 1 ad set sur 5 fail to update, que faire ?
5. **Cache** : Comment gérer le cache des creatives pour preview rapide ?

## 📝 Notes

- **Backward compatibility** : Le mode create actuel ne doit pas être impacté
- **Type safety** : Utiliser discriminated unions pour mode create vs edit
- **Testing** : Créer des fixtures pour tester edit mode sans toucher vraie campagne

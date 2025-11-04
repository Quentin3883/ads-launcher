# 🚀 Bulk Launcher - Roadmap & TODO

## ✅ Completed Features

### Creative Labels System (2024-01-XX)

- [x] Added label field to creatives: Static / Video / UGC / Other
- [x] Implemented colorful pill-style UI for label selection
- [x] Auto-detection: Images → Static, Videos → UGC (if filename contains "ugc") or Video
- [x] Users can manually change labels via pill buttons
- [x] Modified uploadImage() to return both hash and ID from Facebook API
- [x] Updated ad naming format: `(Label) Name [image_id=123]` or `[video_id=456]`

### Facebook PAC (Placement Asset Customization)

- [x] Implemented PAC for images with Feed/Story variants
- [x] Implemented PAC for videos with Feed/Story variants
- [x] Automatic format detection (AUTOMATIC_FORMAT)
- [x] Consolidated asset customization rules (2 rules instead of 6)
- [x] Instagram Search automatic cropping (1:1 from 9:16)

---

## 📋 Roadmap - Bulk Launcher v2

### 🎯 Phase 1: Flexibilité des Creatives & Wording

#### 1.1 Wording par créative

**Objectif:** Chaque creative peut avoir son propre wording personnalisé

- [ ] Ajouter des champs wording optionnels par creative (headline, primaryText, CTA)
- [ ] UI: Section expandable/collapsible sous chaque creative card
- [ ] Logique: Si wording custom → utiliser, sinon → fallback sur global
- [ ] Alternative: Système de variantes de copy attachées à des creatives spécifiques

**Fichiers concernés:**

- `packages/sdk/src/schemas/bulk-launcher.schema.ts` - Ajouter wording optionnel au schema creative
- `apps/web/components/bulk-launcher/steps/creatives-bulk-step.tsx` - UI pour wording custom
- `packages/sdk/src/utils/matrix.ts` - Logique de fallback wording

---

#### 1.2 Paramètres dynamiques dans les wordings

**Objectif:** Variables dynamiques type `{{city}}`, `{{region}}`, `{{audience}}`, `{{label}}`

**Exemples d'usage:**

```
Headline: "Découvrez {{city}} avec {{label}}"
→ "Découvrez Paris avec UGC"
→ "Découvrez Lyon avec Video"

Primary Text: "Les meilleurs {{interest}} pour {{region}}"
→ "Les meilleurs restaurants pour Île-de-France"
```

**Tasks:**

- [ ] Définir la liste des variables disponibles (`{{city}}`, `{{region}}`, `{{country}}`, `{{label}}`, `{{format}}`, `{{audience}}`, `{{interest}}`)
- [ ] Créer une fonction `replaceDynamicParams(text, context)` dans SDK
- [ ] Appliquer le remplacement lors de la génération de matrix
- [ ] UI: Preview des variables disponibles + autocomplete
- [ ] Validation: Alerter si variable utilisée mais dimension non splittée

**Fichiers concernés:**

- `packages/sdk/src/utils/dynamic-params.ts` (nouveau fichier)
- `packages/sdk/src/utils/matrix.ts` - Appliquer replacement
- `apps/web/components/bulk-launcher/steps/creatives-bulk-step.tsx` - UI helper/preview

---

### 🗺️ Phase 2: Split & Segmentation Avancée

#### 2.1 Multi-AdSet flexible (non-dupliqué)

**Objectif:** Créer plusieurs AdSets avec des configs différentes dans la même campagne

**Concept:**
Au lieu d'un seul "template" d'AdSet qui se duplique, avoir un tableau où chaque ligne = 1 AdSet unique avec sa propre config.

**UI proposée:**

```
┌─────────────────────────────────────────────────────────────┐
│ AdSet 1: Paris - UGC - Instagram                            │
│   - Geo: Paris                                              │
│   - Creatives: [UGC only]                                   │
│   - Placements: Instagram Feed + Story                      │
│   - Budget: 50€/day                                         │
├─────────────────────────────────────────────────────────────┤
│ AdSet 2: Lyon - Static - Facebook                          │
│   - Geo: Lyon                                               │
│   - Creatives: [Static only]                               │
│   - Placements: Facebook Feed                               │
│   - Budget: 30€/day                                         │
└─────────────────────────────────────────────────────────────┘
[+ Add AdSet]
```

**Tasks:**

- [ ] Nouveau step "AdSet Builder" avec table éditable
- [ ] Chaque row = un AdSet avec ses propres settings
- [ ] Actions: Add, Duplicate, Delete, Reorder
- [ ] Validation: Au moins 1 AdSet, chaque AdSet a geo + creatives + placements

**Fichiers concernés:**

- `apps/web/components/bulk-launcher/steps/adset-builder-step.tsx` (nouveau)
- `packages/sdk/src/schemas/bulk-launcher.schema.ts` - Schema pour AdSet flexible
- Update du flow dans `apps/web/lib/store/bulk-launcher.ts`

---

#### 2.2 Split par dimensions multiples

**Objectif:** Sélectionner les dimensions de split pour auto-générer les AdSets

**UI proposée:**

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Matrix Split Configuration                               │
│                                                             │
│ Select split dimensions:                                    │
│   ☑️ Split by Label (3 labels: Static, Video, UGC)         │
│   ☑️ Split by City (5 cities selected)                     │
│   ☐ Split by Format (Image vs Video)                       │
│   ☐ Split by Placement (Instagram vs Facebook)             │
│   ☐ Split by Placement Type (Feed vs Story)                │
│   ☐ Split by Interest (2 interests selected)               │
│                                                             │
│ Result: 15 AdSets (3 labels × 5 cities)                    │
│                                                             │
│ Preview:                                                    │
│   1. Static - Paris                                         │
│   2. Static - Lyon                                          │
│   3. Static - Marseille                                     │
│   4. Video - Paris                                          │
│   ...                                                       │
└─────────────────────────────────────────────────────────────┘
```

**Dimensions disponibles:**

- **Label**: UGC / Video / Static / Other
- **Format**: Image / Video (regroupe les labels)
- **Geo**: Par ville, région, ou pays
- **Placement Platform**: Instagram / Facebook / Audience Network
- **Placement Type**: Feed / Story / Reels / Search
- **Audience/Interest**: 1 AdSet par segment
- **Combinaisons**: Cartesian product des dimensions sélectionnées

**Tasks:**

- [ ] UI: Checkboxes pour sélectionner dimensions de split
- [ ] Calcul preview du nombre d'AdSets (cartesian product)
- [ ] Fonction `generateAdSetsFromSplits()` qui crée la matrice
- [ ] Preview liste des AdSets avant génération
- [ ] Appliquer dynamic params aux wordings selon le split

**Fichiers concernés:**

- `apps/web/components/bulk-launcher/steps/matrix-generation-step.tsx` - Upgrade UI
- `packages/sdk/src/utils/matrix-splitter.ts` (nouveau fichier)
- `packages/sdk/src/utils/matrix.ts` - Integration

---

#### 2.3 Matrix Builder amélioré

**Tasks:**

- [ ] Preview en temps réel du nombre d'AdSets/Ads
- [ ] Estimation de budget par AdSet
- [ ] Warning si trop d'AdSets (>50)
- [ ] Export preview en CSV/JSON
- [ ] "Smart split" suggestions (ex: si >10 cities, suggérer de grouper par région)

---

### 🎯 Phase 3: Targeting & Audiences

#### 3.1 Geolocation fonctionnelle

**Status actuel:** Le composant existe mais pas totalement fonctionnel

**Tasks:**

- [ ] Fixer l'autocomplete multi-pays/régions/villes
- [ ] Intégration Facebook Graph API pour geo search
- [ ] Bulk import: Copier-coller une liste de villes
- [ ] Sauvegarde de presets de geo (ex: "France - Top 10 cities")
- [ ] UI: Tags cliquables pour voir/supprimer
- [ ] Validation: Au moins 1 geo par AdSet

**Fichiers concernés:**

- `apps/web/components/bulk-launcher/components/geo-location-picker.tsx`
- `apps/web/components/bulk-launcher/components/unified-geo-autocomplete.tsx`
- `apps/api/src/facebook/facebook.service.ts` - Ajouter geo search endpoint

---

#### 3.2 Intérêts fonctionnels

**Objectif:** Recherche et sélection d'intérêts Facebook

**Tasks:**

- [ ] Endpoint API pour search Facebook Interests
- [ ] Autocomplete avec suggestions
- [ ] Narrow audience: AND logic entre intérêts
- [ ] Broad audience: OR logic
- [ ] Exclusions d'intérêts (NOT logic)
- [ ] Sauvegarde de presets (ex: "E-commerce buyers", "Tech enthusiasts")
- [ ] UI: Tags + categories

**Fichiers concernés:**

- `apps/web/components/bulk-launcher/components/interest-autocomplete.tsx`
- `apps/api/src/facebook/facebook.service.ts` - Interest search endpoint
- `packages/sdk/src/schemas/bulk-launcher.schema.ts` - Schema interests

---

#### 3.3 Audiences personnalisées

**Objectif:** Utiliser les audiences sauvegardées sur Facebook

**Types d'audiences:**

- Custom Audiences (pixel, liste clients, engagement)
- Lookalike Audiences
- Saved Audiences

**Tasks:**

- [ ] Fetch audiences list depuis Facebook
- [ ] UI: Dropdown/search pour sélectionner
- [ ] Support multiple audiences par AdSet
- [ ] Combinaisons: Inclure / Exclure
- [ ] Preview audience size (si dispo via API)

**Fichiers concernés:**

- `apps/api/src/facebook/facebook.service.ts` - Fetch audiences
- Nouveau composant: `apps/web/components/bulk-launcher/components/audience-selector.tsx`

---

### 🏗️ Phase 4: Types de campagnes & Maintenance

#### 4.1 Support complet des objectifs

**Status:**

- ✅ Traffic (fonctionne)
- ⚠️ Conversions (à tester/fixer)
- ⚠️ Lead Generation (à tester/fixer)
- ❌ Engagement
- ❌ App Install
- ❌ Video Views
- ❌ Messages

**Tasks par objectif:**

**Conversions:**

- [ ] Tester création avec pixel
- [ ] Vérifier optimization_goal mapping
- [ ] Tester avec custom conversions

**Lead Generation:**

- [ ] Sélection de lead forms
- [ ] Preview du form dans l'UI
- [ ] Test de création

**Engagement:**

- [ ] Page likes / Post engagement
- [ ] Event responses

**App Install:**

- [ ] App selection
- [ ] Deep linking
- [ ] Store URLs (iOS/Android)

**Video Views:**

- [ ] ThruPlay optimization
- [ ] 2-second vs 10-second views

**Messages:**

- [ ] Messenger / Instagram / WhatsApp
- [ ] Click-to-message setup

**Fichiers concernés:**

- `packages/sdk/src/constants/campaign.ts` - Objectives mapping
- `apps/api/src/facebook/facebook.service.ts` - Objective-specific logic
- UI conditionnelle selon objective dans steps

---

#### 4.2 Architecture maintenable

**Refactoring prioritaire:**

- [ ] Extraire toute la logique de génération de matrix dans `packages/sdk/src/utils/`
- [ ] Typage strict: Plus de `any`, tout typé avec Zod schemas
- [ ] Separation of concerns: business logic dans SDK, UI dans web
- [ ] Tests unitaires sur matrix generation
- [ ] Tests unitaires sur dynamic params
- [ ] Documentation: JSDoc sur toutes les fonctions publiques

**Structure proposée:**

```
packages/sdk/src/
├── schemas/           # Zod schemas (existant)
├── utils/
│   ├── matrix.ts      # Core matrix logic (existant)
│   ├── matrix-splitter.ts  # Split dimensions logic (nouveau)
│   ├── dynamic-params.ts   # Dynamic param replacement (nouveau)
│   ├── wording.ts     # Wording logic (nouveau)
│   └── validation.ts  # Business validation rules (nouveau)
└── types/             # TypeScript types exports
```

**Tests structure:**

```
packages/sdk/src/__tests__/
├── matrix.test.ts
├── matrix-splitter.test.ts
├── dynamic-params.test.ts
└── wording.test.ts
```

---

### 🎨 Phase 5: UX/UI Polish

#### 5.1 Amélioration UI/UX globale

**Navigation & Flow:**

- [ ] Progress bar plus clair avec steps nommés
- [ ] Validation en temps réel avec feedback visuel
- [ ] Next/Previous avec keyboard (Enter/Esc)
- [ ] Breadcrumb pour sauter entre steps
- [ ] "Save draft" automatique en localStorage

**Creatives Management:**

- [ ] Drag & drop pour réordonner les creatives
- [ ] Bulk actions: Select all, Delete selected, Duplicate selected
- [ ] Quick preview (modal) des images/videos
- [ ] Crop/resize preview pour Feed vs Story
- [ ] Tags/filters sur creatives

**Matrix Preview:**

- [ ] Table view avec colonnes: AdSet / Ad / Creative / Copy / Geo / Audience
- [ ] Filters sur la preview
- [ ] Export preview (CSV, Excel, JSON)
- [ ] Edit inline dans preview avant launch
- [ ] Visual diff si modifications

**General UI:**

- [ ] Dark mode support
- [ ] Mobile responsive (au moins pour preview/monitoring)
- [ ] Keyboard shortcuts (? pour help, cmd+s pour save, etc.)
- [ ] Toast notifications pour success/errors
- [ ] Loading skeletons (pas juste spinners)
- [ ] Empty states avec illustrations

---

#### 5.2 Performance & Feedback

**Loading States:**

- [ ] Skeleton loaders partout
- [ ] Progress bars pour uploads (déjà fait pour video)
- [ ] Estimated time remaining pour long operations

**Error Handling:**

- [ ] Error boundaries React
- [ ] User-friendly error messages
- [ ] "Retry" actions
- [ ] Logs téléchargeables en cas d'erreur

**Success Feedback:**

- [ ] Confetti animation au succès du launch 🎉
- [ ] Summary modal avec liens vers ads/adsets/campaign
- [ ] Copy to clipboard pour IDs
- [ ] Direct links to Facebook Ads Manager

**Undo/Redo:**

- [ ] Undo/Redo global (déjà commencé, à compléter)
- [ ] History panel avec timeline
- [ ] Restore to any previous state

**Auto-save:**

- [ ] Sauvegarde automatique en localStorage toutes les 30s
- [ ] "Restore draft" au reload
- [ ] Multiple drafts avec noms

---

## 🎯 Ordre d'implémentation recommandé

### Sprint 1: Core Features (2-3 semaines)

**Objectif:** Rendre le launcher vraiment utilisable avec les features de base qui fonctionnent

1. [ ] **Geolocation fonctionnelle** (Phase 3.1)
   - Priorité haute car bloquant pour usage réel

2. [ ] **Intérêts fonctionnels** (Phase 3.2)
   - Nécessaire pour targeting réel

3. [ ] **Wording par creative** (Phase 1.1)
   - Feature rapide à implémenter, haute valeur

4. [ ] **Tester & fixer Conversions + Lead Gen** (Phase 4.1)
   - Objectifs les plus utilisés après Traffic

---

### Sprint 2: Advanced Splitting (2-3 semaines)

**Objectif:** Unlock la puissance du bulk launcher avec splits intelligents

5. [ ] **Split par label/format/placement** (Phase 2.2)
   - Core feature pour scaling

6. [ ] **Paramètres dynamiques** (Phase 1.2)
   - Permet personnalisation automatique

7. [ ] **Matrix Builder amélioré** (Phase 2.3)
   - Preview et contrôle avant lancement

8. [ ] **Multi-AdSet flexible** (Phase 2.1)
   - Pour cas complexes

---

### Sprint 3: Audiences & Campaigns (1-2 semaines)

**Objectif:** Support complet de tous les types de campagnes

9. [ ] **Audiences personnalisées** (Phase 3.3)
   - Lookalike, custom audiences

10. [ ] **Support autres objectifs** (Phase 4.1)
    - Engagement, App Install, Video Views, Messages

11. [ ] **Tests end-to-end**
    - Créer 1 campagne de chaque type et vérifier

---

### Sprint 4: Polish & Scale (2-3 semaines)

**Objectif:** Rendre l'outil production-ready et agréable

12. [ ] **Refacto architecture** (Phase 4.2)
    - Clean code, tests, documentation

13. [ ] **UI/UX improvements** (Phase 5.1)
    - Dark mode, drag & drop, keyboard shortcuts

14. [ ] **Performance & Feedback** (Phase 5.2)
    - Loading states, error handling, success feedback

---

## 📊 Métriques de succès

**Objectifs quantifiables:**

- [ ] Temps de création d'une campagne: <5 minutes (vs 30min manuellement)
- [ ] Taux d'erreur: <5% des lancements
- [ ] Support 100% des objectifs Facebook
- [ ] 0 crash/bug bloquant
- [ ] UI responsive: <100ms pour toute action

---

## 🐛 Bugs connus à fix

- [ ] ESLint pre-commit hook (circular JSON)
- [ ] Validation géo qui n'affiche pas toujours les suggestions
- [ ] Copy variants lock pas toujours clair

---

## 💡 Idées futures (Nice to have)

- [ ] Templates de campagnes sauvegardés
- [ ] A/B test automatique avec règles de pause
- [ ] Import depuis Excel/CSV
- [ ] Duplication de campagnes existantes
- [ ] Bulk edit d'AdSets/Ads après création
- [ ] Analytics dashboard intégré
- [ ] AI-powered wording suggestions
- [ ] Image auto-crop avec AI (smart crop sur visages)
- [ ] Collaboration multi-users avec permissions

---

**Dernière mise à jour:** 2025-01-04
**Statut global:** Phase 1 en cours

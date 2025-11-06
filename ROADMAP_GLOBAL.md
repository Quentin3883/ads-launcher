# 🗺️ Roadmap Global - Launcher Ads

## 📍 État actuel (Aujourd'hui)

### ✅ Ce qui fonctionne
- **Bulk Launcher CREATE mode** - Création campagnes from scratch
- **Matrix generation** - Génération automatique d'ad sets (audiences × creatives × copy)
- **UI compacte** - Sections optimisées (geo, placements, audiences, demographics)
- **Real-time targeting** - Autocomplete Facebook API (locations, interests)
- **Upload creatives** - Support images + videos
- **Campaign config** - Budget (ABO/CBO), objectifs, dates

### 🚧 Limitations actuelles
- ❌ Pas de mode EDIT/DUPLICATE
- ❌ Re-upload creatives à chaque fois
- ❌ Pas de wording per creative
- ❌ Pas de paramètres dynamiques ({{city}}, {{label}})
- ❌ Pas de splitting avancé (par label, geo, placement)
- ❌ Pas d'authentification réelle (hardcodé)

---

## 🎯 Vision à 6 mois

**Le launcher devient un outil complet de gestion de campagnes Facebook** permettant :
1. Création rapide (mode actuel)
2. Modification intelligente (edit mode)
3. Duplication optimisée (sans re-upload)
4. Gestion granulaire (wording per creative, splits avancés)
5. Optimisation continue (A/B testing, budget optimization)

---

## 📅 Plan d'implémentation par Sprints

### 🔥 Sprint PRIORITÉ 1 (1-2 semaines)
**Objectif** : Foundation Edit Mode + Wording per Creative

#### Tasks Sprint 1
1. **Edit Mode Foundation** (Architecture)
   - [ ] Store : Ajouter `mode`, `editContext`, `editStrategy`
   - [ ] API : `GET /facebook/campaigns/:id/full` endpoint
   - [ ] Transformers : `transformFacebookToLauncher()` function
   - [ ] SDK : Support `existingCreativeId` dans Creative interface
   - **Estimation** : 3-4 jours

2. **Wording per Creative** (Feature Sprint 1.1 du ROADMAP.md)
   - [ ] UI : Champs headline/primaryText/description par creative
   - [ ] Store : Extend Creative interface
   - [ ] Generation : Combiner copy variants + per-creative copy
   - **Estimation** : 1-2 jours

**Livrables Sprint 1** :
- ✅ Edit mode infrastructure prête
- ✅ Wording per creative fonctionnel
- ✅ Tests manuels sur campagne test

---

### 🚀 Sprint 2 (1-2 semaines)
**Objectif** : Edit Mode UI + Duplicate basique

#### Tasks Sprint 2
1. **Edit Mode UI**
   - [ ] Button "Edit" dans Launches page
   - [ ] Modal pre-fill avec data existante
   - [ ] Visual indicators (badges, highlights)
   - [ ] Preview des changes
   - **Estimation** : 3-4 jours

2. **Duplicate Ad Set**
   - [ ] Button "Duplicate" dans Launches page
   - [ ] Workflow Broad → Interest sans re-upload
   - [ ] Sélection audiences à dupliquer
   - **Estimation** : 2-3 jours

**Livrables Sprint 2** :
- ✅ Éditer campagne existante (budget, audiences)
- ✅ Dupliquer ad set avec changement targeting
- ✅ Validation sur vraies campagnes

---

### 📈 Sprint 3 (1-2 semaines)
**Objectif** : Paramètres dynamiques + Optimisations

#### Tasks Sprint 3
1. **Dynamic Parameters** (Feature Sprint 1.2 du ROADMAP.md)
   - [ ] Support {{city}}, {{label}}, {{country}} dans wordings
   - [ ] UI pour preview avec substitution
   - [ ] Generation logic avec replacement
   - **Estimation** : 2-3 jours

2. **Performance & Polish**
   - [ ] Cleanup console.logs (50+ identified)
   - [ ] Add React.memo aux composants lourds
   - [ ] Optimiser re-renders (useCallback, useMemo)
   - [ ] Tests end-to-end
   - **Estimation** : 2-3 jours

**Livrables Sprint 3** :
- ✅ Paramètres dynamiques fonctionnels
- ✅ Codebase optimisé (performance)
- ✅ Experience utilisateur fluide

---

### 🔮 Sprint 4 (2 semaines)
**Objectif** : Advanced Splitting + Creative Library

#### Tasks Sprint 4
1. **Advanced Splitting** (Feature Phase 2 du ROADMAP.md)
   - [ ] Split par label (ex: Label_A, Label_B → ad sets séparés)
   - [ ] Split par geo (ex: France/Paris, France/Lyon → ad sets)
   - [ ] Split par placement (Feeds vs Stories → ad sets)
   - [ ] UI pour configurer splits
   - **Estimation** : 4-5 jours

2. **Creative Library**
   - [ ] Stocker creatives uploadés en DB
   - [ ] UI pour browser/search creatives
   - [ ] Réutiliser creatives across campaigns
   - **Estimation** : 3-4 jours

**Livrables Sprint 4** :
- ✅ Splits avancés pour contrôle granulaire
- ✅ Creative library pour réutilisation
- ✅ Gain de temps massif (pas de re-upload)

---

### 🎨 Sprint 5+ (Backlog)
**Features avancées** (priorisées selon besoins)

1. **Authentification réelle**
   - [ ] Clerk ou Auth0 integration
   - [ ] Multi-user support
   - [ ] Permissions (admin, editor, viewer)

2. **A/B Testing automatisé**
   - [ ] Créer variants automatiquement
   - [ ] Tracker performance
   - [ ] Winner declaration

3. **Budget Optimization**
   - [ ] Règles automatiques (pause si CPA > X)
   - [ ] Budget reallocation intelligent
   - [ ] Alerts & notifications

4. **Analytics avancés**
   - [ ] Dashboards personnalisés
   - [ ] Cohort analysis
   - [ ] Attribution modeling

5. **Multi-platform**
   - [ ] TikTok Ads support
   - [ ] Google Ads support
   - [ ] Cross-platform campaigns

---

## 🎯 Recommandation : Par où commencer ?

### Option A : **Edit Mode First** (Recommandé si utilisation intensive)
**Logique** : Si tu modifies souvent tes campagnes existantes, l'edit mode est bloquant

**Sprint immédiat** :
```
Semaine 1-2 : Edit Mode Foundation + UI
Semaine 3   : Duplicate Ad Set
Semaine 4   : Wording per Creative
```

**Avantages** :
- ✅ Résout pain point immédiat (dupliquer sans re-upload)
- ✅ Foundation solide pour autres features
- ✅ Gain de temps immédiat

**Inconvénients** :
- ⏱️ Plus complexe (transformers, API)
- 🧪 Nécessite tests rigoureux

---

### Option B : **Quick Wins First** (Recommandé si création >> édition)
**Logique** : Si tu crées plus que tu édites, améliorer le create flow d'abord

**Sprint immédiat** :
```
Semaine 1   : Wording per Creative
Semaine 2   : Dynamic Parameters ({{city}}, etc.)
Semaine 3   : Performance optimization
Semaine 4   : Edit Mode Foundation
```

**Avantages** :
- ✅ Features visibles rapidement
- ✅ Moins de risque (moins de breaking changes)
- ✅ Améliore expérience create actuelle

**Inconvénients** :
- ⏳ Edit mode reporté (mais create meilleur)

---

### Option C : **Hybrid** (Équilibré)
**Logique** : Alterner features "quick wins" et "foundation"

**Sprint immédiat** :
```
Semaine 1   : Wording per Creative (quick win)
Semaine 2-3 : Edit Mode Foundation + Basic UI
Semaine 4   : Duplicate Ad Set fonctionnel
```

**Avantages** :
- ✅ Balance court terme / long terme
- ✅ Délivre de la valeur régulièrement
- ✅ Réduit risque de blocage

**Inconvénients** :
- 🔀 Context switching (peut ralentir)

---

## 🤔 Ma recommandation : **Option C (Hybrid)**

### Pourquoi ?
1. **Wording per Creative** est rapide (1-2 jours) et utile tout de suite
2. **Edit Mode** est stratégique mais peut prendre 1 semaine
3. Alterner permet de délivrer de la valeur continuellement

### Plan concret :

#### Cette semaine (Sprint actuel)
- [x] ~~UI improvements~~ (FAIT ✅)
- [x] ~~Auth refactoring~~ (FAIT ✅)
- [ ] **Wording per Creative** (Feature simple, impactante)

#### Semaine prochaine
- [ ] **Edit Mode Foundation** (Store, API, Transformers)
- [ ] **Edit Mode UI** (Button Edit, pre-fill, preview)

#### Semaine suivante
- [ ] **Duplicate Ad Set** (Feature star ⭐)
- [ ] **Dynamic Parameters** (Bonus si temps)

#### Semaine d'après
- [ ] **Advanced Splitting** OU **Creative Library**
- [ ] Performance optimization

---

## 📊 Métriques de succès

### Court terme (Sprint 1-2)
- ⏱️ **Temps de setup campagne** : 15min → 5min (avec edit/duplicate)
- 📈 **Taux d'utilisation** : 80%+ des campagnes via launcher
- 🐛 **Bug rate** : < 5% des lancements échouent

### Moyen terme (Sprint 3-4)
- 🚀 **Productivité** : 3x plus d'ad sets créés par heure
- 💾 **Créatives réutilisés** : 50%+ des creatives sont des références
- 🎯 **Précision targeting** : 0 erreur de configuration manuelle

### Long terme (Sprint 5+)
- 👥 **Multi-user** : 3+ users simultanés
- 🌍 **Multi-platform** : Facebook + TikTok + Google
- 🤖 **Automatisation** : 80% des optimisations automatiques

---

## 🛠️ Setup Dev recommandé

### Pour travailler efficacement
1. **Branch strategy**
   ```
   main (stable)
   ├── develop (active dev)
   ├── feature/edit-mode
   ├── feature/wording-per-creative
   └── feature/dynamic-params
   ```

2. **Testing strategy**
   - **Sandbox Facebook Ad Account** pour tests (ne pas toucher prod)
   - **Fixtures** pour data Facebook (pas besoin d'API à chaque test)
   - **E2E tests** avec Playwright pour workflows critiques

3. **Code review checkpoints**
   - Avant chaque merge vers develop
   - Review architecture doc avant Sprint 2+
   - Peer review pour Edit Mode (complexe)

---

## 💬 Questions à décider

### Priorités business
1. **Quel est ton pain point #1 aujourd'hui ?**
   - Re-upload creatives ?
   - Modifier budgets souvent ?
   - Créer beaucoup de variants ?

2. **Combien de campagnes créées par semaine ?**
   - Si < 5 : Edit mode moins urgent
   - Si > 10 : Edit mode devient critique

3. **Combien de campagnes modifiées par semaine ?**
   - Si > créations : Edit mode PRIORITÉ 1
   - Si < créations : Quick wins first

### Architecture
4. **Auth système** : Clerk, Auth0, ou custom ?
5. **Database** : Rester Supabase ou migrer ?
6. **API caching** : Redis pour Facebook API responses ?

---

## 🎬 Next Steps

### Immédiatement (cette session)
- [x] ~~Review EDIT_MODE_ARCHITECTURE.md~~ ✅
- [x] ~~Create ROADMAP_GLOBAL.md~~ ✅
- [ ] **Décider : Option A, B ou C ?**

### Prochaine session
Selon décision :
- **Si Option C** : Start "Wording per Creative"
- **Si Option A** : Start "Edit Mode Foundation"
- **Si Option B** : Start "Wording + Dynamic Params"

### Cette semaine
- [ ] Finaliser Sprint 1 features
- [ ] Tester sur vraie campagne
- [ ] Commit & push

---

## 📝 Notes

- Document vivant, update après chaque sprint
- Prioriser selon feedback utilisateur
- Rester flexible (pivots possibles)
- Célébrer les wins 🎉

**Dernière mise à jour** : 6 Nov 2025
**Next review** : Fin Sprint 1

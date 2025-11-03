# Guide Claude Code - Launcher-Ads

Ce dossier contient les instructions et règles pour les assistants IA (Claude Code) travaillant sur ce projet.

## 📋 Fichiers Importants

### 1. `RULES.md` ⭐
**À LIRE EN PREMIER**

Contient toutes les règles de développement à suivre obligatoirement:
- Principes fondamentaux (Single Source of Truth, Type Safety, etc.)
- Structure des fichiers et nomenclature
- Best practices React et NestJS
- Sécurité et validation
- Stratégie base de données
- Anti-patterns à éviter

**👉 Consultez ce fichier avant toute modification du code**

### 2. `/ARCHITECTURE.md` (racine du projet)
Documentation technique complète:
- Schéma de la base de données
- Structure du monorepo
- Organisation des controllers
- Workflow de développement
- État actuel vs cible

## 🎯 Processus pour Chaque Prompt

### Étape 1: Comprendre la Demande
1. Lire attentivement la demande de l'utilisateur
2. Identifier les fichiers/modules concernés
3. Vérifier si la fonctionnalité existe déjà

### Étape 2: Consulter les Règles
1. Ouvrir `RULES.md`
2. Vérifier les sections pertinentes:
   - Structure des fichiers
   - Best practices pour le domaine concerné (React/NestJS/DB)
   - Anti-patterns à éviter

### Étape 3: Planifier les Changements
1. **Types/Schemas**: Commencer par `packages/sdk`
2. **Backend**: Puis `apps/api`
3. **Frontend**: Enfin `apps/web`
4. **Tests**: Colocalisés avec le code

### Étape 4: Implémenter
1. Suivre les conventions de nommage
2. Respecter les limites (controllers < 150 lignes)
3. Valider avec Zod
4. Gérer les erreurs correctement

### Étape 5: Vérifier
1. Tous les imports sont corrects (`@launcher-ads/sdk`)
2. Pas de duplication de types
3. Gestion d'erreurs en place
4. Performance optimisée (memo, useCallback, etc.)

## 🚨 Erreurs Courantes à Éviter

### ❌ Erreur #1: Dupliquer des Types
```typescript
// NE PAS FAIRE
// apps/web/lib/types/campaign.ts
export type CampaignType = 'Awareness' | 'Traffic'

// FAIRE
// Importer depuis SDK
import { CampaignType } from '@launcher-ads/sdk'
```

### ❌ Erreur #2: Controller Trop Gros
Si un controller dépasse 150 lignes:
1. Le découper en plusieurs controllers spécialisés
2. Suivre le pattern: auth, [resource], insights, admin, debug

### ❌ Erreur #3: Oublier la Validation Zod
```typescript
// NE PAS FAIRE
@Post()
create(@Body() dto: any) { ... }

// FAIRE
@Post()
create(@Body() dto: CreateCampaignDto) {
  const validated = campaignSchema.parse(dto)
  // ...
}
```

### ❌ Erreur #4: Ne Pas Optimiser React
```typescript
// NE PAS FAIRE
export function HeavyComponent({ data }) {
  const processed = expensiveComputation(data)
  return <div onClick={() => handleClick()}>...</div>
}

// FAIRE
export const HeavyComponent = memo(function HeavyComponent({ data }) {
  const processed = useMemo(() => expensiveComputation(data), [data])
  const handleClick = useCallback(() => { ... }, [])
  return <div onClick={handleClick}>...</div>
})
```

## 📚 Commandes Utiles

```bash
# Développement
pnpm dev              # Tous les apps
pnpm dev:api          # Backend seulement
pnpm dev:web          # Frontend seulement

# Base de données
pnpm db:migrate       # Créer/appliquer migration
pnpm db:studio        # UI Prisma Studio
pnpm db:seed          # Seed la DB

# Tests & Vérification
pnpm typecheck        # Vérifier les types
pnpm lint             # Linter
pnpm test             # Tests unitaires
pnpm format           # Formater le code

# Build
pnpm build            # Build tous les packages
```

## 🗂️ Organisation du Code

### Où Mettre Quoi?

**Types et Schemas** → `packages/sdk/src/schemas/`
```
✅ Tous les types TypeScript
✅ Tous les schemas Zod
✅ Constantes partagées
```

**Backend NestJS** → `apps/api/src/`
```
[feature]/
├── controllers/          # Routes HTTP
│   ├── [feature]-auth.controller.ts
│   ├── [feature]-campaigns.controller.ts
│   └── [feature]-insights.controller.ts
├── [feature].service.ts  # Logique métier
├── [feature].module.ts   # Module NestJS
├── dto/                  # DTOs (si nécessaire)
├── guards/               # Guards d'authentification
└── strategies/           # Stratégies Passport
```

**Frontend Next.js** → `apps/web/`
```
components/[feature]/
├── steps/                # Étapes d'un wizard
├── components/           # Sous-composants
├── controls/             # Contrôles UI
└── [feature]-modal.tsx   # Composant principal

lib/
├── store/                # Zustand stores
├── hooks/                # Custom hooks
├── api/                  # API clients
└── utils/                # Utilitaires
```

## 🔍 Debugging

### Backend (NestJS)
```typescript
// Logger structuré
this.logger.log('Action description', { key: 'value' })
this.logger.error('Error description', { error: error.message })

// Pas de console.log en production!
```

### Frontend (React)
```typescript
// React DevTools pour le state
// Console errors uniquement pour les erreurs réelles
console.error('Failed to load data:', error)

// Debug en dev seulement
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data)
}
```

## ✅ Checklist Avant de Soumettre

Avant de considérer une tâche comme terminée:

- [ ] Code suit les conventions de `RULES.md`
- [ ] Pas de duplication de types (tout dans SDK)
- [ ] Controllers < 150 lignes
- [ ] Validation Zod en place
- [ ] Gestion d'erreurs correcte (NestJS exceptions)
- [ ] Performance React optimisée (memo, useCallback, useMemo)
- [ ] Imports depuis `@launcher-ads/sdk` (pas de chemins locaux pour les types)
- [ ] Variables d'environnement validées (pas de fallback hardcodé)
- [ ] Debug endpoints protégés avec `@UseGuards(DebugModeGuard)`
- [ ] Documentation inline pour le code complexe

## 🎓 Ressources Supplémentaires

### Documentation Technique
- **Architecture complète**: `/ARCHITECTURE.md`
- **Règles de développement**: `.claudecode/RULES.md`
- **Prisma Schema**: `apps/api/prisma/schema.prisma`

### Frameworks & Libs
- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Zod Documentation](https://zod.dev/)
- [tRPC Documentation](https://trpc.io/docs)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)

### Conventions
- [Conventional Commits](https://www.conventionalcommits.org/)
- [React Best Practices](https://react.dev/learn)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

## 💡 Conseils pour Claude Code

### Lorsque l'Utilisateur Demande un Audit
1. Lire `RULES.md` en entier
2. Vérifier la conformité du code existant
3. Identifier les violations
4. Proposer des corrections avec exemples

### Lorsque l'Utilisateur Demande une Nouvelle Fonctionnalité
1. Commencer par les types dans `packages/sdk`
2. Implémenter le backend (service → controller → module)
3. Implémenter le frontend (composants → hooks → stores)
4. S'assurer que tout est type-safe

### Lorsque l'Utilisateur Demande un Refactoring
1. Identifier les anti-patterns (voir `RULES.md`)
2. Proposer une structure conforme
3. Implémenter étape par étape
4. Vérifier que rien n'est cassé

### Lorsque l'Utilisateur Signale un Bug
1. Comprendre le bug et sa cause
2. Vérifier si c'est lié à une violation de `RULES.md`
3. Corriger en suivant les best practices
4. Ajouter de la validation/gestion d'erreur si nécessaire

---

**Version**: 2.0
**Dernière mise à jour**: 30 Octobre 2025

**Important**: Ces règles sont le résultat d'un audit complet du projet. Elles doivent être respectées strictement pour maintenir la qualité et la cohérence du code.

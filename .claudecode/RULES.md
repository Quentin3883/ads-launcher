# Règles de Développement - Launcher-Ads

Ce fichier contient les règles et conventions à suivre pour tous les développements futurs sur ce projet.

## 🎯 Principes Fondamentaux

### 1. Single Source of Truth
- ✅ **FAIRE**: Définir tous les types/schemas dans `packages/sdk`
- ❌ **NE PAS FAIRE**: Dupliquer des types entre `apps/web` et `apps/api`
- ✅ **FAIRE**: Importer depuis `@launcher-ads/sdk`

```typescript
// ✅ BON
import { CampaignType, BulkCampaignOutput } from '@launcher-ads/sdk'

// ❌ MAUVAIS
type CampaignType = 'Awareness' | 'Traffic' | ...  // Redéfinition locale
```

### 2. Type Safety Partout
- ✅ **FAIRE**: Utiliser Zod pour toutes les validations
- ✅ **FAIRE**: Exporter les types TypeScript depuis Zod schemas
- ❌ **NE PAS FAIRE**: Utiliser `any` ou `unknown` sans validation

```typescript
// ✅ BON
export const campaignSchema = z.object({
  name: z.string().min(1),
  budget: z.number().positive(),
})
export type Campaign = z.infer<typeof campaignSchema>

// ❌ MAUVAIS
interface Campaign {
  name: string
  budget: number
}
```

### 3. Séparation des Responsabilités
- ✅ **FAIRE**: Controllers < 150 lignes
- ✅ **FAIRE**: Services pour la logique métier
- ✅ **FAIRE**: Guards pour la sécurité
- ❌ **NE PAS FAIRE**: Mélanger logique métier et routes dans le controller

```typescript
// ✅ BON - Controller délègue au service
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  async create(@Body() dto: CreateCampaignDto) {
    return this.campaignsService.create(dto)
  }
}

// ❌ MAUVAIS - Logique métier dans le controller
@Controller('campaigns')
export class CampaignsController {
  @Post()
  async create(@Body() dto: CreateCampaignDto) {
    // 50 lignes de logique métier ici...
  }
}
```

## 📁 Structure des Fichiers

### Nomenclature
```
kebab-case.ts           # Fichiers généraux
PascalCase.tsx          # Composants React
camelCase.test.ts       # Tests
camelCase.spec.ts       # Tests NestJS
```

### Organisation des Controllers
```
apps/api/src/[feature]/
├── controllers/
│   ├── [feature]-auth.controller.ts      # OAuth/Auth
│   ├── [feature]-[resource].controller.ts # CRUD operations
│   ├── [feature]-insights.controller.ts   # Analytics
│   ├── [feature]-admin.controller.ts      # Admin operations
│   └── [feature]-debug.controller.ts      # Debug (dev only)
├── [feature].service.ts
├── [feature].module.ts
├── dto/
├── guards/
└── strategies/
```

### Organisation des Composants React
```
apps/web/components/[feature]/
├── steps/              # Étapes d'un wizard
├── components/         # Sous-composants
├── controls/           # Contrôles UI
└── [feature]-modal.tsx # Composant principal
```

## 🎨 React Best Practices

### Performance
```typescript
// ✅ FAIRE: Memoïser les composants lourds
import { memo, useCallback, useMemo } from 'react'

export const HeavyComponent = memo(function HeavyComponent({ data }) {
  const processedData = useMemo(() => expensiveComputation(data), [data])

  const handleClick = useCallback(() => {
    doSomething(processedData)
  }, [processedData])

  return <div onClick={handleClick}>...</div>
})

// ❌ ÉVITER: Recalcul et re-render à chaque fois
export function HeavyComponent({ data }) {
  const processedData = expensiveComputation(data) // Recalculé à chaque render

  const handleClick = () => {  // Nouvelle fonction à chaque render
    doSomething(processedData)
  }

  return <div onClick={handleClick}>...</div>
}
```

### State Management (Zustand)
```typescript
// ✅ FAIRE: Sélecteurs précis
const name = useStore(state => state.campaign.name)
const setName = useStore(state => state.setCampaignName)

// ❌ ÉVITER: Tout le store (cause re-renders inutiles)
const store = useStore()
```

## 🔒 Sécurité

### Variables d'Environnement
```typescript
// ✅ FAIRE: Valider et lever une erreur explicite
const apiKey = process.env.API_KEY
if (!apiKey) {
  throw new BadRequestException('API_KEY environment variable is required')
}

// ❌ NE PAS FAIRE: Fallback avec valeur hardcodée
const apiKey = process.env.API_KEY || 'default-key'  // DANGER!
```

### Endpoints de Debug
```typescript
// ✅ FAIRE: Protéger avec un guard
@Controller('debug')
@UseGuards(DebugModeGuard)  // Bloque en production
export class DebugController { ... }

// ❌ NE PAS FAIRE: Exposer en production
@Controller('debug')
export class DebugController { ... }
```

### Validation des Données
```typescript
// ✅ FAIRE: Valider avec Zod
import { campaignSchema } from '@launcher-ads/sdk'

@Post()
async create(@Body() dto: unknown) {
  const validated = campaignSchema.parse(dto)  // Lance une erreur si invalide
  return this.service.create(validated)
}

// ❌ NE PAS FAIRE: Faire confiance aux données entrantes
@Post()
async create(@Body() dto: any) {
  return this.service.create(dto)  // Pas de validation!
}
```

## 🗄️ Base de Données

### Stratégie
- **Prisma**: Toutes les données relationnelles
- **Supabase Storage**: Uniquement les fichiers (images, vidéos)

### Queries
```typescript
// ✅ FAIRE: Utiliser include pour éviter N+1
const clients = await prisma.client.findMany({
  include: {
    contacts: true,
    adAccounts: {
      include: { campaigns: true }
    }
  }
})

// ❌ ÉVITER: Queries séparées (N+1 problem)
const clients = await prisma.client.findMany()
for (const client of clients) {
  const contacts = await prisma.clientContact.findMany({ where: { clientId: client.id } })
}
```

### Migrations
```typescript
// ✅ FAIRE: Migrations versionnées
pnpm db:migrate  // Crée une migration

// ❌ NE PAS FAIRE: Modifier directement la DB
// ❌ NE PAS FAIRE: Utiliser prisma db push en production
```

## 🚨 Gestion d'Erreurs

### Backend (NestJS)
```typescript
// ✅ FAIRE: Utiliser les exceptions NestJS
import { BadRequestException, NotFoundException } from '@nestjs/common'

if (!user) {
  throw new NotFoundException('User not found')
}

if (budget < 0) {
  throw new BadRequestException('Budget must be positive')
}

// ❌ NE PAS FAIRE: throw new Error générique
throw new Error('Something went wrong')
```

### Frontend
```typescript
// ✅ FAIRE: Gérer les erreurs de manière structurée
try {
  const result = await createCampaign(data)
  toast.success('Campaign created successfully')
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error'
  toast.error(`Failed to create campaign: ${message}`)
  console.error('Campaign creation error:', error)
}

// ❌ NE PAS FAIRE: Ignorer les erreurs
await createCampaign(data)  // Pas de try/catch
```

## 📦 Imports

### Ordre des Imports
```typescript
// 1. Imports externes
import { Injectable } from '@nestjs/common'
import { z } from 'zod'

// 2. Imports du SDK
import { CampaignType } from '@launcher-ads/sdk'

// 3. Imports internes (relatifs)
import { PrismaService } from '../prisma/prisma.service'
import { CreateCampaignDto } from './dto'
```

### Alias
```typescript
// ✅ FAIRE: Utiliser les alias configurés
import { Button } from '@/components/ui/button'
import { useCampaigns } from '@/lib/hooks/use-campaigns'
import { CampaignType } from '@launcher-ads/sdk'

// ❌ ÉVITER: Imports relatifs profonds
import { Button } from '../../../components/ui/button'
```

## 🧪 Tests

### Nomenclature
```
feature.service.spec.ts     # Tests unitaires backend
feature.test.tsx            # Tests unitaires frontend
feature.e2e.spec.ts         # Tests E2E
```

### Structure
```typescript
describe('CampaignsService', () => {
  let service: CampaignsService
  let prisma: PrismaService

  beforeEach(async () => {
    // Setup
  })

  describe('create', () => {
    it('should create a campaign', async () => {
      // Arrange
      const dto = { name: 'Test Campaign', budget: 1000 }

      // Act
      const result = await service.create(dto)

      // Assert
      expect(result.name).toBe('Test Campaign')
    })

    it('should throw if budget is negative', async () => {
      // Arrange
      const dto = { name: 'Test', budget: -100 }

      // Act & Assert
      await expect(service.create(dto)).rejects.toThrow()
    })
  })
})
```

## 📝 Documentation

### Code Comments
```typescript
// ✅ FAIRE: Commenter le "pourquoi", pas le "quoi"
// Calculate budget distribution across ad sets to avoid overspending
const budgetPerAdSet = totalBudget / adSets.length

// ❌ NE PAS FAIRE: Commenter l'évident
// Divide totalBudget by the number of adSets
const budgetPerAdSet = totalBudget / adSets.length
```

### JSDoc pour les Fonctions Publiques
```typescript
/**
 * Creates a new bulk campaign with multiple ad sets and ads
 *
 * @param userId - The user creating the campaign
 * @param campaignData - Campaign configuration including budget and targeting
 * @returns The created campaign with all ad sets and ads
 * @throws BadRequestException if budget is invalid or user has no Facebook token
 */
async createBulkCampaign(userId: string, campaignData: BulkCampaignInput): Promise<BulkCampaignOutput> {
  // ...
}
```

## 🚀 Workflow Git

### Branches
```
main                    # Production
develop                 # Développement
feature/[name]          # Nouvelles fonctionnalités
fix/[name]              # Bug fixes
refactor/[name]         # Refactoring
```

### Commits
```bash
# Format: type(scope): message

feat(campaigns): add bulk campaign creation
fix(auth): resolve token refresh issue
refactor(controllers): split FacebookController into multiple controllers
docs(architecture): add database strategy documentation
test(campaigns): add unit tests for campaign service
chore(deps): update dependencies
```

### Pull Requests
- ✅ Décrire le "pourquoi" pas seulement le "quoi"
- ✅ Ajouter des screenshots pour les changements UI
- ✅ Lister les tests effectués
- ✅ Mentionner les breaking changes

## 🔄 Ajout d'une Nouvelle Fonctionnalité

### Checklist
1. [ ] Types/Schemas ajoutés dans `packages/sdk`
2. [ ] Service backend créé dans `apps/api/src/[feature]`
3. [ ] Controller(s) créé(s) (max 150 lignes chacun)
4. [ ] Routes tRPC ajoutées
5. [ ] Composants React créés dans `apps/web/components/[feature]`
6. [ ] Tests unitaires écrits (backend + frontend)
7. [ ] Documentation mise à jour dans `ARCHITECTURE.md`
8. [ ] Types exportés correctement depuis SDK
9. [ ] Validation Zod en place
10. [ ] Gestion d'erreurs en place

### Exemple: Ajouter LinkedIn Ads
```bash
# 1. Créer les schemas
packages/sdk/src/schemas/linkedin.schema.ts

# 2. Créer le module backend
apps/api/src/linkedin/
├── controllers/
│   ├── linkedin-auth.controller.ts
│   ├── linkedin-campaigns.controller.ts
│   └── linkedin-insights.controller.ts
├── linkedin.service.ts
├── linkedin.module.ts
└── strategies/
    └── linkedin.strategy.ts

# 3. Créer les composants frontend
apps/web/components/integrations/linkedin/

# 4. Ajouter au module principal
apps/api/src/app.module.ts

# 5. Tests
apps/api/src/linkedin/__tests__/
```

## 🐛 Debugging

### Backend
```typescript
// ✅ FAIRE: Logger structuré
this.logger.log('Creating campaign', { userId, campaignId })
this.logger.error('Failed to create campaign', { error: error.message, stack: error.stack })

// ❌ ÉVITER: console.log en production
console.log('Creating campaign')
```

### Frontend
```typescript
// ✅ FAIRE: React DevTools + console.error pour les erreurs
console.error('Failed to load campaigns:', error)

// Development only
if (process.env.NODE_ENV === 'development') {
  console.log('Debug data:', data)
}
```

## 📊 Performance

### Backend
- ✅ Utiliser Prisma includes (pas de N+1 queries)
- ✅ Indexer les colonnes fréquemment interrogées
- ✅ Paginer les résultats (pas de `findMany()` sans limite)

### Frontend
- ✅ Lazy load les pages avec `next/dynamic`
- ✅ Memoïser avec `memo`, `useMemo`, `useCallback`
- ✅ Utiliser `next/image` pour les images
- ✅ Code splitting automatique de Next.js

## ⚠️ Anti-Patterns à Éviter

### 1. Duplication de Types
```typescript
// ❌ MAUVAIS
// apps/web/lib/types/campaign.ts
export type CampaignType = 'Awareness' | 'Traffic'

// apps/api/src/campaigns/dto/campaign.dto.ts
export type CampaignType = 'Awareness' | 'Traffic'

// ✅ BON
// packages/sdk/src/schemas/campaign.schema.ts
export const campaignTypeSchema = z.enum(['Awareness', 'Traffic'])
export type CampaignType = z.infer<typeof campaignTypeSchema>
```

### 2. Controllers Trop Gros
```typescript
// ❌ MAUVAIS - 1 controller de 500 lignes
@Controller('facebook')
export class FacebookController {
  // 20 endpoints ici...
}

// ✅ BON - Plusieurs controllers spécialisés
@Controller('facebook/auth')
export class FacebookAuthController { ... }

@Controller('facebook/campaigns')
export class FacebookCampaignsController { ... }
```

### 3. Props Drilling
```typescript
// ❌ MAUVAIS
<Parent userId={userId}>
  <Child userId={userId}>
    <GrandChild userId={userId}>
      <GreatGrandChild userId={userId} />  // Props drilling!
    </GrandChild>
  </Child>
</Parent>

// ✅ BON - Utiliser Zustand ou Context
const userId = useAuthStore(state => state.userId)
```

### 4. Mutations Sans Optimistic Updates
```typescript
// ❌ MAUVAIS
const handleDelete = async (id) => {
  await deleteCampaign(id)
  refetch()  // UI freeze pendant la requête
}

// ✅ BON
const handleDelete = async (id) => {
  // Optimistic update
  setCampaigns(prev => prev.filter(c => c.id !== id))

  try {
    await deleteCampaign(id)
  } catch (error) {
    // Rollback on error
    refetch()
    toast.error('Failed to delete campaign')
  }
}
```

## 📚 Ressources

- **Architecture**: Voir `ARCHITECTURE.md`
- **Prisma Schema**: `apps/api/prisma/schema.prisma`
- **SDK Types**: `packages/sdk/src/schemas/`
- **API Routes**: `apps/api/src/*/controllers/`
- **Frontend Components**: `apps/web/components/`

---

**Version**: 2.0
**Dernière mise à jour**: 30 Octobre 2025
**Ces règles doivent être suivies pour TOUS les développements futurs**

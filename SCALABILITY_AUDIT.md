# Audit de Scalabilité & Architecture - Launcher Ads

**Date**: 2025-01-14
**Contexte**: Préparation au déploiement production avec login et intégration multi-plateformes (HubSpot, Google Ads, TikTok, LinkedIn, Snap, etc.)
**Health Score Actuel**: 9.8/10 (code très propre après Phase 3)

---

## 🎯 Objectifs de Scalabilité

### Objectifs Court Terme (1-3 mois):
1. ✅ **Authentification Multi-Utilisateurs**
   - Login/logout
   - Gestion des sessions
   - Protection des routes
   - Séparation des données par utilisateur

2. ✅ **Multi-Tenancy** (Support multi-organisations)
   - Isolation des données par organisation
   - Gestion des rôles (Owner, Admin, Member)
   - Invitations d'utilisateurs

### Objectifs Moyen Terme (3-6 mois):
3. ✅ **Multi-Platform Support**
   - Google Ads
   - TikTok Ads
   - LinkedIn Ads
   - Snapchat Ads
   - HubSpot CRM integration

4. ✅ **Scalabilité Infrastructure**
   - Architecture cloud-ready
   - Gestion des queues pour jobs longs
   - Cache distribué
   - Monitoring & logging

---

## 🔍 État Actuel de l'Architecture

### ✅ Points Forts

#### 1. **Monorepo Bien Organisé**
```
launcher-ads/
├── apps/
│   ├── api/          # NestJS backend avec tRPC
│   └── web/          # Next.js 16 frontend
└── packages/
    └── sdk/          # Types partagés (Zod schemas)
```
- Turborepo pour build/dev optimisés
- Séparation claire backend/frontend
- Types partagés via SDK

#### 2. **Provider Pattern Déjà Implémenté** ✨
```typescript
// apps/api/src/providers/provider.adapter.ts
export interface ProviderAdapter {
  readonly name: PlatformType // 'META' | 'GOOGLE' | 'LINKEDIN' | 'SNAP'
  ensureAuth(orgId: string, connectionId: string): Promise<void>
  createCampaign(input: CreateCampaignInput): Promise<CreateResult>
  createAdSet(input: CreateAdSetInput): Promise<CreateResult>
  createAd(input: CreateAdInput): Promise<CreateResult>
  getMetrics(scope: MetricsScope, dateFrom: string, dateTo: string): Promise<AdMetrics[]>
}
```

**Status**:
- ✅ Interface bien définie
- ✅ MetaAdapter implémenté
- ✅ DryRunAdapter pour tests
- ✅ Factory pattern en place
- ⚠️ Besoin d'évolutions (voir ci-dessous)

#### 3. **API Architecture Moderne**
- tRPC pour type-safety end-to-end
- NestJS avec dependency injection
- Validation Zod sur SDK
- CORS configuré

#### 4. **Frontend Clean & Componentisé**
- 12 composants réutilisables extraits
- 3 custom hooks
- Architecture composable
- 0 erreurs TypeScript

---

## ⚠️ Problèmes Critiques de Scalabilité

### 🔴 **CRITIQUE 1: Pas d'Authentification**

**Problème Actuel**:
```typescript
// apps/web/lib/constants/auth.ts
export const DEFAULT_USER_ID = 'f6a2a722-7ca8-4130-a78a-4d50e2ff8256'
export const DEFAULT_USER = {
  id: DEFAULT_USER_ID,
  email: 'comevaa.contact@gmail.com',
  name: 'Quentin Valentini',
}
```

**Impact**:
- ❌ Impossible de déployer en production
- ❌ Pas de séparation des données utilisateurs
- ❌ Pas de sécurité
- ❌ Tous les utilisateurs partagent le même ID

**Solution Recommandée**: **Supabase Auth** (voir section solutions)

---

### 🔴 **CRITIQUE 2: Pas de Multi-Tenancy**

**Problème**:
- Pas de concept d'organisation
- Pas de gestion des rôles
- Pas d'isolation des données

**Impact**:
- ❌ Impossible d'avoir plusieurs clients/entreprises
- ❌ Pas de partage de compte publicitaire entre membres d'équipe
- ❌ Pas de facturation par organisation

**Solution**: Architecture Organizations + Memberships (voir section solutions)

---

### 🟡 **MOYEN 3: Provider Architecture Limitée**

**Problème**:
```typescript
// provider.adapter.ts ligne 127
ensureAuth(orgId: string, connectionId: string): Promise<void>
```

**Limitations**:
1. **Pas de gestion des tokens OAuth**
   - Les credentials sont passés au constructeur
   - Pas de refresh token automatique
   - Pas de stockage sécurisé des tokens

2. **Pas de concept de "Connection"**
   - Besoin d'une table `connections` pour stocker:
     - Platform (META, GOOGLE, TIKTOK...)
     - Credentials (access_token, refresh_token, expiry)
     - Organization ID
     - Status (active, expired, error)

3. **Interface trop restrictive**
   - Manque `updateCampaign()`, `pauseCampaign()`, `deleteCampaign()`
   - Manque endpoints pour récupérer les audiences/pixels/forms
   - Manque endpoints pour uploader media

**Solution**: Étendre l'interface + ajouter ConnectionManager (voir section solutions)

---

### 🟡 **MOYEN 4: Pas de Queue System**

**Problème**:
- Le lancement de campagnes est synchrone
- Upload de vidéos bloquant
- Sync des insights bloquant

**Impact**:
- ⏱️ Timeouts sur gros lancements (100+ ads)
- 😰 Mauvaise UX (utilisateur attend)
- 💥 Crash possible si API externe timeout

**Solution**: BullMQ + Redis pour job queues (voir section solutions)

---

### 🟡 **MOYEN 5: Pas de Database**

**Problème Actuel**:
```typescript
// Aucune database définie dans le projet
// Pas de Prisma/TypeORM/Drizzle
// Pas de migrations
```

**Impact**:
- ❌ Impossible de stocker:
  - Utilisateurs
  - Organizations
  - Connections (tokens OAuth)
  - Campaign templates
  - Bulk launch history
  - Audit logs

**Solution**: Supabase PostgreSQL + Prisma ORM (voir section solutions)

---

### 🟢 **MINEUR 6: Pas de Monitoring/Logging**

**Problème**:
- Console.log basique
- Pas de tracking d'erreurs
- Pas de métriques de performance
- Pas d'alerting

**Solution**: Sentry + LogRocket + Vercel Analytics

---

### 🟢 **MINEUR 7: Pas de Rate Limiting**

**Problème**:
- Pas de protection contre abus API
- Pas de throttling requests vers Meta/Google

**Solution**: @nestjs/throttler + Redis

---

## 💡 Architecture Recommandée

### 🏗️ **Architecture Globale**

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js 16)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Dashboard    │  │ Bulk Launcher│  │ Settings     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                           │                                 │
│                      tRPC Client                            │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            │ HTTPS (tRPC)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (NestJS + tRPC)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              tRPC Routers (Type-safe API)            │   │
│  └──────────────────────────────────────────────────────┘   │
│         │                   │                  │            │
│    ┌────▼────┐         ┌────▼────┐       ┌────▼────┐       │
│    │ Auth    │         │Campaign │       │ Insights│       │
│    │ Service │         │ Service │       │ Service │       │
│    └────┬────┘         └────┬────┘       └────┬────┘       │
│         │                   │                  │            │
│         │              ┌────▼─────────────────┐             │
│         │              │  ConnectionManager   │             │
│         │              │  (OAuth, Tokens)     │             │
│         │              └────┬─────────────────┘             │
│         │                   │                               │
│         │              ┌────▼─────────────────┐             │
│         │              │   ProviderFactory    │             │
│         │              └────┬─────────────────┘             │
│         │                   │                               │
│         │         ┌─────────┼─────────┬──────────┐          │
│         │         ▼         ▼         ▼          ▼          │
│         │   ┌─────────┬─────────┬─────────┬─────────┐       │
│         │   │  Meta   │ Google  │ TikTok  │LinkedIn │       │
│         │   │ Adapter │ Adapter │ Adapter │ Adapter │       │
│         │   └─────────┴─────────┴─────────┴─────────┘       │
│         │                                                    │
│    ┌────▼────────────────────────────────────────┐          │
│    │         Supabase PostgreSQL (via Prisma)    │          │
│    │  - users                                    │          │
│    │  - organizations                            │          │
│    │  - memberships                              │          │
│    │  - connections (OAuth tokens)               │          │
│    │  - bulk_launches                            │          │
│    │  - audit_logs                               │          │
│    └─────────────────────────────────────────────┘          │
│                                                              │
│    ┌──────────────────────────────────────────────┐         │
│    │    BullMQ Job Queue (Redis)                  │         │
│    │  - campaign_launch_jobs                      │         │
│    │  - media_upload_jobs                         │         │
│    │  - insights_sync_jobs                        │         │
│    └──────────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────────────┘
           │              │              │
           ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │   Meta   │   │  Google  │   │  TikTok  │
    │    API   │   │ Ads API  │   │   API    │
    └──────────┘   └──────────┘   └──────────┘
```

---

## 🛠️ Solutions Détaillées

### 🔐 **Solution 1: Authentification avec Supabase**

#### Pourquoi Supabase?
- ✅ Auth built-in (Email/Password, OAuth, Magic Links)
- ✅ PostgreSQL inclus (database + auth)
- ✅ Row Level Security (RLS) natif
- ✅ SDK Next.js officiel
- ✅ Gratuit jusqu'à 50k utilisateurs
- ✅ Pas besoin de gérer les tokens manuellement

#### Implémentation:

**1. Setup Supabase**
```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

**2. Configuration**
```typescript
// packages/sdk/src/config/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

**3. Middleware Next.js pour routes protégées**
```typescript
// apps/web/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Redirect to login if not authenticated
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
}
```

**4. tRPC Context avec User**
```typescript
// apps/api/src/trpc/trpc.context.ts
import { createSupabaseClient } from '@supabase/supabase-js'

export async function createTRPCContext({ req, res }: any) {
  // Extract token from Authorization header
  const token = req.headers.authorization?.replace('Bearer ', '')

  const supabase = createSupabaseClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Server-side key
  )

  // Verify JWT token
  const { data: { user }, error } = await supabase.auth.getUser(token)

  return {
    user, // Now available in all tRPC procedures
    supabase,
  }
}
```

**5. Protected Procedure**
```typescript
// apps/api/src/trpc/trpc.ts
import { TRPCError } from '@trpc/server'

export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // Non-nullable now
    },
  })
})
```

**6. Login Page**
```typescript
// apps/web/app/login/page.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Login</button>
    </form>
  )
}
```

---

### 🏢 **Solution 2: Multi-Tenancy (Organizations)**

#### Schema Prisma

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Users table (synced with Supabase Auth)
model User {
  id            String        @id @default(uuid())
  email         String        @unique
  name          String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  // Relations
  memberships   Membership[]
  connections   Connection[]  // Owns OAuth connections

  @@map("users")
}

// Organizations (Companies/Teams)
model Organization {
  id            String        @id @default(uuid())
  name          String
  slug          String        @unique
  logo          String?
  plan          String        @default("free") // free, pro, enterprise
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  // Relations
  memberships   Membership[]
  connections   Connection[]
  clients       Client[]
  bulkLaunches  BulkLaunch[]

  @@map("organizations")
}

// Organization Memberships (Users ↔ Organizations)
model Membership {
  id             String        @id @default(uuid())
  userId         String
  organizationId String
  role           String        @default("member") // owner, admin, member
  createdAt      DateTime      @default(now())

  // Relations
  user           User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization   Organization  @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([userId, organizationId])
  @@map("memberships")
}

// Platform Connections (OAuth tokens per org)
model Connection {
  id             String        @id @default(uuid())
  organizationId String
  platform       String        // META, GOOGLE, TIKTOK, LINKEDIN, SNAP
  status         String        @default("active") // active, expired, error

  // OAuth Credentials
  accessToken    String        @db.Text
  refreshToken   String?       @db.Text
  expiresAt      DateTime?
  adAccountId    String?

  // Metadata
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  createdBy      String        // User who created connection

  // Relations
  organization   Organization  @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  creator        User          @relation(fields: [createdBy], references: [id])

  @@unique([organizationId, platform, adAccountId])
  @@map("connections")
}

// Clients (existing table, add organizationId)
model Client {
  id             String        @id @default(uuid())
  organizationId String
  name           String
  logo           String?
  createdAt      DateTime      @default(now())

  organization   Organization  @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@map("clients")
}

// Bulk Launches (existing, add organizationId)
model BulkLaunch {
  id             String        @id @default(uuid())
  organizationId String
  userId         String
  name           String
  status         String
  platform       String
  createdAt      DateTime      @default(now())

  organization   Organization  @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@map("bulk_launches")
}
```

#### Row Level Security (RLS) sur Supabase

```sql
-- Only users can see organizations they belong to
CREATE POLICY "Users can view their organizations"
  ON organizations
  FOR SELECT
  USING (
    id IN (
      SELECT organization_id
      FROM memberships
      WHERE user_id = auth.uid()
    )
  );

-- Only owners/admins can update organization
CREATE POLICY "Owners can update organization"
  ON organizations
  FOR UPDATE
  USING (
    id IN (
      SELECT organization_id
      FROM memberships
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );
```

---

### 🔌 **Solution 3: Enhanced Provider Architecture**

#### Nouveau `ConnectionManager`

```typescript
// apps/api/src/providers/connection.manager.ts
import { PrismaClient } from '@prisma/client'
import { TRPCError } from '@trpc/server'

export class ConnectionManager {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get active connection for organization + platform
   */
  async getConnection(organizationId: string, platform: string) {
    const connection = await this.prisma.connection.findFirst({
      where: {
        organizationId,
        platform,
        status: 'active',
      },
    })

    if (!connection) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `No active ${platform} connection found for this organization`,
      })
    }

    // Check if token expired
    if (connection.expiresAt && connection.expiresAt < new Date()) {
      // Auto-refresh token
      await this.refreshToken(connection.id)
      return this.getConnection(organizationId, platform)
    }

    return connection
  }

  /**
   * Refresh OAuth token
   */
  async refreshToken(connectionId: string) {
    const connection = await this.prisma.connection.findUnique({
      where: { id: connectionId },
    })

    if (!connection || !connection.refreshToken) {
      throw new Error('Cannot refresh token')
    }

    // TODO: Call platform OAuth refresh endpoint
    // For Meta: https://graph.facebook.com/v18.0/oauth/access_token

    // Update connection with new tokens
    await this.prisma.connection.update({
      where: { id: connectionId },
      data: {
        accessToken: 'new_token',
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        status: 'active',
      },
    })
  }

  /**
   * Create new connection (after OAuth flow)
   */
  async createConnection(data: {
    organizationId: string
    platform: string
    accessToken: string
    refreshToken?: string
    expiresAt?: Date
    adAccountId?: string
    createdBy: string
  }) {
    return this.prisma.connection.create({ data })
  }
}
```

#### Enhanced `ProviderAdapter` Interface

```typescript
// apps/api/src/providers/provider.adapter.ts
export interface ProviderAdapter {
  readonly name: PlatformType

  // ✅ Keep existing methods
  ensureAuth(orgId: string, connectionId: string): Promise<void>
  createCampaign(input: CreateCampaignInput): Promise<CreateResult>
  createAdSet(input: CreateAdSetInput): Promise<CreateResult>
  createAd(input: CreateAdInput): Promise<CreateResult>
  getMetrics(scope: MetricsScope, dateFrom: string, dateTo: string): Promise<AdMetrics[]>

  // 🆕 Add missing CRUD operations
  updateCampaign(campaignId: string, input: Partial<CreateCampaignInput>): Promise<CreateResult>
  pauseCampaign(campaignId: string): Promise<void>
  deleteCampaign(campaignId: string): Promise<void>

  // 🆕 Add resource fetching
  getAdAccounts(): Promise<AdAccount[]>
  getPages(adAccountId: string): Promise<Page[]>
  getAudiences(adAccountId: string): Promise<Audience[]>
  getPixels(adAccountId: string): Promise<Pixel[]>
  getLeadForms(pageId: string): Promise<LeadForm[]>

  // 🆕 Add media management
  uploadImage(adAccountId: string, imageData: Buffer, fileName: string): Promise<MediaUploadResult>
  uploadVideo(adAccountId: string, videoData: Buffer, fileName: string): Promise<MediaUploadResult>
  getMediaLibrary(adAccountId: string, type: 'image' | 'video'): Promise<Media[]>
}
```

---

### ⚙️ **Solution 4: Job Queue avec BullMQ**

#### Setup

```bash
pnpm add bullmq ioredis
pnpm add -D @types/ioredis
```

#### Queue Configuration

```typescript
// apps/api/src/queue/queue.config.ts
import { Queue, Worker } from 'bullmq'
import { Redis } from 'ioredis'

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
})

// Campaign Launch Queue
export const campaignLaunchQueue = new Queue('campaign-launch', { connection })

// Worker
export const campaignLaunchWorker = new Worker(
  'campaign-launch',
  async (job) => {
    console.log(`Processing job ${job.id}:`, job.data)

    const { organizationId, bulkLaunchId, platform } = job.data

    // Get provider adapter
    const connectionManager = new ConnectionManager(prisma)
    const connection = await connectionManager.getConnection(organizationId, platform)
    const adapter = ProviderFactory.create({
      platform,
      credentials: {
        accessToken: connection.accessToken,
        adAccountId: connection.adAccountId,
      },
    })

    // Launch campaigns (this can take 5-10 minutes)
    await adapter.bulkLaunch(bulkLaunchId)

    // Update job progress
    await job.updateProgress(100)
  },
  { connection }
)

campaignLaunchWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed!`)
})

campaignLaunchWorker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err)
})
```

#### Usage in tRPC

```typescript
// apps/api/src/trpc/routers/launch.router.ts
export const launchRouter = _router({
  startBulkLaunch: protectedProcedure
    .input(z.object({
      bulkLaunchId: z.string(),
      platform: z.enum(['META', 'GOOGLE', 'TIKTOK']),
    }))
    .mutation(async ({ ctx, input }) => {
      // Add job to queue instead of running synchronously
      const job = await campaignLaunchQueue.add('bulk-launch', {
        organizationId: ctx.user.organizationId,
        bulkLaunchId: input.bulkLaunchId,
        platform: input.platform,
      })

      return {
        jobId: job.id,
        status: 'queued',
      }
    }),

  getJobStatus: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ input }) => {
      const job = await campaignLaunchQueue.getJob(input.jobId)

      return {
        id: job?.id,
        progress: await job?.progress(),
        state: await job?.getState(),
      }
    }),
})
```

---

## 📋 Plan d'Implémentation Recommandé

### **Phase 1: Foundation (2-3 semaines)** 🏗️

#### Semaine 1: Database & Auth
- [ ] Setup Supabase project
- [ ] Create Prisma schema (users, organizations, memberships, connections)
- [ ] Run migrations
- [ ] Implement Supabase Auth
- [ ] Protected routes middleware
- [ ] Login/Signup pages
- [ ] Update tRPC context with user

#### Semaine 2: Multi-Tenancy
- [ ] Organization creation flow
- [ ] Membership management (invite users)
- [ ] Role-based access control (Owner, Admin, Member)
- [ ] Organization switcher UI
- [ ] Row Level Security policies

#### Semaine 3: Connection Management
- [ ] Create `ConnectionManager` service
- [ ] OAuth flow for Meta
- [ ] Store/refresh tokens
- [ ] Connection settings page
- [ ] Test token refresh logic

---

### **Phase 2: Multi-Platform (3-4 semaines)** 🌍

#### Semaine 4-5: Google Ads Integration
- [ ] Create `GoogleAdsAdapter` implementing `ProviderAdapter`
- [ ] OAuth flow for Google
- [ ] Implement all interface methods
- [ ] Test campaign creation
- [ ] Test insights sync

#### Semaine 6: TikTok Ads Integration
- [ ] Create `TikTokAdapter`
- [ ] OAuth flow for TikTok
- [ ] Implement interface
- [ ] Test

#### Semaine 7: LinkedIn/Snap Ads (Optional)
- [ ] Create adapters
- [ ] OAuth flows
- [ ] Tests

---

### **Phase 3: Scalability (2 semaines)** ⚡

#### Semaine 8: Job Queue
- [ ] Setup Redis (Railway/Upstash)
- [ ] Implement BullMQ queues
- [ ] Campaign launch jobs
- [ ] Media upload jobs
- [ ] Insights sync jobs
- [ ] Job status UI

#### Semaine 9: Monitoring & Performance
- [ ] Setup Sentry (error tracking)
- [ ] Setup LogRocket (session replay)
- [ ] Vercel Analytics
- [ ] Rate limiting (@nestjs/throttler)
- [ ] Caching (Redis)

---

## 🚀 Stack Technologique Recommandé

### ✅ **Déjà en Place**
- Next.js 16 (frontend)
- NestJS + tRPC (backend)
- Turborepo (monorepo)
- TypeScript
- Zod (validation)
- TailwindCSS

### 🆕 **À Ajouter**

#### Authentication & Database
- **Supabase** (Auth + PostgreSQL)
  - Free tier: 50k users, 500MB database
  - Pricing: $25/month pour unlimited
- **Prisma** (ORM)
  - Type-safe database access
  - Migrations built-in

#### Job Queue
- **BullMQ** + **Redis**
  - Redis hosting: Upstash (free tier) ou Railway ($5/month)

#### Monitoring
- **Sentry** (Error tracking)
  - Free tier: 5k errors/month
- **LogRocket** (Session replay)
  - Free tier: 1k sessions/month
- **Vercel Analytics** (already included with Vercel deploy)

#### Optional (Future)
- **Stripe** (billing si freemium/paid plans)
- **Resend** (transactional emails)
- **Clerk** (alternative à Supabase Auth si besoin features avancées)

---

## 💰 Coûts Estimés (Production)

### Free Tier (0-100 users)
- Supabase: Free
- Upstash Redis: Free (10k commands/day)
- Vercel: Free (hobby plan)
- Sentry: Free (5k errors)
- **Total: $0/mois**

### Small Business (100-1000 users)
- Supabase Pro: $25/month
- Upstash Redis: $10/month
- Vercel Pro: $20/month
- Sentry Team: $26/month
- **Total: ~$80/mois**

### Scale (1000+ users)
- Supabase: $80-200/month
- Redis: $20-50/month
- Vercel: $20-150/month
- Sentry: $80-200/month
- **Total: $200-600/mois**

---

## ✅ Checklist de Déploiement Production

### Avant Déploiement
- [ ] Authentification implémentée (Supabase)
- [ ] Multi-tenancy en place (Organizations)
- [ ] Tous les secrets en variables d'environnement
- [ ] HTTPS activé (Vercel = automatique)
- [ ] CORS configuré correctement
- [ ] Rate limiting activé
- [ ] Error monitoring (Sentry)
- [ ] Database backups configurés (Supabase auto)

### Post-Déploiement
- [ ] Monitoring actif
- [ ] Alerting configuré (Sentry, Vercel)
- [ ] Performance monitoring
- [ ] User feedback collection
- [ ] Documentation API à jour

---

## 🎯 Priorisation

### 🔴 **CRITIQUE** (Blocker pour prod)
1. Authentication (Supabase)
2. Database (Prisma + PostgreSQL)
3. Multi-tenancy (Organizations)
4. Connection Management (OAuth tokens)

### 🟡 **HIGH** (Important mais non-bloquant)
5. Job Queue (BullMQ)
6. Error Monitoring (Sentry)
7. Enhanced Provider Interface

### 🟢 **MEDIUM** (Nice to have)
8. Multi-platform support (Google, TikTok)
9. Rate limiting
10. Advanced analytics

---

## 📊 Estimation de Temps

| Phase | Durée | Effort |
|-------|-------|--------|
| Phase 1: Foundation | 2-3 semaines | High |
| Phase 2: Multi-Platform | 3-4 semaines | High |
| Phase 3: Scalability | 2 semaines | Medium |
| **Total** | **7-9 semaines** | **High** |

*Note*: Estimation pour 1 développeur full-time

---

## 🎓 Ressources

### Documentation
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Prisma Getting Started](https://www.prisma.io/docs/getting-started)
- [BullMQ Guide](https://docs.bullmq.io/)
- [tRPC Authentication](https://trpc.io/docs/server/authorization)

### Examples
- [Next.js + Supabase Starter](https://github.com/vercel/next.js/tree/canary/examples/with-supabase)
- [NestJS + Prisma](https://docs.nestjs.com/recipes/prisma)
- [Multi-tenant SaaS Template](https://github.com/vercel/nextjs-subscription-payments)

---

## 📝 Conclusion

Ton code est déjà **très propre** (9.8/10) après Phase 3, ce qui facilite grandement l'implémentation de la scalabilité. Les bases sont solides:

✅ **Points Forts**:
- Provider pattern déjà en place
- Architecture modulaire
- Monorepo organisé
- TypeScript strict

🔴 **Priorités Absolues**:
1. **Authentication** (Supabase) - 1 semaine
2. **Database** (Prisma) - 1 semaine
3. **Multi-tenancy** (Organizations) - 1 semaine
4. **Connection Management** - 1 semaine

Une fois ces 4 éléments en place, tu auras une base **production-ready** et tu pourras ajouter progressivement:
- Multi-platform support (Google, TikTok, etc.)
- Job queues pour performance
- Monitoring avancé

**Prêt à commencer par Phase 1: Foundation?** 🚀

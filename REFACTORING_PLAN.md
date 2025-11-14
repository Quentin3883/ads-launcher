# Refactoring Plan - Immediate Actions

## Phase 1: Dead Code Removal (1 hour)

### Files to Delete
```bash
# Remove unused geo components
rm apps/web/components/bulk-launcher/components/geo-autocomplete.tsx
rm apps/web/components/bulk-launcher/components/geo-location-picker.tsx
rm apps/web/components/bulk-launcher/components/unified-geo-autocomplete.tsx
```

### Verification
```bash
# Ensure build still works
pnpm turbo run build --filter=@launcher-ads/web
pnpm turbo run typecheck
```

---

## Phase 2: API Client Creation (4 hours)

### Step 1: Create API client structure
```
apps/web/lib/api/
├── client.ts          # Base fetch wrapper
├── endpoints/
│   ├── clients.ts     # Client endpoints
│   ├── campaigns.ts   # Campaign endpoints
│   ├── facebook.ts    # Facebook API endpoints
│   └── conventions.ts # Naming conventions endpoints
├── types.ts           # API types
└── index.ts           # Exports
```

### Step 2: Implement base client

```typescript
// apps/web/lib/api/client.ts
import { z } from 'zod'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export class APIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any
  ) {
    super(`API Error ${status}: ${statusText}`)
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit,
  schema?: z.ZodSchema<T>
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new APIError(response.status, response.statusText)
  }

  const data = await response.json()

  if (schema) {
    return schema.parse(data)
  }

  return data
}
```

### Step 3: Create endpoint modules

```typescript
// apps/web/lib/api/endpoints/clients.ts
import { apiRequest } from '../client'
import { z } from 'zod'

const ClientSchema = z.object({
  id: z.string(),
  name: z.string(),
  logoUrl: z.string().optional(),
})

export type Client = z.infer<typeof ClientSchema>

export const clientsAPI = {
  list: () =>
    apiRequest('/clients', {}, z.array(ClientSchema)),

  get: (id: string) =>
    apiRequest(`/clients/${id}`, {}, ClientSchema),

  create: (data: { name: string }) =>
    apiRequest('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    }, ClientSchema),

  update: (id: string, data: Partial<Client>) =>
    apiRequest(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, ClientSchema),

  delete: (id: string) =>
    apiRequest(`/clients/${id}`, { method: 'DELETE' }),
}
```

### Step 4: Migration strategy

**Priority files to migrate (28 fetch calls):**
1. `app/(dashboard)/integrations/page.tsx` - 9 fetch calls
2. `app/(dashboard)/clients/page.tsx` - 6 fetch calls
3. `components/settings/naming-settings.tsx` - 5 fetch calls
4. `components/dashboard/launch-list.tsx` - 1 fetch call
5. `lib/store/clients.ts` - 1 fetch call
6. Other components with scattered calls

**Migration example:**
```typescript
// Before
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients`)
const data = await response.json()
setClients(Array.isArray(data) ? data : [])

// After
import { clientsAPI } from '@/lib/api'

try {
  const clients = await clientsAPI.list()
  setClients(clients)
} catch (error) {
  console.error('Error fetching clients:', error)
  setClients([])
}
```

---

## Phase 3: Component Refactoring (8 hours)

### Priority: Split `creatives-bulk-step.tsx` (857 lines)

**New structure:**
```
components/bulk-launcher/steps/creatives/
├── index.tsx                    # Main orchestrator (~150 lines)
├── CreativesList.tsx            # List view (~150 lines)
├── CreativeForm.tsx             # Form for single creative (~200 lines)
├── CreativePreview.tsx          # Preview panel (~150 lines)
├── VariantsSection.tsx          # Variants toggle/config (~100 lines)
├── hooks/
│   ├── useCreativeValidation.ts # Validation logic
│   └── useCreativeForm.ts       # Form state management
└── types.ts                     # Local types
```

**Refactoring template:**

```typescript
// components/bulk-launcher/steps/creatives/index.tsx
import { CreativesList } from './CreativesList'
import { CreativeForm } from './CreativeForm'
import { CreativePreview } from './CreativePreview'
import { VariantsSection } from './VariantsSection'
import { useBulkLauncherStore } from '@/lib/store/bulk-launcher'

export function CreativesBulkStep() {
  const store = useBulkLauncherStore()

  return (
    <div className="space-y-6">
      <VariantsSection />
      <CreativesList />
      {store.selectedCreative && (
        <>
          <CreativeForm />
          <CreativePreview />
        </>
      )}
    </div>
  )
}
```

**Repeat for:**
- `audiences-bulk-step.tsx` (837 lines)
- `campaign-config-step.tsx` (827 lines)

---

## Phase 4: Code Splitting (4 hours)

### Add dynamic imports for heavy modals

```typescript
// components/dashboard/bulk-launcher-modal.tsx (Before)
import { BulkLauncherContent } from './BulkLauncherContent'

// (After)
import dynamic from 'next/dynamic'

const BulkLauncherContent = dynamic(
  () => import('./BulkLauncherContent'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
)
```

**Files to optimize:**
1. `dashboard/bulk-launcher-modal.tsx` (694 lines)
2. All step components in `bulk-launcher/steps/`
3. `strategy-workflow/node-config-panel.tsx` (592 lines)
4. `media-library-modal.tsx` (255 lines)

### Measure impact

```bash
# Before changes
pnpm run build
# Check .next/static bundle sizes

# After changes
pnpm run build
# Compare bundle sizes
```

---

## Phase 5: Fix @ts-nocheck Files (16 hours)

### Priority 1: tRPC Type Collisions (12 files)

**Root cause:** tRPC reserved names (useContext, useUtils, Provider)

**Solution options:**

1. **Rename tRPC router exports**
```typescript
// apps/web/lib/trpc.ts
export const api = trpc.createClient() // Instead of 'trpc'
```

2. **Use tRPC namespace**
```typescript
import { api } from '@/lib/trpc'

// Instead of destructuring
const { data } = api.clients.list.useQuery()
```

3. **Upgrade tRPC** (if newer version fixes this)

**Files to fix:**
```
bulk-launcher-modal.tsx
redirection-section.tsx
optimization-section.tsx
accounts-pixel-section.tsx
matrix-generation-step.tsx
express-page-step.tsx
campaign-config-step.tsx
audiences-bulk-step.tsx
ad-account-selection-step.tsx
geo-location-autocomplete.tsx
use-launch-campaign.ts
express-client-step.tsx
```

### Priority 2: Workflow Types (6 files)

**Create proper type definitions:**

```typescript
// lib/types/workflow.types.ts
export interface StrategyCanvas {
  stages: FunnelStage[]
  budget: BudgetConfig
  platforms: PlatformConfig[]
}

export interface FunnelStage {
  id: string
  name: 'awareness' | 'consideration' | 'conversion'
  platforms: PlatformStageBlock[]
}

export interface PlatformStageBlock {
  platform: Platform
  budget: number
  campaigns: CampaignConfig[]
}

export type Platform = 'META' | 'GOOGLE' | 'LINKEDIN' | 'SNAP' | 'TIKTOK'
```

**Files to fix:**
```
campaign-node.tsx
funnel-preview.tsx
node-config-panel.tsx
platform-sidebar.tsx
strategy-canvas.ts
blueprint.ts
```

---

## Phase 6: Add Testing Infrastructure (12 hours)

### Step 1: Install Vitest

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event jsdom
```

### Step 2: Configure Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

### Step 3: Write first tests

```typescript
// lib/api/client.test.ts
import { describe, it, expect, vi } from 'vitest'
import { apiRequest } from './client'

describe('API Client', () => {
  it('should make GET request', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: '1', name: 'Test' }),
      })
    )

    const result = await apiRequest('/test')
    expect(result).toEqual({ id: '1', name: 'Test' })
  })

  it('should throw on error response', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })
    )

    await expect(apiRequest('/test')).rejects.toThrow('API Error 404')
  })
})
```

**Priority test files:**
1. `lib/api/client.test.ts`
2. `lib/hooks/use-launch-campaign.test.ts`
3. `lib/store/bulk-launcher.test.ts`
4. `lib/utils/matrix-generator.test.ts` (if exists)

---

## Success Metrics

### After Phase 1-3 (Immediate)
- ✅ 17.7KB dead code removed
- ✅ 0 direct fetch calls (all via API client)
- ✅ Largest file < 400 lines
- ✅ Build time < 8s

### After Phase 4-6 (Short-term)
- ✅ Initial bundle size ↓30%
- ✅ @ts-nocheck files: 18 → 0
- ✅ Test coverage: 0% → 30%
- ✅ Type safety: 87% → 95%

---

## Execution Timeline

| Phase | Task | Duration | Priority |
|-------|------|----------|----------|
| 1 | Delete dead code | 1h | 🔴 Critical |
| 2 | API client | 4h | 🔴 Critical |
| 3 | Split components | 8h | 🔴 Critical |
| 4 | Code splitting | 4h | 🟡 High |
| 5 | Fix @ts-nocheck | 16h | 🟡 High |
| 6 | Add tests | 12h | 🟡 High |

**Total estimated time:** 45 hours (~1 week for 1 developer)

---

## Next Steps

1. ✅ Review refactoring plan
2. ⏳ Start with Phase 1 (dead code removal)
3. ⏳ Implement Phase 2 (API client)
4. ⏳ Continue with remaining phases

**Ready to start implementation?**

Run:
```bash
# Phase 1
rm apps/web/components/bulk-launcher/components/geo-autocomplete.tsx
rm apps/web/components/bulk-launcher/components/geo-location-picker.tsx
rm apps/web/components/bulk-launcher/components/unified-geo-autocomplete.tsx
pnpm turbo run typecheck

# If passing, commit
git add -A
git commit -m "refactor: Remove unused geo components"
```

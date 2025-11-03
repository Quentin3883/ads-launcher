# 🚀 Launcher Ads

**Multi-platform ad campaign launcher and analyzer** - Create and manage campaigns across Meta (Facebook/Instagram), Google Ads, LinkedIn, and Snap Ads from a single interface.

## ✨ Features

- 🎯 **Bulk Campaign Creation** - Launch hundreds of ad variations in minutes
- 📊 **Unified Analytics** - Track performance across all platforms
- 🔄 **Campaign Sync** - Real-time sync with Meta, Google, LinkedIn APIs
- 🎨 **Visual Builder** - Intuitive wizard for campaign configuration
- 📈 **Advanced Targeting** - Audience presets, geo-targeting, demographics
- 🔐 **Multi-User** - Client management with role-based access

## 🏃 Quick Start

```bash
# Install dependencies
pnpm install

# Configure environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Edit .env files with your credentials

# Set up database
pnpm db:migrate
pnpm db:seed

# Start dev servers (API on :4000, Web on :3000)
pnpm dev
```

Visit:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000
- **Prisma Studio**: `pnpm db:studio`

## 📁 Project Structure

```
launcher-ads/
├── apps/
│   ├── api/                    # NestJS backend
│   │   ├── src/
│   │   │   ├── facebook/       # Facebook/Instagram integration
│   │   │   │   └── controllers/  # ✅ Split controllers (auth, campaigns, insights, admin, debug)
│   │   │   ├── launches/       # Campaign launch logic
│   │   │   ├── clients/        # Client management
│   │   │   ├── prisma/         # Database service
│   │   │   └── trpc/           # tRPC routers
│   │   └── prisma/
│   │       └── schema.prisma   # Database schema
│   │
│   └── web/                    # Next.js 16 frontend
│       ├── app/                # App Router
│       ├── components/
│       │   ├── bulk-launcher/  # Bulk campaign wizard
│       │   ├── dashboard/      # Dashboard components
│       │   └── ui/             # UI components
│       └── lib/
│           ├── store/          # Zustand state management
│           ├── hooks/          # Custom React hooks
│           └── api/            # API clients
│
└── packages/
    ├── sdk/                    # ✅ Single source of truth for types
    │   └── src/
    │       ├── schemas/        # Zod schemas (blueprint, launch, bulk-launcher)
    │       └── types/          # TypeScript types
    │
    ├── ui/                     # Shared React components
    │   └── src/
    │       └── components/     # Button, Card, Form, etc.
    │
    └── config/                 # Shared configs
        ├── eslint/
        └── typescript/
```

## 🛠️ Available Commands

### Development
```bash
pnpm dev              # Start all apps (API + Web)
pnpm dev:api          # Start API only
pnpm dev:web          # Start Web only
```

### Database
```bash
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed database
pnpm db:studio        # Open Prisma Studio UI
pnpm db:reset         # Reset database
```

### Testing & Quality
```bash
pnpm typecheck        # Check TypeScript types
pnpm lint             # Run ESLint
pnpm test             # Run tests
pnpm format           # Format with Prettier
pnpm format:check     # Check formatting
```

### Build
```bash
pnpm build            # Build all apps
pnpm clean            # Clean all build artifacts
```

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5.9 (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand + TanStack Query
- **Forms**: Zod validation
- **Icons**: Lucide React
- **Animations**: Framer Motion

### Backend
- **Framework**: NestJS 11
- **API**: tRPC (type-safe) + REST
- **Database**: PostgreSQL + Prisma ORM
- **Storage**: Supabase Storage (files only)
- **Auth**: Passport (Facebook OAuth)
- **Validation**: Zod

### DevOps & Tools
- **Monorepo**: Turborepo + pnpm workspaces
- **Linting**: ESLint + Prettier
- **Testing**: Vitest + Testing Library
- **Git Hooks**: Husky + lint-staged
- **Package Manager**: pnpm 9.15+
- **Node Version**: >= 20.0.0

## 📚 Documentation

- **[Architecture Guide](./ARCHITECTURE.md)** - Database strategy, controllers structure, workflows
- **[Development Rules](./.claudecode/RULES.md)** - Coding standards and best practices
- **[Claude Code Guide](./.claudecode/README.md)** - Instructions for AI assistants

## 🎯 Key Concepts

### Single Source of Truth
All types and schemas are defined in `packages/sdk` using Zod:
```typescript
import { CampaignType, BulkCampaignOutput } from '@launcher-ads/sdk'
```

### Controller Organization
Each platform integration is split into specialized controllers:
- `[platform]-auth.controller.ts` - OAuth flow
- `[platform]-campaigns.controller.ts` - CRUD operations
- `[platform]-insights.controller.ts` - Analytics
- `[platform]-admin.controller.ts` - Admin operations
- `[platform]-debug.controller.ts` - Debug endpoints (dev only)

### Type Safety
- ✅ Zod validation everywhere
- ✅ tRPC for type-safe APIs
- ✅ Prisma for type-safe database queries
- ✅ No `any` types

### Performance
- ✅ React components memoized (`memo`, `useCallback`, `useMemo`)
- ✅ Optimistic UI updates
- ✅ Prisma query optimization (no N+1)
- ✅ Next.js automatic code splitting

## 🔒 Environment Variables

### API (.env)
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/launcher_ads"

# Facebook
FACEBOOK_APP_ID="your_app_id"
FACEBOOK_APP_SECRET="your_app_secret"
FACEBOOK_CALLBACK_URL="http://localhost:4000/facebook/auth/callback"
META_PAGE_ID="your_page_id"

# Supabase (for file storage)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your_anon_key"

# Frontend URL
FRONTEND_URL="http://localhost:3000"
```

### Web (.env.local)
```env
# API
NEXT_PUBLIC_API_URL="http://localhost:4000"

# Supabase (optional, for direct uploads)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## 📊 Database Schema

See [ARCHITECTURE.md](./ARCHITECTURE.md#schéma-de-données) for the complete Prisma schema.

**Key models**:
- `User` - Application users
- `Client` - Advertisers/clients
- `FacebookToken` - OAuth tokens
- `FacebookAdAccount` - Ad accounts from Meta
- `FacebookCampaign` - Campaigns synced from Meta
- `FacebookCampaignInsight` - Performance metrics

## 🚀 Deployment

### Production Build
```bash
# Build all apps
pnpm build

# Run migrations
pnpm db:migrate

# Start production servers
NODE_ENV=production node apps/api/dist/main.js
NODE_ENV=production node apps/web/.next/standalone/server.js
```

### Docker (Coming Soon)
```bash
docker-compose up
```

## 🤝 Contributing

1. Read [RULES.md](./.claudecode/RULES.md) for coding standards
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes following the conventions
4. Run tests and linting: `pnpm test && pnpm lint`
5. Commit with conventional commits: `feat(scope): description`
6. Push and create a Pull Request

## 📝 License

Proprietary - All rights reserved

## 🆘 Support

For issues or questions:
1. Check [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Check [RULES.md](./.claudecode/RULES.md)
3. Open an issue on GitHub

---

**Version**: 2.0.0
**Last Updated**: October 30, 2025
**Status**: ✅ Production Ready (after refactoring)

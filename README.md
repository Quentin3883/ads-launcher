# Launcher Ads

Multi-platform ad campaign launcher and analyzer (Meta, Google, LinkedIn, Snap).

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up database
pnpm dx:up

# Start dev servers
pnpm dev
```

## Project Structure

- `apps/web` - Next.js 15 frontend
- `apps/api` - NestJS backend with tRPC
- `packages/sdk` - Shared types and schemas
- `packages/ui` - Shared React components
- `packages/config` - Shared configuration

## Available Commands

- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all apps
- `pnpm lint` - Lint all apps
- `pnpm test` - Run all tests
- `pnpm format` - Format all files
- `pnpm db:migrate` - Run database migrations
- `pnpm db:seed` - Seed database
- `pnpm db:studio` - Open Prisma Studio

## Tech Stack

- **Monorepo**: Turborepo + pnpm
- **Frontend**: Next.js 15, shadcn/ui, Tailwind, Zustand, TanStack Query
- **Backend**: NestJS, Prisma, tRPC
- **Database**: PostgreSQL
- **Language**: TypeScript (strict mode)
- **Testing**: Vitest
- **Linting**: ESLint + Prettier

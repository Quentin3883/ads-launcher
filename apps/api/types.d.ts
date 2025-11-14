/**
 * Type-only exports for client consumption
 * Re-export to prevent cross-project type conflicts
 */
import type { TrpcRouter } from './src/trpc/trpc.router'
export type AppRouter = TrpcRouter['appRouter']

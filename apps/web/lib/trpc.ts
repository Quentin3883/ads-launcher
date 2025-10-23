import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@launcher-ads/api'

export const trpc = createTRPCReact<AppRouter>()

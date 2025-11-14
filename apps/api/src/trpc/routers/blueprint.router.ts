import { z } from 'zod'
import { createBlueprintSchema, updateBlueprintSchema } from '@launcher-ads/sdk'
import { PrismaService } from '../../prisma/prisma.service'
import { _publicProcedure, _router } from '../trpc.router'

export const blueprintRouter = (prisma: PrismaService) =>
  _router({
    list: _publicProcedure.query(async () => {
      return await prisma.blueprint.findMany({
        orderBy: { createdAt: 'desc' },
      })
    }),

    getById: _publicProcedure.input(z.string().uuid()).query(async ({ input }) => {
      const blueprint = await prisma.blueprint.findUnique({
        where: { id: input },
        include: {
          launches: {
            orderBy: { createdAt: 'desc' },
          },
        },
      })

      if (!blueprint) {
        throw new Error('Blueprint not found')
      }

      return blueprint
    }),

    create: _publicProcedure
      .input(createBlueprintSchema)
      .mutation(async ({ input }) => {
        return await prisma.blueprint.create({
          data: input,
        })
      }),

    update: _publicProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          data: updateBlueprintSchema,
        })
      )
      .mutation(async ({ input }) => {
        return await prisma.blueprint.update({
          where: { id: input.id },
          data: input.data,
        })
      }),

    delete: _publicProcedure
      .input(z.string().uuid())
      .mutation(async ({ input }) => {
        return await prisma.blueprint.delete({
          where: { id: input },
        })
      }),
  })

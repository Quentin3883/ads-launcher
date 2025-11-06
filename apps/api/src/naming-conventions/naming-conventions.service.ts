import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class NamingConventionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new naming convention
   */
  async create(data: {
    name: string
    description?: string
    template: string
    variables?: any
    isDefault?: boolean
  }) {
    // Si isDefault = true, retirer le flag des autres conventions
    if (data.isDefault) {
      await this.prisma.namingConvention.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    return this.prisma.namingConvention.create({
      data: {
        name: data.name,
        description: data.description,
        template: data.template,
        variables: data.variables || {},
        isDefault: data.isDefault || false,
      },
    })
  }

  /**
   * Get all naming conventions
   */
  async findAll(includeInactive = false) {
    return this.prisma.namingConvention.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        clients: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })
  }

  /**
   * Get default naming convention
   */
  async findDefault() {
    const convention = await this.prisma.namingConvention.findFirst({
      where: {
        isDefault: true,
        isActive: true,
      },
    })

    // Si aucune convention par défaut, créer une convention standard
    if (!convention) {
      return this.create({
        name: 'Convention Standard',
        description: 'Convention de naming par défaut',
        template:
          '{{clientName}} | d:{{date}} - sub:{{subject}} - loc:{{location}} - obj:{{objective}} - redir:{{redirectionType}}',
        variables: {
          date: { format: 'MMYYYY' },
          location: { strategy: 'auto' },
        },
        isDefault: true,
      })
    }

    return convention
  }

  /**
   * Get one naming convention by ID
   */
  async findOne(id: string) {
    const convention = await this.prisma.namingConvention.findUnique({
      where: { id },
      include: {
        clients: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!convention) {
      throw new NotFoundException(`Naming convention ${id} not found`)
    }

    return convention
  }

  /**
   * Get naming convention for a specific client
   */
  async findForClient(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: {
        namingConvention: true,
      },
    })

    // Si le client a une convention assignée, la retourner
    if (client?.namingConvention) {
      return client.namingConvention
    }

    // Sinon retourner la convention par défaut
    return this.findDefault()
  }

  /**
   * Update a naming convention
   */
  async update(
    id: string,
    data: {
      name?: string
      description?: string
      template?: string
      variables?: any
      isDefault?: boolean
      isActive?: boolean
    }
  ) {
    // Si on définit comme défaut, retirer le flag des autres
    if (data.isDefault) {
      await this.prisma.namingConvention.updateMany({
        where: {
          id: { not: id },
          isDefault: true,
        },
        data: { isDefault: false },
      })
    }

    return this.prisma.namingConvention.update({
      where: { id },
      data,
    })
  }

  /**
   * Delete a naming convention
   */
  async delete(id: string) {
    const convention = await this.findOne(id)

    // Ne pas supprimer la convention par défaut
    if (convention.isDefault) {
      throw new Error('Cannot delete the default naming convention')
    }

    return this.prisma.namingConvention.delete({
      where: { id },
    })
  }

  /**
   * Assign naming convention to clients
   */
  async assignToClients(conventionId: string, clientIds: string[]) {
    await this.findOne(conventionId) // Vérifier que la convention existe

    return this.prisma.client.updateMany({
      where: {
        id: { in: clientIds },
      },
      data: {
        namingConventionId: conventionId,
      },
    })
  }

  /**
   * Remove naming convention from clients (will use default)
   */
  async removeFromClients(clientIds: string[]) {
    return this.prisma.client.updateMany({
      where: {
        id: { in: clientIds },
      },
      data: {
        namingConventionId: null,
      },
    })
  }
}

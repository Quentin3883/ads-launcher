import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.client.findMany({
      include: {
        contacts: true,
        adAccounts: {
          select: {
            id: true,
            name: true,
            facebookId: true,
          },
        },
        _count: {
          select: {
            adAccounts: true,
            contacts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async findOne(id: string) {
    return this.prisma.client.findUnique({
      where: { id },
      include: {
        contacts: true,
        adAccounts: {
          include: {
            campaigns: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
      },
    })
  }

  async create(data: {
    name: string
    industry?: string
    website?: string
    notes?: string
    contacts?: Array<{
      name: string
      email: string
      phone?: string
      position?: string
      isPrimary?: boolean
    }>
  }) {
    const { contacts, ...clientData } = data
    return this.prisma.client.create({
      data: {
        ...clientData,
        contacts: contacts
          ? {
              create: contacts,
            }
          : undefined,
      },
      include: {
        contacts: true,
      },
    })
  }

  async update(
    id: string,
    data: {
      name?: string
      industry?: string
      website?: string
      notes?: string
      isActive?: boolean
    },
  ) {
    return this.prisma.client.update({
      where: { id },
      data,
      include: {
        contacts: true,
      },
    })
  }

  async delete(id: string) {
    return this.prisma.client.delete({
      where: { id },
    })
  }

  async getAdAccounts(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        adAccounts: {
          include: {
            campaigns: true,
          },
        },
      },
    })

    return client?.adAccounts || []
  }

  // Contact management
  async addContact(
    clientId: string,
    data: {
      name: string
      email: string
      phone?: string
      position?: string
      isPrimary?: boolean
    },
  ) {
    return this.prisma.clientContact.create({
      data: {
        ...data,
        clientId,
      },
    })
  }

  async updateContact(
    contactId: string,
    data: {
      name?: string
      email?: string
      phone?: string
      position?: string
      isPrimary?: boolean
    },
  ) {
    return this.prisma.clientContact.update({
      where: { id: contactId },
      data,
    })
  }

  async deleteContact(contactId: string) {
    return this.prisma.clientContact.delete({
      where: { id: contactId },
    })
  }
}

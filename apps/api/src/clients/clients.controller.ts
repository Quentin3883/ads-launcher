import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ClientsService } from './clients.service'
import { SupabaseService } from '../supabase/supabase.service'

@Controller('clients')
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Get()
  async getAllClients() {
    return this.clientsService.findAll()
  }

  @Get(':id')
  async getClient(@Param('id') id: string) {
    return this.clientsService.findOne(id)
  }

  @Post()
  async createClient(
    @Body()
    data: {
      name: string
      industry?: string
      website?: string
      logoUrl?: string
      notes?: string
      contacts?: Array<{
        name: string
        email: string
        phone?: string
        position?: string
        isPrimary?: boolean
      }>
    },
  ) {
    return this.clientsService.create(data)
  }

  @Put(':id')
  async updateClient(
    @Param('id') id: string,
    @Body()
    data: {
      name?: string
      industry?: string
      website?: string
      logoUrl?: string
      notes?: string
      isActive?: boolean
    },
  ) {
    return this.clientsService.update(id, data)
  }

  @Post(':id/upload-logo')
  @UseInterceptors(
    FileInterceptor('logo', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadLogo(
    @Param('id') id: string,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new Error('No file uploaded')
    }

    // Validate file type
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
      throw new Error('Only image files are allowed!')
    }

    // Generate unique filename
    const randomName = Array(32)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('')
    const ext = file.originalname.split('.').pop()
    const fileName = `${randomName}.${ext}`
    const filePath = `client-logos/${fileName}`

    // Upload to Supabase Storage
    const { publicUrl } = await this.supabaseService.uploadFile(
      'clients',
      filePath,
      file.buffer,
      file.mimetype,
    )

    // Update client with new logo URL
    return this.clientsService.update(id, { logoUrl: publicUrl } as any)
  }

  @Delete(':id')
  async deleteClient(@Param('id') id: string) {
    return this.clientsService.delete(id)
  }

  @Get(':id/ad-accounts')
  async getClientAdAccounts(@Param('id') id: string) {
    return this.clientsService.getAdAccounts(id)
  }

  // Contact endpoints
  @Post(':id/contacts')
  async addContact(
    @Param('id') clientId: string,
    @Body()
    data: {
      name: string
      email: string
      phone?: string
      position?: string
      isPrimary?: boolean
    },
  ) {
    return this.clientsService.addContact(clientId, data)
  }

  @Put('contacts/:contactId')
  async updateContact(
    @Param('contactId') contactId: string,
    @Body()
    data: {
      name?: string
      email?: string
      phone?: string
      position?: string
      isPrimary?: boolean
    },
  ) {
    return this.clientsService.updateContact(contactId, data)
  }

  @Delete('contacts/:contactId')
  async deleteContact(@Param('contactId') contactId: string) {
    return this.clientsService.deleteContact(contactId)
  }
}

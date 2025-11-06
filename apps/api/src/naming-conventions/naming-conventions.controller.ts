import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common'
import { NamingConventionsService } from './naming-conventions.service'

@Controller('naming-conventions')
export class NamingConventionsController {
  constructor(
    private readonly namingConventionsService: NamingConventionsService
  ) {}

  @Post()
  async create(
    @Body()
    data: {
      name: string
      description?: string
      template: string
      variables?: any
      isDefault?: boolean
    }
  ) {
    return this.namingConventionsService.create(data)
  }

  @Get()
  async findAll(@Query('includeInactive') includeInactive?: string) {
    return this.namingConventionsService.findAll(includeInactive === 'true')
  }

  @Get('default')
  async findDefault() {
    return this.namingConventionsService.findDefault()
  }

  @Get('client/:clientId')
  async findForClient(@Param('clientId') clientId: string) {
    return this.namingConventionsService.findForClient(clientId)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.namingConventionsService.findOne(id)
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body()
    data: {
      name?: string
      description?: string
      template?: string
      variables?: any
      isDefault?: boolean
      isActive?: boolean
    }
  ) {
    return this.namingConventionsService.update(id, data)
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.namingConventionsService.delete(id)
  }

  @Post(':id/assign-clients')
  async assignToClients(
    @Param('id') id: string,
    @Body() data: { clientIds: string[] }
  ) {
    return this.namingConventionsService.assignToClients(id, data.clientIds)
  }

  @Post('remove-from-clients')
  async removeFromClients(@Body() data: { clientIds: string[] }) {
    return this.namingConventionsService.removeFromClients(data.clientIds)
  }
}

import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common'
import { BulkLaunchesService } from './bulk-launches.service'

@Controller('bulk-launches')
export class BulkLaunchesController {
  constructor(private readonly bulkLaunchesService: BulkLaunchesService) {}

  /**
   * Create a new bulk launch (save configuration)
   */
  @Post()
  async create(@Body() data: any) {
    return this.bulkLaunchesService.create(data)
  }

  /**
   * Get all bulk launches for a user
   */
  @Get()
  async findAll(
    @Query('userId') userId: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.bulkLaunchesService.findAll(userId, clientId)
  }

  /**
   * Get a single bulk launch by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.bulkLaunchesService.findOne(id)
  }

  /**
   * Update a bulk launch
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.bulkLaunchesService.update(id, data)
  }

  /**
   * Delete a bulk launch
   */
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.bulkLaunchesService.delete(id)
  }

  /**
   * Mark launch as successfully created on Facebook
   */
  @Post(':id/mark-launched')
  async markLaunched(
    @Param('id') id: string,
    @Body() data: { facebookCampaignId: string; facebookData?: any },
  ) {
    return this.bulkLaunchesService.markLaunched(id, data)
  }
}

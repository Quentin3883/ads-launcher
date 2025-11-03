import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common'
import { LaunchesService } from './launches.service'
import { CreateBulkLaunchDto } from './dto/create-bulk-launch.dto'

@Controller('launches')
export class LaunchesController {
  constructor(private readonly launchesService: LaunchesService) {}

  @Post('bulk-create')
  @HttpCode(HttpStatus.CREATED)
  async createBulkLaunch(@Body() dto: CreateBulkLaunchDto) {
    return this.launchesService.createBulkLaunch(dto)
  }

  @Get(':launchId/status')
  async getLaunchStatus(@Param('launchId') launchId: string) {
    return this.launchesService.getLaunchStatus(launchId)
  }

  @Get('user/:userId')
  async getUserLaunches(@Param('userId') userId: string) {
    return this.launchesService.getUserLaunches(userId)
  }
}

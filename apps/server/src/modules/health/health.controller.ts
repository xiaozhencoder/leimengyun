import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { HealthService } from './health.service'
import { CreateBloodSugarDto, CreateDietRecordDto, CreateMedicationDto } from './health.dto'

@ApiTags('健康数据')
@Controller('health')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Post('blood-sugar')
  @ApiOperation({ summary: '记录血糖' })
  async createBloodSugar(@Request() req, @Body() dto: CreateBloodSugarDto) {
    return this.healthService.createBloodSugar(req.user.id, dto)
  }

  @Get('blood-sugar')
  @ApiOperation({ summary: '获取血糖记录列表' })
  async getBloodSugars(
    @Request() req,
    @Query('days') days?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.healthService.getBloodSugars(req.user.id, parseInt(days || '7'), start, end)
  }

  @Post('diet')
  @ApiOperation({ summary: '记录饮食' })
  async createDiet(@Request() req, @Body() dto: CreateDietRecordDto) {
    return this.healthService.createDiet(req.user.id, dto)
  }

  @Get('diet')
  @ApiOperation({ summary: '获取饮食记录列表' })
  async getDiets(@Request() req, @Query('days') days?: string) {
    return this.healthService.getDiets(req.user.id, parseInt(days || '7'))
  }

  @Post('medication')
  @ApiOperation({ summary: '记录用药' })
  async createMedication(@Request() req, @Body() dto: CreateMedicationDto) {
    return this.healthService.createMedication(req.user.id, dto)
  }

  @Get('medication')
  @ApiOperation({ summary: '获取用药记录列表' })
  async getMedications(@Request() req, @Query('days') days?: string) {
    return this.healthService.getMedications(req.user.id, parseInt(days || '7'))
  }

  @Get('today-summary')
  @ApiOperation({ summary: '获取今日概览' })
  async getTodaySummary(
    @Request() req,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.healthService.getTodaySummary(req.user.id, start, end)
  }
}

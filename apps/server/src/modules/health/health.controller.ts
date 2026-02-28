import { Controller, Get, Post, Body, Query, UseGuards, NotFoundException } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { PrismaService } from '../common/prisma.service'
import { HealthService } from './health.service'
import {
  CreateBloodSugarDto,
  CreateDietDto,
  CreateMedicationDto,
  DateRangeQueryDto,
  TrendQueryDto,
} from './dto'

@ApiTags('健康数据')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly prisma: PrismaService,
  ) {}

  private async getPatientProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.patientProfile.findUnique({
      where: { userId },
      select: { id: true },
    })
    if (!profile) {
      throw new NotFoundException('患者档案不存在，请先创建档案')
    }
    return profile.id
  }

  @Post('blood-sugar')
  @ApiOperation({ summary: '记录血糖' })
  async createBloodSugar(
    @CurrentUser() user: { userId: string; role: string },
    @Body() dto: CreateBloodSugarDto,
  ) {
    const profileId = await this.getPatientProfileId(user.userId)
    return this.healthService.createBloodSugar(profileId, dto)
  }

  @Get('blood-sugar')
  @ApiOperation({ summary: '查询血糖记录' })
  async getBloodSugars(
    @CurrentUser() user: { userId: string; role: string },
    @Query() query: DateRangeQueryDto,
  ) {
    const profileId = await this.getPatientProfileId(user.userId)
    return this.healthService.getBloodSugars(profileId, query)
  }

  @Post('diet')
  @ApiOperation({ summary: '记录饮食' })
  async createDiet(
    @CurrentUser() user: { userId: string; role: string },
    @Body() dto: CreateDietDto,
  ) {
    const profileId = await this.getPatientProfileId(user.userId)
    return this.healthService.createDiet(profileId, dto)
  }

  @Get('diet')
  @ApiOperation({ summary: '查询饮食记录' })
  async getDiets(
    @CurrentUser() user: { userId: string; role: string },
    @Query() query: DateRangeQueryDto,
  ) {
    const profileId = await this.getPatientProfileId(user.userId)
    return this.healthService.getDiets(profileId, query)
  }

  @Post('medication')
  @ApiOperation({ summary: '记录用药' })
  async createMedication(
    @CurrentUser() user: { userId: string; role: string },
    @Body() dto: CreateMedicationDto,
  ) {
    const profileId = await this.getPatientProfileId(user.userId)
    return this.healthService.createMedication(profileId, dto)
  }

  @Get('medication')
  @ApiOperation({ summary: '查询用药记录' })
  async getMedications(
    @CurrentUser() user: { userId: string; role: string },
    @Query() query: DateRangeQueryDto,
  ) {
    const profileId = await this.getPatientProfileId(user.userId)
    return this.healthService.getMedications(profileId, query)
  }

  @Get('dashboard')
  @ApiOperation({ summary: '今日仪表盘' })
  async getDashboard(@CurrentUser() user: { userId: string; role: string }) {
    const profileId = await this.getPatientProfileId(user.userId)
    return this.healthService.getDashboard(profileId)
  }

  @Get('trend')
  @ApiOperation({ summary: '血糖趋势' })
  async getTrend(
    @CurrentUser() user: { userId: string; role: string },
    @Query() query: TrendQueryDto,
  ) {
    const profileId = await this.getPatientProfileId(user.userId)
    return this.healthService.getTrend(profileId, query.days || 7)
  }
}

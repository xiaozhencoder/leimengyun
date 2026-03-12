import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { UserService } from './user.service'
import { CreatePatientProfileDto, CreateDoctorProfileDto, UpdatePatientProfileDto, UpdateDoctorProfileDto } from './user.dto'

@ApiTags('用户')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  async getMe(@Request() req) {
    return this.userService.getUserWithProfile(req.user.id)
  }

  @Post('patient-profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建患者档案' })
  async createPatientProfile(@Request() req, @Body() dto: CreatePatientProfileDto) {
    return this.userService.createPatientProfile(req.user.id, dto)
  }

  @Post('doctor-profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建医生档案' })
  async createDoctorProfile(@Request() req, @Body() dto: CreateDoctorProfileDto) {
    return this.userService.createDoctorProfile(req.user.id, dto)
  }

  @Patch('patient-profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新患者档案' })
  async updatePatientProfile(@Request() req, @Body() dto: UpdatePatientProfileDto) {
    return this.userService.updatePatientProfile(req.user.id, dto)
  }

  @Patch('doctor-profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新医生档案' })
  async updateDoctorProfile(@Request() req, @Body() dto: UpdateDoctorProfileDto) {
    return this.userService.updateDoctorProfile(req.user.id, dto)
  }

  @Get('doctors')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '搜索医生列表' })
  async getDoctors(@Query('keyword') keyword?: string) {
    return this.userService.getDoctors(keyword)
  }

  @Post('bind-doctor/:doctorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '患者发起绑定医生' })
  async bindDoctor(@Request() req, @Param('doctorId') doctorId: string) {
    return this.userService.bindDoctor(req.user.id, doctorId)
  }

  @Get('my-doctors')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '患者获取已绑定医生列表' })
  async getMyDoctors(@Request() req) {
    return this.userService.getMyDoctors(req.user.id)
  }

  @Get('my-patients')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '医生获取已绑定患者列表' })
  async getMyPatients(@Request() req) {
    return this.userService.getMyPatients(req.user.id)
  }

  @Get('pending-binds')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '医生获取待审核绑定申请' })
  async getPendingBinds(@Request() req) {
    return this.userService.getPendingBinds(req.user.id)
  }

  @Put('bind/:bindId/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '医生通过绑定申请' })
  async approveBind(@Request() req, @Param('bindId') bindId: string) {
    return this.userService.approveBind(req.user.id, bindId)
  }

  @Put('bind/:bindId/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '医生拒绝绑定申请' })
  async rejectBind(@Request() req, @Param('bindId') bindId: string) {
    return this.userService.rejectBind(bindId)
  }

  @Get('patient/:patientUserId/health-data')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '医生查看患者健康数据' })
  async getPatientHealthData(
    @Request() req,
    @Param('patientUserId') patientUserId: string,
    @Query('days') days?: string,
  ) {
    return this.userService.getPatientHealthData(req.user.id, patientUserId, parseInt(days || '7'))
  }
}

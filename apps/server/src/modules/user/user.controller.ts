import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { UserService } from './user.service'
import { CreatePatientProfileDto, CreateDoctorProfileDto } from './user.dto'

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

  @Get('doctors')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取医生列表' })
  async getDoctors() {
    return this.userService.getDoctors()
  }

  @Post('bind-doctor/:doctorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '绑定医生' })
  async bindDoctor(@Request() req, @Param('doctorId') doctorId: string) {
    return this.userService.bindDoctor(req.user.id, doctorId)
  }
}

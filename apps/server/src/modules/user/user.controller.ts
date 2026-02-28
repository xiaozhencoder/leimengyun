import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { UserService } from './user.service'
import {
  CreatePatientProfileDto,
  UpdatePatientProfileDto,
  CreateDoctorProfileDto,
  UpdateDoctorProfileDto,
} from './dto'

@ApiTags('用户')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('patient-profile')
  @ApiOperation({ summary: '创建患者档案' })
  createPatientProfile(
    @CurrentUser() user: { userId: string; role: string },
    @Body() dto: CreatePatientProfileDto,
  ) {
    return this.userService.createPatientProfile(user.userId, dto)
  }

  @Get('patient-profile')
  @ApiOperation({ summary: '获取我的患者档案' })
  getPatientProfile(@CurrentUser() user: { userId: string; role: string }) {
    return this.userService.getPatientProfile(user.userId)
  }

  @Put('patient-profile')
  @ApiOperation({ summary: '更新患者档案' })
  updatePatientProfile(
    @CurrentUser() user: { userId: string; role: string },
    @Body() dto: UpdatePatientProfileDto,
  ) {
    return this.userService.updatePatientProfile(user.userId, dto)
  }

  @Post('doctor-profile')
  @ApiOperation({ summary: '创建医生档案' })
  createDoctorProfile(
    @CurrentUser() user: { userId: string; role: string },
    @Body() dto: CreateDoctorProfileDto,
  ) {
    return this.userService.createDoctorProfile(user.userId, dto)
  }

  @Get('doctor-profile')
  @ApiOperation({ summary: '获取我的医生档案' })
  getDoctorProfile(@CurrentUser() user: { userId: string; role: string }) {
    return this.userService.getDoctorProfile(user.userId)
  }

  @Put('doctor-profile')
  @ApiOperation({ summary: '更新医生档案' })
  updateDoctorProfile(
    @CurrentUser() user: { userId: string; role: string },
    @Body() dto: UpdateDoctorProfileDto,
  ) {
    return this.userService.updateDoctorProfile(user.userId, dto)
  }

  @Post('bind-doctor/:doctorId')
  @ApiOperation({ summary: '患者绑定医生' })
  bindDoctor(
    @CurrentUser() user: { userId: string; role: string },
    @Param('doctorId') doctorId: string,
  ) {
    return this.userService.bindDoctor(user.userId, doctorId)
  }

  @Post('accept-bind/:bindId')
  @ApiOperation({ summary: '医生接受绑定' })
  acceptBind(
    @CurrentUser() user: { userId: string; role: string },
    @Param('bindId') bindId: string,
  ) {
    return this.userService.acceptBind(bindId, user.userId)
  }

  @Get('my-doctors')
  @ApiOperation({ summary: '获取我的医生列表' })
  getMyDoctors(@CurrentUser() user: { userId: string; role: string }) {
    return this.userService.getMyDoctors(user.userId)
  }

  @Get('my-patients')
  @ApiOperation({ summary: '获取我的患者列表' })
  getMyPatients(@CurrentUser() user: { userId: string; role: string }) {
    return this.userService.getMyPatients(user.userId)
  }
}

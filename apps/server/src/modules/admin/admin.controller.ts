import { Controller, Get, Put, Param, Query, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from './admin.guard'
import { AdminService } from './admin.service'

@ApiTags('管理端')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('doctors/pending')
  @ApiOperation({ summary: '待审核医生列表' })
  async getPendingDoctors(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.getPendingDoctors(
      parseInt(page || '1', 10),
      parseInt(pageSize || '20', 10),
    )
  }

  @Put('doctors/:doctorUserId/approve')
  @ApiOperation({ summary: '审核通过医生' })
  async approveDoctor(@Param('doctorUserId') doctorUserId: string) {
    return this.adminService.approveDoctor(doctorUserId)
  }

  @Put('doctors/:doctorUserId/reject')
  @ApiOperation({ summary: '审核拒绝医生' })
  @ApiBody({ schema: { type: 'object', properties: { reason: { type: 'string' } } } })
  async rejectDoctor(
    @Param('doctorUserId') doctorUserId: string,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.rejectDoctor(doctorUserId, reason)
  }
}

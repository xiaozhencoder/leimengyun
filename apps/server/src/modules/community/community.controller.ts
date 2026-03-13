import { Controller, Get, Post, UseGuards, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CommunityService } from './community.service'

@ApiTags('社区')
@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('topics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取话题列表' })
  async getTopics() {
    return this.communityService.getTopics()
  }

  @Post('topics/seed')
  @ApiOperation({ summary: '初始化种子话题（仅开发环境）' })
  async seedTopics() {
    return this.communityService.seedTopics()
  }
}

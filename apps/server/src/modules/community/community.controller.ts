import { Controller, Get, Post, Param, Request, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CommunityService } from './community.service'
import { QueryPostDto } from './dto/query-post.dto'

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

  @Get('posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '帖子信息流' })
  async getPosts(@Request() req, @Query() query: QueryPostDto) {
    return this.communityService.getPosts(req.user.id, query)
  }

  @Get('posts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '帖子详情' })
  async getPostById(@Request() req, @Param('id') id: string) {
    return this.communityService.getPostById(req.user.id, id)
  }

  @Get('topics/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '话题详情（含帖子列表）' })
  async getTopicById(@Request() req, @Param('id') id: string, @Query() query: QueryPostDto) {
    return this.communityService.getTopicById(req.user.id, id, query)
  }
}

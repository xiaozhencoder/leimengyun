import { Controller, Get, Post, Put, Delete, Param, Request, Query, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CommunityService } from './community.service'
import { CreatePostDto } from './dto/create-post.dto'
import { CreateCommentDto } from './dto/create-comment.dto'
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

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '搜索帖子/话题/用户' })
  async search(
    @Request() req,
    @Query('keyword') keyword: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    if (!keyword?.trim()) return { type: type || 'post', list: [], total: 0 }
    return this.communityService.search(
      req.user.id, keyword.trim(), type || 'post',
      parseInt(page || '1'), parseInt(pageSize || '20'),
    )
  }

  @Get('posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '帖子信息流' })
  async getPosts(@Request() req, @Query() query: QueryPostDto) {
    return this.communityService.getPosts(req.user.id, query)
  }

  @Post('posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '发布帖子' })
  async createPost(@Request() req, @Body() dto: CreatePostDto) {
    return this.communityService.createPost(req.user.id, dto)
  }

  @Get('posts/my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '我的帖子' })
  async getMyPosts(@Request() req, @Query() query: QueryPostDto) {
    return this.communityService.getMyPosts(req.user.id, query)
  }

  @Get('posts/collected')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '我的收藏' })
  async getCollectedPosts(@Request() req, @Query() query: QueryPostDto) {
    return this.communityService.getCollectedPosts(req.user.id, query)
  }

  @Put('posts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '编辑帖子' })
  async updatePost(@Request() req, @Param('id') id: string, @Body() dto: CreatePostDto) {
    return this.communityService.updatePost(req.user.id, id, dto)
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除帖子' })
  async deletePost(@Request() req, @Param('id') id: string) {
    return this.communityService.deletePost(req.user.id, id)
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

  @Post('posts/:id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '点赞/取消点赞' })
  async togglePostLike(@Request() req, @Param('id') id: string) {
    return this.communityService.togglePostLike(req.user.id, id)
  }

  @Post('posts/:id/collect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '收藏/取消收藏' })
  async togglePostCollect(@Request() req, @Param('id') id: string) {
    return this.communityService.togglePostCollect(req.user.id, id)
  }

  @Get('posts/:postId/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '帖子评论列表' })
  async getComments(@Param('postId') postId: string, @Query() query: QueryPostDto) {
    return this.communityService.getComments(postId, query)
  }

  @Post('posts/:postId/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '发表评论' })
  async createComment(@Request() req, @Param('postId') postId: string, @Body() dto: CreateCommentDto) {
    return this.communityService.createComment(req.user.id, postId, dto)
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除评论' })
  async deleteComment(@Request() req, @Param('id') id: string) {
    return this.communityService.deleteComment(req.user.id, id)
  }

  @Post('comments/:id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '评论点赞/取消' })
  async toggleCommentLike(@Request() req, @Param('id') id: string) {
    return this.communityService.toggleCommentLike(req.user.id, id)
  }

  @Post('users/:id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '关注/取消关注' })
  async toggleFollow(@Request() req, @Param('id') id: string) {
    return this.communityService.toggleFollow(req.user.id, id)
  }

  @Get('users/:id/followers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '用户粉丝列表' })
  async getFollowers(@Param('id') id: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.communityService.getFollowers(id, parseInt(page || '1'), parseInt(pageSize || '20'))
  }

  @Get('users/:id/followings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '用户关注列表' })
  async getFollowings(@Param('id') id: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.communityService.getFollowings(id, parseInt(page || '1'), parseInt(pageSize || '20'))
  }

  @Get('users/:id/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '用户社区主页' })
  async getUserProfile(@Request() req, @Param('id') id: string) {
    return this.communityService.getUserCommunityProfile(req.user.id, id)
  }

  @Get('users/:id/posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '用户帖子列表' })
  async getUserPosts(@Request() req, @Param('id') id: string, @Query() query: QueryPostDto) {
    return this.communityService.getUserPosts(req.user.id, id, query)
  }

  @Post('check-in')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '每日打卡' })
  async checkIn(@Request() req) {
    return this.communityService.checkIn(req.user.id)
  }

  @Get('check-in/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '打卡状态' })
  async getCheckInStatus(@Request() req) {
    return this.communityService.getCheckInStatus(req.user.id)
  }

  @Get('check-in/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '打卡历史' })
  async getCheckInHistory(@Request() req, @Query('days') days?: string) {
    return this.communityService.getCheckInHistory(req.user.id, parseInt(days || '30'))
  }
}

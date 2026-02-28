import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ChatService } from './chat.service'
import { SendMessageDto } from './chat.dto'

@ApiTags('消息')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @ApiOperation({ summary: '获取会话列表' })
  async getConversations(@Request() req) {
    return this.chatService.getConversations(req.user.id)
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: '获取会话消息' })
  async getMessages(@Request() req, @Param('id') id: string) {
    return this.chatService.getMessages(req.user.id, id)
  }

  @Post('messages')
  @ApiOperation({ summary: '发送消息' })
  async sendMessage(@Request() req, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(req.user.id, dto)
  }

  @Put('conversations/:id/read')
  @ApiOperation({ summary: '标记会话消息已读' })
  async markRead(@Request() req, @Param('id') id: string) {
    return this.chatService.markRead(req.user.id, id)
  }
}

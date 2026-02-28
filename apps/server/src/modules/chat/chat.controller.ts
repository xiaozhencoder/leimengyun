import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { ChatService } from './chat.service'
import { IsString, IsNotEmpty, IsEnum } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class SendMessageDto {
  @ApiProperty({ description: '会话ID' })
  @IsString()
  @IsNotEmpty()
  conversationId: string

  @ApiProperty({
    description: '消息类型',
    enum: ['TEXT', 'IMAGE', 'BLOOD_SUGAR_CARD'],
  })
  @IsEnum(['TEXT', 'IMAGE', 'BLOOD_SUGAR_CARD'])
  contentType: string

  @ApiProperty({ description: '消息内容' })
  @IsString()
  @IsNotEmpty()
  content: string
}

@ApiTags('聊天')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @ApiOperation({ summary: '获取会话列表' })
  getConversations(@CurrentUser() user: { userId: string; role: string }) {
    return this.chatService.getConversations(user.userId)
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: '获取会话消息' })
  getMessages(
    @CurrentUser() user: { userId: string; role: string },
    @Param('id') id: string,
  ) {
    return this.chatService.getMessages(id, user.userId)
  }

  @Post('messages')
  @ApiOperation({ summary: '发送消息' })
  sendMessage(
    @CurrentUser() user: { userId: string; role: string },
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(user.userId, dto)
  }
}

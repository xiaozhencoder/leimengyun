import { IsString, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class SendMessageDto {
  @ApiProperty({ description: '会话ID' })
  @IsString()
  conversationId: string

  @ApiPropertyOptional({ example: 'TEXT', description: '消息类型' })
  @IsOptional()
  @IsString()
  contentType?: string

  @ApiProperty({ example: '您好医生', description: '消息内容' })
  @IsString()
  content: string
}

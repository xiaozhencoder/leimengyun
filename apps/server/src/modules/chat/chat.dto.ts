import { IsString, IsOptional, MaxLength } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class SendMessageDto {
  @ApiProperty({ description: '会话ID' })
  @IsString()
  conversationId: string

  @ApiPropertyOptional({ example: 'TEXT', description: '消息类型' })
  @IsOptional()
  @IsString()
  contentType?: string

  @ApiProperty({ example: '您好医生', description: '消息内容，文字消息限 500 字' })
  @IsString()
  @MaxLength(500, { message: '消息内容最多 500 字' })
  content: string
}

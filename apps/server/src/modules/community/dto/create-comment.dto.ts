import { IsString, IsOptional, IsUUID, MaxLength, MinLength } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateCommentDto {
  @ApiProperty({ example: '学到了！我也试试' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  content: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  replyToUserId?: string
}

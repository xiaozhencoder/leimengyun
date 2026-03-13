import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'

export class QueryPostDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number = 20

  @ApiPropertyOptional({ enum: ['recommend', 'following', 'doctor'] })
  @IsOptional()
  @IsString()
  tab?: string = 'recommend'

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topicId?: string
}

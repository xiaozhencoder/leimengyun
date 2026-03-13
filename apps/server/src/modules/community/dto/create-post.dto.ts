import { IsString, IsOptional, IsEnum, IsArray, IsBoolean, IsUUID, MaxLength, MinLength, ArrayMaxSize } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export enum PostTypeEnum {
  NORMAL = 'NORMAL',
  BLOOD_SUGAR_DIARY = 'BLOOD_SUGAR_DIARY',
  DOCTOR_ARTICLE = 'DOCTOR_ARTICLE',
}

export class CreatePostDto {
  @ApiProperty({ enum: PostTypeEnum, example: 'NORMAL' })
  @IsEnum(PostTypeEnum)
  contentType: PostTypeEnum

  @ApiPropertyOptional({ example: '空腹血糖偏高的5个原因' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string

  @ApiProperty({ example: '今天空腹血糖终于降到了5.8...' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(9)
  images?: string[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  topicId?: string

  @ApiPropertyOptional()
  @IsOptional()
  bloodSugarData?: any

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean
}

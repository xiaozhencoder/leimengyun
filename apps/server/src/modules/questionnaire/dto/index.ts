import { IsString, IsOptional, IsArray, IsNumber, IsDateString, IsInt, IsUUID, Min, Max, MaxLength, ArrayMinSize, ArrayMaxSize } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'

export class QueryTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string
}

export class CreateAssignmentDto {
  @ApiProperty({ description: '问卷模板ID' })
  @IsUUID()
  templateId: string

  @ApiProperty({ description: '患者 userId 数组', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  patientIds: string[]

  @ApiProperty({ description: '截止时间' })
  @IsDateString()
  deadline: string

  @ApiPropertyOptional({ description: '医生附言', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  message?: string
}

export class AnswerItemDto {
  @ApiProperty()
  @IsString()
  questionId: string

  @ApiProperty()
  value: any
}

export class SubmitResponseDto {
  @ApiProperty({ description: '答案数组', type: [AnswerItemDto] })
  @IsArray()
  answers: AnswerItemDto[]

  @ApiPropertyOptional({ description: '填写耗时(秒)' })
  @IsOptional()
  @IsNumber()
  duration?: number
}

export class AddNoteDto {
  @ApiProperty({ description: '医生批注' })
  @IsString()
  @MaxLength(1000)
  doctorNote: string
}

export class QueryAssignmentDto {
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

  @ApiPropertyOptional({ description: '状态筛选' })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({ description: '分类筛选' })
  @IsOptional()
  @IsString()
  category?: string
}

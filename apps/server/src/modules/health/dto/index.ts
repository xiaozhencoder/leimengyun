import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateBloodSugarDto {
  @ApiProperty({ description: '血糖值 (mmol/L)', minimum: 1.0, maximum: 33.3 })
  @IsNumber()
  @Min(1.0)
  @Max(33.3)
  value: number

  @ApiProperty({
    description: '测量时段',
    enum: [
      'FASTING',
      'BEFORE_BREAKFAST',
      'AFTER_BREAKFAST',
      'BEFORE_LUNCH',
      'AFTER_LUNCH',
      'BEFORE_DINNER',
      'AFTER_DINNER',
      'BEFORE_SLEEP',
      'MIDNIGHT',
      'RANDOM',
    ],
  })
  @IsEnum([
    'FASTING',
    'BEFORE_BREAKFAST',
    'AFTER_BREAKFAST',
    'BEFORE_LUNCH',
    'AFTER_LUNCH',
    'BEFORE_DINNER',
    'AFTER_DINNER',
    'BEFORE_SLEEP',
    'MIDNIGHT',
    'RANDOM',
  ])
  measureTime: string

  @ApiProperty({ description: '记录时间' })
  @IsDateString()
  recordedAt: string

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  note?: string
}

export class FoodItemDto {
  @ApiProperty({ description: '食物名称' })
  @IsString()
  name: string

  @ApiProperty({ description: '数量' })
  @IsString()
  quantity: string

  @ApiProperty({ description: '碳水化合物(g)' })
  @IsNumber()
  carbs: number
}

export class CreateDietDto {
  @ApiProperty({ description: '餐次', enum: ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] })
  @IsEnum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'])
  mealType: string

  @ApiProperty({ description: '食物条目', type: [FoodItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FoodItemDto)
  foodItems: FoodItemDto[]

  @ApiProperty({ description: '总碳水化合物(g)' })
  @IsNumber()
  totalCarbs: number

  @ApiPropertyOptional({ description: '照片URL' })
  @IsOptional()
  @IsString()
  photoUrl?: string

  @ApiProperty({ description: '记录时间' })
  @IsDateString()
  recordedAt: string

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  note?: string
}

export class CreateMedicationDto {
  @ApiProperty({ description: '药物类型', enum: ['INSULIN', 'ORAL'] })
  @IsEnum(['INSULIN', 'ORAL'])
  medType: string

  @ApiProperty({ description: '药物名称' })
  @IsString()
  medName: string

  @ApiProperty({ description: '剂量' })
  @IsNumber()
  dosage: number

  @ApiProperty({ description: '剂量单位' })
  @IsString()
  dosageUnit: string

  @ApiPropertyOptional({
    description: '注射部位',
    enum: ['ABDOMEN', 'THIGH', 'ARM', 'BUTTOCK'],
  })
  @IsOptional()
  @IsEnum(['ABDOMEN', 'THIGH', 'ARM', 'BUTTOCK'])
  injectionSite?: string

  @ApiProperty({ description: '记录时间' })
  @IsDateString()
  recordedAt: string

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  note?: string
}

export class DateRangeQueryDto {
  @ApiPropertyOptional({ description: '开始日期' })
  @IsOptional()
  @IsDateString()
  startDate?: string

  @ApiPropertyOptional({ description: '结束日期' })
  @IsOptional()
  @IsDateString()
  endDate?: string
}

export class TrendQueryDto {
  @ApiPropertyOptional({ description: '天数', default: 7 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  days?: number
}

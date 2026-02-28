import { IsString, IsNumber, IsOptional, IsArray, IsDateString, Min, Max } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateBloodSugarDto {
  @ApiProperty({ example: 6.5, description: '血糖值 mmol/L' })
  @IsNumber()
  @Min(1.0)
  @Max(33.3)
  value: number

  @ApiProperty({ example: 'BEFORE_LUNCH', description: '测量时段' })
  @IsString()
  measureTime: any

  @ApiProperty({ example: '2026-02-28T12:30:00Z' })
  @IsDateString()
  recordedAt: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string
}

export class CreateDietRecordDto {
  @ApiProperty({ example: 'LUNCH' })
  @IsString()
  mealType: any

  @ApiProperty({
    example: [{ name: '白米饭', quantity: '1碗', carbs: 45 }],
  })
  @IsArray()
  foodItems: { name: string; quantity: string; carbs: number }[]

  @ApiProperty({ example: 53 })
  @IsNumber()
  totalCarbs: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  photoUrl?: string

  @ApiProperty({ example: '2026-02-28T12:00:00Z' })
  @IsDateString()
  recordedAt: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string
}

export class CreateMedicationDto {
  @ApiProperty({ example: 'INSULIN' })
  @IsString()
  medType: any

  @ApiProperty({ example: '诺和锐' })
  @IsString()
  medName: string

  @ApiProperty({ example: 8 })
  @IsNumber()
  dosage: number

  @ApiProperty({ example: 'U' })
  @IsString()
  dosageUnit: string

  @ApiPropertyOptional({ example: 'ABDOMEN' })
  @IsOptional()
  @IsString()
  injectionSite?: string

  @ApiProperty({ example: '2026-02-28T11:55:00Z' })
  @IsDateString()
  recordedAt: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string
}

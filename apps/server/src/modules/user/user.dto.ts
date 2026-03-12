import { IsString, IsOptional, IsNumber, IsEnum, IsDateString, MinLength, MaxLength } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreatePatientProfileDto {
  @ApiProperty({ example: '糖友小明', description: '2-20 个字符' })
  @IsString()
  @MinLength(2, { message: '昵称至少 2 个字符' })
  @MaxLength(20, { message: '昵称最多 20 个字符' })
  nickname: string

  @ApiProperty({ example: 'MALE' })
  @IsString()
  gender: string

  @ApiProperty({ example: '1990-05-15' })
  @IsDateString()
  birthDate: string

  @ApiProperty({ example: 'TYPE_1' })
  @IsString()
  diabetesType: any

  @ApiProperty({ example: 'CSII' })
  @IsString()
  treatmentPlan: any

  @ApiPropertyOptional({ example: '2025-04-10' })
  @IsOptional()
  @IsDateString()
  diagnosisDate?: string

  @ApiPropertyOptional({ example: 175 })
  @IsOptional()
  @IsNumber()
  height?: number

  @ApiPropertyOptional({ example: 68 })
  @IsOptional()
  @IsNumber()
  weight?: number
}

export class CreateDoctorProfileDto {
  @ApiProperty({ example: '李明华' })
  @IsString()
  realName: string

  @ApiProperty({ example: '北京协和医院' })
  @IsString()
  hospital: string

  @ApiProperty({ example: '内分泌科' })
  @IsString()
  department: string

  @ApiProperty({ example: 'CHIEF' })
  @IsString()
  title: any

  @ApiProperty({ example: '110108199001011234' })
  @IsString()
  licenseNo: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialties?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string
}

export class UpdatePatientProfileDto {
  @ApiPropertyOptional({ example: '糖友小明', description: '2-20 个字符' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: '昵称至少 2 个字符' })
  @MaxLength(20, { message: '昵称最多 20 个字符' })
  nickname?: string

  @ApiPropertyOptional({ example: 'MALE' })
  @IsOptional()
  @IsString()
  gender?: string

  @ApiPropertyOptional({ example: '1990-05-15' })
  @IsOptional()
  @IsDateString()
  birthDate?: string

  @ApiPropertyOptional({ example: 'TYPE_1' })
  @IsOptional()
  @IsString()
  diabetesType?: string

  @ApiPropertyOptional({ example: 'CSII' })
  @IsOptional()
  @IsString()
  treatmentPlan?: string

  @ApiPropertyOptional({ example: '2025-04-10' })
  @IsOptional()
  @IsDateString()
  diagnosisDate?: string

  @ApiPropertyOptional({ example: 175 })
  @IsOptional()
  @IsNumber()
  height?: number

  @ApiPropertyOptional({ example: 68 })
  @IsOptional()
  @IsNumber()
  weight?: number
}

export class UpdateDoctorProfileDto {
  @ApiPropertyOptional({ example: '北京协和医院' })
  @IsOptional()
  @IsString()
  hospital?: string

  @ApiPropertyOptional({ example: '内分泌科' })
  @IsOptional()
  @IsString()
  department?: string

  @ApiPropertyOptional({ example: 'CHIEF' })
  @IsOptional()
  @IsString()
  title?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialties?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string
}

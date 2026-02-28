import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreatePatientProfileDto {
  @ApiProperty({ description: '昵称' })
  @IsString()
  @IsNotEmpty()
  nickname: string

  @ApiProperty({ description: '性别', enum: ['MALE', 'FEMALE'] })
  @IsString()
  @IsNotEmpty()
  gender: string

  @ApiProperty({ description: '出生日期' })
  @IsDateString()
  birthDate: string

  @ApiProperty({ description: '糖尿病类型', enum: ['TYPE_1', 'TYPE_2', 'GESTATIONAL', 'OTHER'] })
  @IsEnum(['TYPE_1', 'TYPE_2', 'GESTATIONAL', 'OTHER'])
  diabetesType: string

  @ApiProperty({
    description: '治疗方案',
    enum: ['CSII', 'MDI', 'ORAL', 'LIFESTYLE'],
  })
  @IsEnum(['CSII', 'MDI', 'ORAL', 'LIFESTYLE'])
  treatmentPlan: string

  @ApiPropertyOptional({ description: '确诊日期' })
  @IsOptional()
  @IsDateString()
  diagnosisDate?: string

  @ApiPropertyOptional({ description: '身高(cm)' })
  @IsOptional()
  @IsNumber()
  height?: number

  @ApiPropertyOptional({ description: '体重(kg)' })
  @IsOptional()
  @IsNumber()
  weight?: number
}

export class UpdatePatientProfileDto {
  @ApiPropertyOptional({ description: '昵称' })
  @IsOptional()
  @IsString()
  nickname?: string

  @ApiPropertyOptional({ description: '性别' })
  @IsOptional()
  @IsString()
  gender?: string

  @ApiPropertyOptional({ description: '糖尿病类型' })
  @IsOptional()
  @IsString()
  diabetesType?: string

  @ApiPropertyOptional({ description: '治疗方案' })
  @IsOptional()
  @IsString()
  treatmentPlan?: string

  @ApiPropertyOptional({ description: '确诊日期' })
  @IsOptional()
  @IsDateString()
  diagnosisDate?: string

  @ApiPropertyOptional({ description: '身高(cm)' })
  @IsOptional()
  @IsNumber()
  height?: number

  @ApiPropertyOptional({ description: '体重(kg)' })
  @IsOptional()
  @IsNumber()
  weight?: number
}

export class CreateDoctorProfileDto {
  @ApiProperty({ description: '真实姓名' })
  @IsString()
  @IsNotEmpty()
  realName: string

  @ApiProperty({ description: '所在医院' })
  @IsString()
  @IsNotEmpty()
  hospital: string

  @ApiProperty({ description: '科室' })
  @IsString()
  @IsNotEmpty()
  department: string

  @ApiProperty({
    description: '职称',
    enum: ['CHIEF', 'ASSOCIATE_CHIEF', 'ATTENDING', 'RESIDENT'],
  })
  @IsEnum(['CHIEF', 'ASSOCIATE_CHIEF', 'ATTENDING', 'RESIDENT'])
  title: string

  @ApiProperty({ description: '执业编号' })
  @IsString()
  @IsNotEmpty()
  licenseNo: string

  @ApiPropertyOptional({ description: '擅长领域' })
  @IsOptional()
  @IsString()
  specialties?: string

  @ApiPropertyOptional({ description: '个人简介' })
  @IsOptional()
  @IsString()
  bio?: string
}

export class UpdateDoctorProfileDto {
  @ApiPropertyOptional({ description: '所在医院' })
  @IsOptional()
  @IsString()
  hospital?: string

  @ApiPropertyOptional({ description: '科室' })
  @IsOptional()
  @IsString()
  department?: string

  @ApiPropertyOptional({ description: '职称' })
  @IsOptional()
  @IsString()
  title?: string

  @ApiPropertyOptional({ description: '擅长领域' })
  @IsOptional()
  @IsString()
  specialties?: string

  @ApiPropertyOptional({ description: '个人简介' })
  @IsOptional()
  @IsString()
  bio?: string
}

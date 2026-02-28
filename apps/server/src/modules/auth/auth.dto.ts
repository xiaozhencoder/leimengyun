import { IsString, Length, IsPhoneNumber } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class SendCodeDto {
  @ApiProperty({ description: '手机号', example: '13812345678' })
  @IsString()
  @Length(11, 11)
  phone: string
}

export class LoginDto {
  @ApiProperty({ description: '手机号', example: '13812345678' })
  @IsString()
  @Length(11, 11)
  phone: string

  @ApiProperty({ description: '验证码', example: '123456' })
  @IsString()
  @Length(6, 6)
  code: string
}

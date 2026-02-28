import { Controller, Post, Body } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { SendCodeDto, LoginDto } from './dto'

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-code')
  @ApiOperation({ summary: '发送短信验证码' })
  @ApiResponse({ status: 200, description: '验证码已发送' })
  async sendCode(@Body() dto: SendCodeDto) {
    return this.authService.sendSmsCode(dto.phone)
  }

  @Post('login')
  @ApiOperation({ summary: '登录/注册' })
  @ApiResponse({ status: 200, description: '登录成功，返回token和用户信息' })
  @ApiResponse({ status: 401, description: '验证码无效' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.phone, dto.code)
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../common/prisma.service'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async sendCode(phone: string) {
    // P0: store code in Redis with TTL; for now, accept any 6-digit code
    return { message: '验证码已发送' }
  }

  async login(phone: string, code: string) {
    // P0: validate code from Redis; for now accept "123456" or any code
    if (code.length !== 6) {
      throw new UnauthorizedException('验证码无效')
    }

    let user = await this.prisma.user.findUnique({ where: { phone } })
    const isNewUser = !user

    if (!user) {
      user = await this.prisma.user.create({
        data: { phone, role: 'PATIENT' },
      })
    }

    const payload = { sub: user.id, phone: user.phone, role: user.role }
    const token = this.jwtService.sign(payload)

    return {
      token,
      isNewUser,
      user: { id: user.id, phone: user.phone, role: user.role },
    }
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } })
  }
}

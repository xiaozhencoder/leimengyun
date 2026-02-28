import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../common/prisma.service'

@Injectable()
export class AuthService {
  private smsCodes = new Map<string, { code: string; expiresAt: number }>()

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async sendSmsCode(phone: string) {
    const code = Math.random().toString().slice(2, 8)
    this.smsCodes.set(phone, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
    })
    console.log(`[SMS] 验证码已发送至 ${phone}: ${code}`)
    return { message: '验证码已发送' }
  }

  validateCode(phone: string, code: string): boolean {
    const stored = this.smsCodes.get(phone)
    if (!stored) return false
    if (Date.now() > stored.expiresAt) {
      this.smsCodes.delete(phone)
      return false
    }
    return stored.code === code
  }

  async login(phone: string, code: string) {
    if (!this.validateCode(phone, code)) {
      throw new UnauthorizedException('验证码无效或已过期')
    }
    this.smsCodes.delete(phone)

    let isNewUser = false
    let user = await this.prisma.user.findUnique({ where: { phone } })

    if (!user) {
      isNewUser = true
      user = await this.prisma.user.create({
        data: {
          phone,
          role: 'PATIENT',
        },
      })
    }

    const payload = { sub: user.id, role: user.role }
    const token = this.jwtService.sign(payload)

    return {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatarUrl,
        status: user.status,
      },
      isNewUser,
    }
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.status !== 'ACTIVE') {
      throw new BadRequestException('用户不存在或已被禁用')
    }
    return user
  }
}

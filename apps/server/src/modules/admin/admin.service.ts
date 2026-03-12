import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../common/prisma.service'

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getPendingDoctors(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize
    const [list, total] = await Promise.all([
      this.prisma.doctorProfile.findMany({
        where: { verifyStatus: 'PENDING' },
        include: {
          user: { select: { id: true, phone: true, createdAt: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.doctorProfile.count({ where: { verifyStatus: 'PENDING' } }),
    ])
    return { list, total, hasMore: skip + list.length < total }
  }

  async approveDoctor(doctorUserId: string) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    })
    if (!profile) throw new NotFoundException('医生档案不存在')
    if (profile.verifyStatus !== 'PENDING') {
      return profile
    }
    return this.prisma.doctorProfile.update({
      where: { userId: doctorUserId },
      data: { verifyStatus: 'APPROVED' },
      include: { user: { select: { id: true, phone: true } } },
    })
  }

  async rejectDoctor(doctorUserId: string, reason?: string) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    })
    if (!profile) throw new NotFoundException('医生档案不存在')
    return this.prisma.doctorProfile.update({
      where: { userId: doctorUserId },
      data: { verifyStatus: 'REJECTED', rejectReason: reason ?? null },
      include: { user: { select: { id: true, phone: true } } },
    })
  }
}

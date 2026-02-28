import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../common/prisma.service'
import { CreatePatientProfileDto, CreateDoctorProfileDto } from './user.dto'

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getUserWithProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { patientProfile: true, doctorProfile: true },
    })
    if (!user) throw new NotFoundException('用户不存在')
    return user
  }

  async createPatientProfile(userId: string, dto: CreatePatientProfileDto) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { role: 'PATIENT' },
    })
    return this.prisma.patientProfile.create({
      data: {
        userId,
        nickname: dto.nickname,
        gender: dto.gender,
        birthDate: new Date(dto.birthDate),
        diabetesType: dto.diabetesType,
        treatmentPlan: dto.treatmentPlan,
        diagnosisDate: dto.diagnosisDate ? new Date(dto.diagnosisDate) : null,
        height: dto.height,
        weight: dto.weight,
      },
    })
  }

  async createDoctorProfile(userId: string, dto: CreateDoctorProfileDto) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { role: 'DOCTOR' },
    })
    return this.prisma.doctorProfile.create({
      data: {
        userId,
        realName: dto.realName,
        hospital: dto.hospital,
        department: dto.department,
        title: dto.title,
        licenseNo: dto.licenseNo,
        specialties: dto.specialties,
        bio: dto.bio,
        verifyStatus: 'APPROVED',
      },
    })
  }

  async getDoctors(keyword?: string) {
    const where: any = { verifyStatus: 'APPROVED' }
    if (keyword) {
      where.OR = [
        { realName: { contains: keyword, mode: 'insensitive' } },
        { hospital: { contains: keyword, mode: 'insensitive' } },
        { department: { contains: keyword, mode: 'insensitive' } },
      ]
    }
    return this.prisma.doctorProfile.findMany({
      where,
      include: { user: { select: { id: true, avatarUrl: true } } },
    })
  }

  async bindDoctor(patientUserId: string, doctorUserId: string) {
    const doctor = await this.prisma.user.findUnique({ where: { id: doctorUserId } })
    if (!doctor || doctor.role !== 'DOCTOR') throw new NotFoundException('医生不存在')

    const existing = await this.prisma.doctorPatientBind.findUnique({
      where: { doctorId_patientId: { doctorId: doctorUserId, patientId: patientUserId } },
    })
    if (existing && existing.status !== 'REMOVED' && existing.status !== 'REJECTED') {
      throw new BadRequestException('已存在绑定关系或待审核申请')
    }

    if (existing) {
      return this.prisma.doctorPatientBind.update({
        where: { id: existing.id },
        data: { status: 'PENDING' },
      })
    }

    return this.prisma.doctorPatientBind.create({
      data: { doctorId: doctorUserId, patientId: patientUserId, status: 'PENDING' },
    })
  }

  async getMyDoctors(patientUserId: string) {
    const binds = await this.prisma.doctorPatientBind.findMany({
      where: { patientId: patientUserId, status: 'ACCEPTED' },
      include: {
        doctor: {
          select: {
            id: true,
            avatarUrl: true,
            doctorProfile: { select: { realName: true, hospital: true, department: true, title: true } },
          },
        },
      },
    })
    return binds.map((b) => ({
      bindId: b.id,
      doctorUserId: b.doctorId,
      ...b.doctor.doctorProfile,
      avatarUrl: b.doctor.avatarUrl,
      boundAt: b.createdAt,
    }))
  }

  async getMyPatients(doctorUserId: string) {
    const binds = await this.prisma.doctorPatientBind.findMany({
      where: { doctorId: doctorUserId, status: 'ACCEPTED' },
      include: {
        patient: {
          select: {
            id: true,
            avatarUrl: true,
            patientProfile: true,
          },
        },
      },
    })

    const result = []
    for (const b of binds) {
      const profile = b.patient.patientProfile
      if (!profile) continue

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const bsRecords = await this.prisma.bloodSugarRecord.findMany({
        where: { patientId: profile.id, recordedAt: { gte: today } },
      })
      const avg = bsRecords.length > 0
        ? Math.round((bsRecords.reduce((s, r) => s + r.value, 0) / bsRecords.length) * 10) / 10
        : 0

      const latest = await this.prisma.bloodSugarRecord.findFirst({
        where: { patientId: profile.id },
        orderBy: { recordedAt: 'desc' },
      })

      result.push({
        bindId: b.id,
        patientUserId: b.patientId,
        nickname: profile.nickname,
        gender: profile.gender,
        diabetesType: profile.diabetesType,
        treatmentPlan: profile.treatmentPlan,
        avatarUrl: b.patient.avatarUrl,
        todayCount: bsRecords.length,
        todayAvg: avg,
        latestBs: latest?.value || null,
        latestBsTime: latest?.recordedAt || null,
        boundAt: b.createdAt,
      })
    }
    return result
  }

  async getPendingBinds(doctorUserId: string) {
    const binds = await this.prisma.doctorPatientBind.findMany({
      where: { doctorId: doctorUserId, status: 'PENDING' },
      include: {
        patient: {
          select: {
            id: true,
            patientProfile: { select: { nickname: true, diabetesType: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return binds.map((b) => ({
      bindId: b.id,
      patientUserId: b.patientId,
      nickname: b.patient.patientProfile?.nickname || '未知',
      diabetesType: b.patient.patientProfile?.diabetesType || '',
      createdAt: b.createdAt,
    }))
  }

  async approveBind(doctorUserId: string, bindId: string) {
    const bind = await this.prisma.doctorPatientBind.findUnique({ where: { id: bindId } })
    if (!bind || bind.doctorId !== doctorUserId) throw new ForbiddenException()
    if (bind.status !== 'PENDING') throw new BadRequestException('该申请已处理')

    await this.prisma.doctorPatientBind.update({
      where: { id: bindId },
      data: { status: 'ACCEPTED' },
    })

    const existing = await this.prisma.conversation.findUnique({
      where: { patientId_doctorId: { patientId: bind.patientId, doctorId: bind.doctorId } },
    })
    if (!existing) {
      await this.prisma.conversation.create({
        data: { patientId: bind.patientId, doctorId: bind.doctorId },
      })
    }

    return { message: '已通过绑定申请' }
  }

  async rejectBind(bindId: string) {
    await this.prisma.doctorPatientBind.update({
      where: { id: bindId },
      data: { status: 'REJECTED' },
    })
    return { message: '已拒绝绑定申请' }
  }

  async getPatientHealthData(doctorUserId: string, patientUserId: string, days: number) {
    const bind = await this.prisma.doctorPatientBind.findUnique({
      where: { doctorId_patientId: { doctorId: doctorUserId, patientId: patientUserId } },
    })
    if (!bind || bind.status !== 'ACCEPTED') throw new ForbiddenException('无权查看该患者数据')

    const profile = await this.prisma.patientProfile.findUnique({ where: { userId: patientUserId } })
    if (!profile) throw new NotFoundException('患者档案不存在')

    const since = new Date()
    since.setDate(since.getDate() - days)

    const [bloodSugars, diets, medications] = await Promise.all([
      this.prisma.bloodSugarRecord.findMany({
        where: { patientId: profile.id, recordedAt: { gte: since } },
        orderBy: { recordedAt: 'desc' },
      }),
      this.prisma.dietRecord.findMany({
        where: { patientId: profile.id, recordedAt: { gte: since } },
        orderBy: { recordedAt: 'desc' },
      }),
      this.prisma.medicationRecord.findMany({
        where: { patientId: profile.id, recordedAt: { gte: since } },
        orderBy: { recordedAt: 'desc' },
      }),
    ])

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayBs = bloodSugars.filter((r) => new Date(r.recordedAt) >= today)
    const avg = todayBs.length > 0
      ? Math.round((todayBs.reduce((s, r) => s + r.value, 0) / todayBs.length) * 10) / 10
      : 0
    const inRange = todayBs.filter((r) => r.value >= 3.9 && r.value <= 10).length
    const rate = todayBs.length > 0 ? Math.round((inRange / todayBs.length) * 100) : 0

    return {
      profile,
      summary: { count: todayBs.length, average: avg, inRangeRate: rate },
      bloodSugars,
      diets,
      medications,
    }
  }
}

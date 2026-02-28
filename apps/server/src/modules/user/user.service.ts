import { Injectable, NotFoundException } from '@nestjs/common'
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
      },
    })
  }

  async getDoctors() {
    return this.prisma.doctorProfile.findMany({
      where: { verifyStatus: 'APPROVED' },
      include: { user: { select: { id: true, phone: true, avatarUrl: true } } },
    })
  }

  async bindDoctor(patientId: string, doctorId: string) {
    return this.prisma.doctorPatientBind.create({
      data: { patientId, doctorId, status: 'PENDING' },
    })
  }
}

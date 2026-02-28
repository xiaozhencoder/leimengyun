import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common'
import { PrismaService } from '../common/prisma.service'
import {
  CreatePatientProfileDto,
  UpdatePatientProfileDto,
  CreateDoctorProfileDto,
  UpdateDoctorProfileDto,
} from './dto'
import { DiabetesType, TreatmentPlan, DoctorTitle } from '@prisma/client'

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createPatientProfile(userId: string, dto: CreatePatientProfileDto) {
    const existing = await this.prisma.patientProfile.findUnique({
      where: { userId },
    })
    if (existing) {
      throw new ConflictException('患者档案已存在')
    }

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
        diabetesType: dto.diabetesType as DiabetesType,
        treatmentPlan: dto.treatmentPlan as TreatmentPlan,
        diagnosisDate: dto.diagnosisDate ? new Date(dto.diagnosisDate) : null,
        height: dto.height,
        weight: dto.weight,
      },
    })
  }

  async createDoctorProfile(userId: string, dto: CreateDoctorProfileDto) {
    const existing = await this.prisma.doctorProfile.findUnique({
      where: { userId },
    })
    if (existing) {
      throw new ConflictException('医生档案已存在')
    }

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
        title: dto.title as DoctorTitle,
        licenseNo: dto.licenseNo,
        specialties: dto.specialties,
        bio: dto.bio,
      },
    })
  }

  async getPatientProfile(userId: string) {
    const profile = await this.prisma.patientProfile.findUnique({
      where: { userId },
      include: { user: { select: { phone: true, avatarUrl: true } } },
    })
    if (!profile) {
      throw new NotFoundException('患者档案不存在')
    }
    return profile
  }

  async getDoctorProfile(userId: string) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId },
      include: { user: { select: { phone: true, avatarUrl: true } } },
    })
    if (!profile) {
      throw new NotFoundException('医生档案不存在')
    }
    return profile
  }

  async updatePatientProfile(userId: string, dto: UpdatePatientProfileDto) {
    const profile = await this.prisma.patientProfile.findUnique({
      where: { userId },
    })
    if (!profile) {
      throw new NotFoundException('患者档案不存在')
    }

    const data: Record<string, unknown> = {}
    if (dto.nickname !== undefined) data.nickname = dto.nickname
    if (dto.gender !== undefined) data.gender = dto.gender
    if (dto.diabetesType !== undefined) data.diabetesType = dto.diabetesType as DiabetesType
    if (dto.treatmentPlan !== undefined) data.treatmentPlan = dto.treatmentPlan as TreatmentPlan
    if (dto.diagnosisDate !== undefined) data.diagnosisDate = new Date(dto.diagnosisDate)
    if (dto.height !== undefined) data.height = dto.height
    if (dto.weight !== undefined) data.weight = dto.weight

    return this.prisma.patientProfile.update({
      where: { userId },
      data,
    })
  }

  async updateDoctorProfile(userId: string, dto: UpdateDoctorProfileDto) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId },
    })
    if (!profile) {
      throw new NotFoundException('医生档案不存在')
    }

    const data: Record<string, unknown> = {}
    if (dto.hospital !== undefined) data.hospital = dto.hospital
    if (dto.department !== undefined) data.department = dto.department
    if (dto.title !== undefined) data.title = dto.title as DoctorTitle
    if (dto.specialties !== undefined) data.specialties = dto.specialties
    if (dto.bio !== undefined) data.bio = dto.bio

    return this.prisma.doctorProfile.update({
      where: { userId },
      data,
    })
  }

  async bindDoctor(patientId: string, doctorId: string) {
    const doctor = await this.prisma.user.findUnique({
      where: { id: doctorId },
      include: { doctorProfile: true },
    })
    if (!doctor || doctor.role !== 'DOCTOR') {
      throw new NotFoundException('医生不存在')
    }

    const existing = await this.prisma.doctorPatientBind.findUnique({
      where: { doctorId_patientId: { doctorId, patientId } },
    })
    if (existing) {
      throw new ConflictException('已存在绑定关系')
    }

    return this.prisma.doctorPatientBind.create({
      data: { doctorId, patientId },
    })
  }

  async acceptBind(bindId: string, doctorId: string) {
    const bind = await this.prisma.doctorPatientBind.findUnique({
      where: { id: bindId },
    })
    if (!bind) {
      throw new NotFoundException('绑定请求不存在')
    }
    if (bind.doctorId !== doctorId) {
      throw new ForbiddenException('无权操作此绑定请求')
    }

    return this.prisma.doctorPatientBind.update({
      where: { id: bindId },
      data: { status: 'ACCEPTED' },
    })
  }

  async getMyDoctors(patientId: string) {
    return this.prisma.doctorPatientBind.findMany({
      where: { patientId, status: 'ACCEPTED' },
      include: {
        doctor: {
          select: {
            id: true,
            avatarUrl: true,
            doctorProfile: {
              select: {
                realName: true,
                hospital: true,
                department: true,
                title: true,
              },
            },
          },
        },
      },
    })
  }

  async getMyPatients(doctorId: string) {
    return this.prisma.doctorPatientBind.findMany({
      where: { doctorId, status: 'ACCEPTED' },
      include: {
        patient: {
          select: {
            id: true,
            avatarUrl: true,
            patientProfile: {
              select: {
                nickname: true,
                gender: true,
                diabetesType: true,
              },
            },
          },
        },
      },
    })
  }
}

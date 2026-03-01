import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../common/prisma.service'
import { CreateBloodSugarDto, CreateDietRecordDto, CreateMedicationDto } from './health.dto'

@Injectable()
export class HealthService {
  constructor(private prisma: PrismaService) {}

  private async getPatientProfileId(userId: string) {
    const profile = await this.prisma.patientProfile.findUnique({ where: { userId } })
    if (!profile) throw new NotFoundException('请先完善患者档案')
    return profile.id
  }

  async createBloodSugar(userId: string, dto: CreateBloodSugarDto) {
    const patientId = await this.getPatientProfileId(userId)
    return this.prisma.bloodSugarRecord.create({
      data: {
        patientId,
        value: dto.value,
        measureTime: dto.measureTime,
        recordedAt: new Date(dto.recordedAt),
        note: dto.note,
      },
    })
  }

  async getBloodSugars(userId: string, days: number, start?: string, end?: string) {
    const patientId = await this.getPatientProfileId(userId)
    let where: { patientId: string; recordedAt: { gte?: Date; lte?: Date } } = { patientId, recordedAt: {} }
    if (start && end) {
      where.recordedAt = { gte: new Date(start), lte: new Date(end) }
    } else {
      const since = new Date()
      since.setDate(since.getDate() - days)
      where.recordedAt = { gte: since }
    }
    return this.prisma.bloodSugarRecord.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
    })
  }

  async createDiet(userId: string, dto: CreateDietRecordDto) {
    const patientId = await this.getPatientProfileId(userId)
    return this.prisma.dietRecord.create({
      data: {
        patientId,
        mealType: dto.mealType,
        foodItems: dto.foodItems as any,
        totalCarbs: dto.totalCarbs,
        photoUrl: dto.photoUrl,
        recordedAt: new Date(dto.recordedAt),
        note: dto.note,
      },
    })
  }

  async getDiets(userId: string, days: number) {
    const patientId = await this.getPatientProfileId(userId)
    const since = new Date()
    since.setDate(since.getDate() - days)
    return this.prisma.dietRecord.findMany({
      where: { patientId, recordedAt: { gte: since } },
      orderBy: { recordedAt: 'desc' },
    })
  }

  async createMedication(userId: string, dto: CreateMedicationDto) {
    const patientId = await this.getPatientProfileId(userId)
    return this.prisma.medicationRecord.create({
      data: {
        patientId,
        medType: dto.medType,
        medName: dto.medName,
        dosage: dto.dosage,
        dosageUnit: dto.dosageUnit,
        injectionSite: dto.injectionSite,
        recordedAt: new Date(dto.recordedAt),
        note: dto.note,
      },
    })
  }

  async getMedications(userId: string, days: number) {
    const patientId = await this.getPatientProfileId(userId)
    const since = new Date()
    since.setDate(since.getDate() - days)
    return this.prisma.medicationRecord.findMany({
      where: { patientId, recordedAt: { gte: since } },
      orderBy: { recordedAt: 'desc' },
    })
  }

  async getTodaySummary(userId: string, start?: string, end?: string) {
    const patientId = await this.getPatientProfileId(userId)
    let where: { patientId: string; recordedAt: { gte?: Date; lte?: Date } } = { patientId, recordedAt: {} }
    if (start && end) {
      where.recordedAt = { gte: new Date(start), lte: new Date(end) }
    } else {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      where.recordedAt = { gte: today }
    }

    const records = await this.prisma.bloodSugarRecord.findMany({
      where,
    })

    const count = records.length
    const avg = count > 0 ? records.reduce((s, r) => s + r.value, 0) / count : 0
    const inRange = records.filter((r) => r.value >= 3.9 && r.value <= 10).length
    const rate = count > 0 ? Math.round((inRange / count) * 100) : 0

    return {
      count,
      average: Math.round(avg * 10) / 10,
      inRangeRate: rate,
      max: count > 0 ? Math.max(...records.map((r) => r.value)) : 0,
      min: count > 0 ? Math.min(...records.map((r) => r.value)) : 0,
    }
  }
}

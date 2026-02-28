import { Injectable } from '@nestjs/common'
import { PrismaService } from '../common/prisma.service'
import { MeasureTime, MealType, MedType } from '@prisma/client'
import { CreateBloodSugarDto, CreateDietDto, CreateMedicationDto } from './dto'

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async createBloodSugar(patientProfileId: string, dto: CreateBloodSugarDto) {
    return this.prisma.bloodSugarRecord.create({
      data: {
        patientId: patientProfileId,
        value: dto.value,
        measureTime: dto.measureTime as MeasureTime,
        recordedAt: new Date(dto.recordedAt),
        note: dto.note,
      },
    })
  }

  async getBloodSugars(
    patientProfileId: string,
    query: { startDate?: string; endDate?: string },
  ) {
    const where: Record<string, unknown> = { patientId: patientProfileId }

    if (query.startDate || query.endDate) {
      const recordedAt: Record<string, Date> = {}
      if (query.startDate) recordedAt.gte = new Date(query.startDate)
      if (query.endDate) recordedAt.lte = new Date(query.endDate)
      where.recordedAt = recordedAt
    }

    return this.prisma.bloodSugarRecord.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
    })
  }

  async createDiet(patientProfileId: string, dto: CreateDietDto) {
    return this.prisma.dietRecord.create({
      data: {
        patientId: patientProfileId,
        mealType: dto.mealType as MealType,
        foodItems: JSON.parse(JSON.stringify(dto.foodItems)),
        totalCarbs: dto.totalCarbs,
        photoUrl: dto.photoUrl,
        recordedAt: new Date(dto.recordedAt),
        note: dto.note,
      },
    })
  }

  async getDiets(patientProfileId: string, query: { startDate?: string; endDate?: string }) {
    const where: Record<string, unknown> = { patientId: patientProfileId }

    if (query.startDate || query.endDate) {
      const recordedAt: Record<string, Date> = {}
      if (query.startDate) recordedAt.gte = new Date(query.startDate)
      if (query.endDate) recordedAt.lte = new Date(query.endDate)
      where.recordedAt = recordedAt
    }

    return this.prisma.dietRecord.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
    })
  }

  async createMedication(patientProfileId: string, dto: CreateMedicationDto) {
    return this.prisma.medicationRecord.create({
      data: {
        patientId: patientProfileId,
        medType: dto.medType as MedType,
        medName: dto.medName,
        dosage: dto.dosage,
        dosageUnit: dto.dosageUnit,
        injectionSite: dto.injectionSite,
        recordedAt: new Date(dto.recordedAt),
        note: dto.note,
      },
    })
  }

  async getMedications(patientProfileId: string, query: { startDate?: string; endDate?: string }) {
    const where: Record<string, unknown> = { patientId: patientProfileId }

    if (query.startDate || query.endDate) {
      const recordedAt: Record<string, Date> = {}
      if (query.startDate) recordedAt.gte = new Date(query.startDate)
      if (query.endDate) recordedAt.lte = new Date(query.endDate)
      where.recordedAt = recordedAt
    }

    return this.prisma.medicationRecord.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
    })
  }

  async getDashboard(patientProfileId: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const records = await this.prisma.bloodSugarRecord.findMany({
      where: {
        patientId: patientProfileId,
        recordedAt: { gte: today, lt: tomorrow },
      },
      orderBy: { recordedAt: 'asc' },
    })

    if (records.length === 0) {
      return {
        count: 0,
        avg: 0,
        min: 0,
        max: 0,
        records: [],
      }
    }

    const values = records.map((r) => r.value)
    const sum = values.reduce((a, b) => a + b, 0)

    return {
      count: records.length,
      avg: Math.round((sum / records.length) * 10) / 10,
      min: Math.min(...values),
      max: Math.max(...values),
      records,
    }
  }

  async getTrend(patientProfileId: string, days: number) {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    const records = await this.prisma.bloodSugarRecord.findMany({
      where: {
        patientId: patientProfileId,
        recordedAt: { gte: startDate, lte: endDate },
      },
      orderBy: { recordedAt: 'asc' },
    })

    const dailyMap = new Map<string, number[]>()
    for (const record of records) {
      const dateKey = record.recordedAt.toISOString().split('T')[0]
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, [])
      }
      dailyMap.get(dateKey)!.push(record.value)
    }

    const trend = Array.from(dailyMap.entries()).map(([date, values]) => ({
      date,
      avg: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    }))

    return trend
  }
}

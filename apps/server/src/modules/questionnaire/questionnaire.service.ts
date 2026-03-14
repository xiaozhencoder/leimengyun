import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../common/prisma.service'
import { CreateAssignmentDto, SubmitResponseDto, AddNoteDto, QueryAssignmentDto, QueryTemplateDto } from './dto'

@Injectable()
export class QuestionnaireService {
  constructor(private prisma: PrismaService) {}

  async getTemplates(query: QueryTemplateDto) {
    const where: any = { status: 'ACTIVE' }
    if (query.category) where.category = query.category

    const templates = await this.prisma.questionnaireTemplate.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    })

    return templates.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      category: t.category,
      questionCount: Array.isArray(t.questions) ? (t.questions as any[]).length : 0,
      totalScore: t.totalScore,
      estimatedTime: t.estimatedTime,
      isSystem: t.isSystem,
      sortOrder: t.sortOrder,
    }))
  }

  async getTemplateById(id: string) {
    const template = await this.prisma.questionnaireTemplate.findUnique({ where: { id } })
    if (!template || template.status !== 'ACTIVE') {
      throw new NotFoundException('问卷模板不存在')
    }
    return template
  }

  async createAssignments(doctorUserId: string, dto: CreateAssignmentDto) {
    const doctor = await this.prisma.user.findUnique({ where: { id: doctorUserId } })
    if (!doctor || doctor.role !== 'DOCTOR') {
      throw new ForbiddenException('仅医生可发送问卷')
    }

    const template = await this.prisma.questionnaireTemplate.findUnique({ where: { id: dto.templateId } })
    if (!template || template.status !== 'ACTIVE') {
      throw new NotFoundException('问卷模板不存在')
    }

    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 3600 * 1000)
    const results: any[] = []
    const errors: string[] = []

    for (const patientId of dto.patientIds) {
      try {
        const bind = await this.prisma.doctorPatientBind.findFirst({
          where: { doctorId: doctorUserId, patientId, status: 'ACCEPTED' },
        })
        if (!bind) {
          errors.push(`患者 ${patientId} 未绑定`)
          continue
        }

        const existing = await this.prisma.questionnaireAssignment.findFirst({
          where: {
            templateId: dto.templateId,
            patientId,
            createdAt: { gte: fourteenDaysAgo },
            status: { notIn: ['CANCELLED'] },
          },
        })
        if (existing) {
          errors.push(`患者 ${patientId} 14天内已发送过此问卷`)
          continue
        }

        const assignment = await this.prisma.questionnaireAssignment.create({
          data: {
            templateId: dto.templateId,
            doctorId: doctorUserId,
            patientId,
            deadline: dto.deadline ? new Date(dto.deadline) : null,
            message: dto.message,
          },
          include: {
            patient: { include: { patientProfile: { select: { nickname: true } } } },
          },
        })

        results.push({
          id: assignment.id,
          patientId,
          patientName: assignment.patient.patientProfile?.nickname || assignment.patient.phone,
          status: assignment.status,
          createdAt: assignment.createdAt,
        })
      } catch {
        errors.push(`患者 ${patientId} 发送失败`)
      }
    }

    return { assignments: results, successCount: results.length, failCount: errors.length, errors }
  }

  async getSentAssignments(doctorUserId: string, query: QueryAssignmentDto) {
    const { page = 1, pageSize = 20, status, category } = query
    const skip = (page - 1) * pageSize

    await this.autoExpireAssignments(doctorUserId, 'doctor')

    const where: any = { doctorId: doctorUserId }
    if (status) where.status = status
    if (category) where.template = { category }

    const [list, total] = await Promise.all([
      this.prisma.questionnaireAssignment.findMany({
        where,
        include: {
          template: { select: { title: true, category: true, totalScore: true } },
          patient: { include: { patientProfile: { select: { nickname: true } } } },
          response: { select: { totalScore: true, submittedAt: true, doctorNote: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.questionnaireAssignment.count({ where }),
    ])

    return {
      list: list.map((a) => ({
        id: a.id,
        templateId: a.templateId,
        templateTitle: a.template.title,
        templateCategory: a.template.category,
        templateTotalScore: a.template.totalScore,
        patientName: a.patient.patientProfile?.nickname || a.patient.phone,
        patientId: a.patientId,
        status: a.status,
        deadline: a.deadline,
        message: a.message,
        totalScore: a.response?.totalScore ?? null,
        hasNote: !!a.response?.doctorNote,
        submittedAt: a.response?.submittedAt ?? null,
        createdAt: a.createdAt,
      })),
      total,
      hasMore: skip + pageSize < total,
    }
  }

  async getReceivedAssignments(patientUserId: string, query: QueryAssignmentDto) {
    const { page = 1, pageSize = 20, status } = query
    const skip = (page - 1) * pageSize

    await this.autoExpireAssignments(patientUserId, 'patient')

    const where: any = { patientId: patientUserId }
    if (status) where.status = status

    const [list, total] = await Promise.all([
      this.prisma.questionnaireAssignment.findMany({
        where,
        include: {
          template: { select: { title: true, category: true, totalScore: true, estimatedTime: true, questions: true } },
          doctor: { include: { doctorProfile: { select: { realName: true } } } },
          response: { select: { totalScore: true, submittedAt: true, doctorNote: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.questionnaireAssignment.count({ where }),
    ])

    return {
      list: list.map((a) => ({
        id: a.id,
        templateTitle: a.template.title,
        templateCategory: a.template.category,
        templateTotalScore: a.template.totalScore,
        estimatedTime: a.template.estimatedTime,
        questionCount: Array.isArray(a.template.questions) ? (a.template.questions as any[]).length : 0,
        doctorName: a.doctor.doctorProfile?.realName || '医生',
        status: a.status,
        deadline: a.deadline,
        message: a.message,
        totalScore: a.response?.totalScore ?? null,
        hasNote: !!a.response?.doctorNote,
        submittedAt: a.response?.submittedAt ?? null,
        createdAt: a.createdAt,
      })),
      total,
      hasMore: skip + pageSize < total,
    }
  }

  async getAssignmentDetail(userId: string, assignmentId: string) {
    const assignment = await this.prisma.questionnaireAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        template: true,
        doctor: { include: { doctorProfile: { select: { realName: true } } } },
        patient: { include: { patientProfile: { select: { nickname: true } } } },
        response: true,
      },
    })

    if (!assignment) throw new NotFoundException('问卷不存在')
    if (assignment.doctorId !== userId && assignment.patientId !== userId) {
      throw new ForbiddenException('无权查看此问卷')
    }

    return {
      id: assignment.id,
      status: assignment.status,
      deadline: assignment.deadline,
      message: assignment.message,
      createdAt: assignment.createdAt,
      template: {
        id: assignment.template.id,
        title: assignment.template.title,
        description: assignment.template.description,
        category: assignment.template.category,
        questions: assignment.template.questions,
        totalScore: assignment.template.totalScore,
        estimatedTime: assignment.template.estimatedTime,
      },
      doctorName: assignment.doctor.doctorProfile?.realName || '医生',
      patientName: assignment.patient.patientProfile?.nickname || '患者',
      response: assignment.response ? {
        answers: assignment.response.answers,
        totalScore: assignment.response.totalScore,
        dimensionScores: assignment.response.dimensionScores,
        duration: assignment.response.duration,
        submittedAt: assignment.response.submittedAt,
        doctorNote: assignment.response.doctorNote,
        notedAt: assignment.response.notedAt,
      } : null,
    }
  }

  async submitResponse(patientUserId: string, assignmentId: string, dto: SubmitResponseDto) {
    const assignment = await this.prisma.questionnaireAssignment.findUnique({
      where: { id: assignmentId },
      include: { template: true, response: true },
    })

    if (!assignment) throw new NotFoundException('问卷不存在')
    if (assignment.patientId !== patientUserId) throw new ForbiddenException('无权填写此问卷')
    if (assignment.response) throw new BadRequestException('该问卷已提交')
    if (assignment.status !== 'PENDING') throw new BadRequestException('问卷状态不允许提交')
    if (assignment.deadline && new Date(assignment.deadline) < new Date()) {
      throw new BadRequestException('问卷已过期')
    }

    const questions = assignment.template.questions as any[]
    for (const q of questions) {
      if (q.required) {
        const answer = dto.answers.find((a) => a.questionId === q.id)
        if (!answer || answer.value === '' || answer.value === null || answer.value === undefined) {
          throw new BadRequestException(`题目"${q.title}"为必填项`)
        }
        if (Array.isArray(answer.value) && answer.value.length === 0) {
          throw new BadRequestException(`题目"${q.title}"为必填项`)
        }
      }
    }

    const { totalScore, dimensionScores, scoredAnswers } = this.calculateScores(questions, dto.answers)

    const response = await this.prisma.questionnaireResponse.create({
      data: {
        assignmentId,
        answers: scoredAnswers,
        totalScore,
        dimensionScores: Object.keys(dimensionScores).length > 0 ? dimensionScores : undefined,
        duration: dto.duration,
      },
    })

    await this.prisma.questionnaireAssignment.update({
      where: { id: assignmentId },
      data: { status: 'COMPLETED' },
    })

    const maxScore = assignment.template.totalScore || 0
    const level = this.getScoreLevel(totalScore, maxScore)

    return {
      id: response.id,
      totalScore,
      maxScore,
      dimensionScores,
      ...level,
    }
  }

  async getAssignmentResult(userId: string, assignmentId: string) {
    const assignment = await this.prisma.questionnaireAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        template: true,
        doctor: { include: { doctorProfile: { select: { realName: true } } } },
        patient: { include: { patientProfile: { select: { id: true, nickname: true } } } },
        response: true,
      },
    })

    if (!assignment) throw new NotFoundException('问卷不存在')
    if (assignment.doctorId !== userId && assignment.patientId !== userId) {
      throw new ForbiddenException('无权查看此问卷')
    }
    if (!assignment.response) throw new BadRequestException('问卷尚未提交')

    const level = this.getScoreLevel(
      assignment.response.totalScore || 0,
      assignment.template.totalScore || 0,
    )

    let healthData: { avgValue: number; recordCount: number; inRangeRate: number } | null = null
    if (assignment.patient.patientProfile) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000)
      const records = await this.prisma.bloodSugarRecord.findMany({
        where: {
          patientId: assignment.patient.patientProfile.id,
          createdAt: { gte: sevenDaysAgo },
        },
      })
      if (records.length > 0) {
        const avg = records.reduce((s, r) => s + r.value, 0) / records.length
        const inRange = records.filter((r) => r.value >= 3.9 && r.value <= 10.0).length
        healthData = {
          avgValue: Math.round(avg * 10) / 10,
          recordCount: records.length,
          inRangeRate: Math.round((inRange / records.length) * 100),
        }
      }
    }

    return {
      id: assignment.id,
      status: assignment.status,
      createdAt: assignment.createdAt,
      template: {
        id: assignment.template.id,
        title: assignment.template.title,
        category: assignment.template.category,
        questions: assignment.template.questions,
        totalScore: assignment.template.totalScore,
      },
      doctorName: assignment.doctor.doctorProfile?.realName || '医生',
      patientName: assignment.patient.patientProfile?.nickname || '患者',
      response: {
        totalScore: assignment.response.totalScore,
        dimensionScores: assignment.response.dimensionScores,
        answers: assignment.response.answers,
        duration: assignment.response.duration,
        submittedAt: assignment.response.submittedAt,
        doctorNote: assignment.response.doctorNote,
        notedAt: assignment.response.notedAt,
      },
      level,
      healthData,
    }
  }

  async addNote(doctorUserId: string, assignmentId: string, dto: AddNoteDto) {
    const assignment = await this.prisma.questionnaireAssignment.findUnique({
      where: { id: assignmentId },
      include: { response: true },
    })

    if (!assignment) throw new NotFoundException('问卷不存在')
    if (assignment.doctorId !== doctorUserId) throw new ForbiddenException('无权添加批注')
    if (!assignment.response) throw new BadRequestException('问卷尚未提交')

    await this.prisma.questionnaireResponse.update({
      where: { id: assignment.response.id },
      data: { doctorNote: dto.doctorNote, notedAt: new Date() },
    })

    return { message: '批注已保存' }
  }

  async cancelAssignment(doctorUserId: string, assignmentId: string) {
    const assignment = await this.prisma.questionnaireAssignment.findUnique({
      where: { id: assignmentId },
    })

    if (!assignment) throw new NotFoundException('问卷不存在')
    if (assignment.doctorId !== doctorUserId) throw new ForbiddenException('无权取消此问卷')
    if (assignment.status !== 'PENDING') throw new BadRequestException('仅可取消待填写状态的问卷')

    await this.prisma.questionnaireAssignment.update({
      where: { id: assignmentId },
      data: { status: 'CANCELLED' },
    })

    return { message: '问卷已取消' }
  }

  async getPatientHistory(doctorUserId: string, patientId: string) {
    const bind = await this.prisma.doctorPatientBind.findFirst({
      where: { doctorId: doctorUserId, patientId, status: 'ACCEPTED' },
    })
    if (!bind) throw new ForbiddenException('未绑定该患者')

    const assignments = await this.prisma.questionnaireAssignment.findMany({
      where: { patientId, status: 'COMPLETED' },
      include: {
        template: { select: { title: true, category: true, totalScore: true } },
        response: { select: { totalScore: true, submittedAt: true, doctorNote: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const trend: Record<string, { date: string; score: number; maxScore: number }[]> = {}
    const history = assignments.map((a) => {
      const cat = a.template.category
      if (!trend[cat]) trend[cat] = []
      if (a.response) {
        trend[cat].push({
          date: a.response.submittedAt.toISOString().split('T')[0],
          score: a.response.totalScore || 0,
          maxScore: a.template.totalScore || 0,
        })
      }
      return {
        id: a.id,
        templateTitle: a.template.title,
        category: a.template.category,
        totalScore: a.response?.totalScore ?? null,
        maxScore: a.template.totalScore,
        submittedAt: a.response?.submittedAt ?? null,
        doctorNote: a.response?.doctorNote ?? null,
      }
    })

    for (const cat in trend) {
      trend[cat].reverse()
    }

    return { history, trend, total: history.length }
  }

  async getStatsOverview(doctorUserId: string) {
    const base = { doctorId: doctorUserId }

    const [totalSent, totalCompleted, totalPending, totalExpired] = await Promise.all([
      this.prisma.questionnaireAssignment.count({ where: base }),
      this.prisma.questionnaireAssignment.count({ where: { ...base, status: 'COMPLETED' } }),
      this.prisma.questionnaireAssignment.count({ where: { ...base, status: 'PENDING' } }),
      this.prisma.questionnaireAssignment.count({ where: { ...base, status: 'EXPIRED' } }),
    ])

    const completionRate = totalSent > 0
      ? Math.round(((totalCompleted) / (totalCompleted + totalExpired || 1)) * 1000) / 10
      : 0

    const categoryStats = await this.prisma.questionnaireAssignment.groupBy({
      by: ['status'],
      where: base,
      _count: true,
    })

    return {
      totalSent,
      totalCompleted,
      totalPending,
      totalExpired,
      completionRate,
      statusBreakdown: categoryStats.map((s) => ({ status: s.status, count: s._count })),
    }
  }

  private calculateScores(questions: any[], answers: any[]) {
    let totalScore = 0
    const dimensionScores: Record<string, number> = {}
    const scoredAnswers: any[] = []

    for (const answer of answers) {
      const question = questions.find((q: any) => q.id === answer.questionId)
      if (!question) {
        scoredAnswers.push(answer)
        continue
      }

      let score: number | undefined

      if (question.type === 'single_choice' && question.options) {
        const selected = question.options.find((o: any) => String(o.value) === String(answer.value))
        if (selected && selected.score !== undefined) {
          score = selected.score
        }
      } else if (question.type === 'rating') {
        const val = Number(answer.value)
        if (!isNaN(val)) {
          score = val
        }
      }

      if (score !== undefined) {
        totalScore += score
        if (question.dimension) {
          dimensionScores[question.dimension] = (dimensionScores[question.dimension] || 0) + score
        }
      }

      scoredAnswers.push({ ...answer, score })
    }

    return { totalScore, dimensionScores, scoredAnswers }
  }

  private getScoreLevel(totalScore: number, maxScore: number) {
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0
    const rounded = Math.round(percentage * 10) / 10
    if (percentage >= 80) return { level: '优秀', percentage: rounded, message: '管理非常好，继续保持！' }
    if (percentage >= 60) return { level: '良好', percentage: rounded, message: '总体不错，仍有提升空间。' }
    if (percentage >= 40) return { level: '一般', percentage: rounded, message: '需要改善部分习惯。' }
    return { level: '较差', percentage: rounded, message: '建议加强管理，多与医生沟通。' }
  }

  private async autoExpireAssignments(userId: string, role: 'doctor' | 'patient') {
    const where: any = {
      status: 'PENDING',
      deadline: { lt: new Date() },
    }
    if (role === 'doctor') where.doctorId = userId
    else where.patientId = userId

    await this.prisma.questionnaireAssignment.updateMany({
      where,
      data: { status: 'EXPIRED' },
    })
  }
}

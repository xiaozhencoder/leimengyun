import { Injectable, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../common/prisma.service'
import { SendMessageDto } from './chat.dto'

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ patientId: userId }, { doctorId: userId }],
        status: 'ACTIVE',
      },
      include: {
        patient: {
          select: {
            id: true,
            avatarUrl: true,
            role: true,
            patientProfile: { select: { nickname: true } },
          },
        },
        doctor: {
          select: {
            id: true,
            avatarUrl: true,
            role: true,
            doctorProfile: { select: { realName: true, department: true } },
          },
        },
      },
      orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
    })

    const result: any[] = []
    for (const conv of conversations) {
      const isPatient = conv.patientId === userId
      const other = isPatient ? conv.doctor : conv.patient
      const otherName = isPatient
        ? conv.doctor.doctorProfile?.realName || '医生'
        : conv.patient.patientProfile?.nickname || '患者'
      const otherTag = isPatient
        ? conv.doctor.doctorProfile?.department || ''
        : ''

      const lastMsg = await this.prisma.message.findFirst({
        where: { conversationId: conv.id },
        orderBy: { createdAt: 'desc' },
      })

      const unreadCount = await this.prisma.message.count({
        where: {
          conversationId: conv.id,
          senderId: { not: userId },
          isRead: false,
        },
      })

      result.push({
        id: conv.id,
        otherUserId: isPatient ? conv.doctorId : conv.patientId,
        otherName,
        otherTag,
        otherAvatar: other.avatarUrl,
        otherRole: other.role,
        lastMessage: lastMsg?.content || '',
        lastMessageType: lastMsg?.contentType || 'TEXT',
        lastMessageAt: lastMsg?.createdAt || conv.createdAt,
        unreadCount,
      })
    }

    return result
  }

  async getMessages(userId: string, conversationId: string) {
    const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId } })
    if (!conv || (conv.patientId !== userId && conv.doctorId !== userId)) {
      throw new ForbiddenException('无权访问该会话')
    }

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        senderId: true,
        contentType: true,
        content: true,
        isRead: true,
        createdAt: true,
      },
    })
  }

  async sendMessage(senderId: string, dto: SendMessageDto) {
    const conv = await this.prisma.conversation.findUnique({ where: { id: dto.conversationId } })
    if (!conv || (conv.patientId !== senderId && conv.doctorId !== senderId)) {
      throw new ForbiddenException('无权发送消息')
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: dto.conversationId,
        senderId,
        contentType: (dto.contentType as any) || 'TEXT',
        content: dto.content,
      },
    })

    await this.prisma.conversation.update({
      where: { id: dto.conversationId },
      data: { lastMessageAt: new Date() },
    })

    return message
  }

  async markRead(userId: string, conversationId: string) {
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    })
    return { message: '已标记已读' }
  }
}

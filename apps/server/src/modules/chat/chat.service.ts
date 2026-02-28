import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../common/prisma.service'
import { MessageContentType } from '@prisma/client'

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async getConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ patientId: userId }, { doctorId: userId }],
      },
      include: {
        patient: {
          select: {
            id: true,
            role: true,
            avatarUrl: true,
            patientProfile: { select: { nickname: true } },
          },
        },
        doctor: {
          select: {
            id: true,
            role: true,
            avatarUrl: true,
            doctorProfile: { select: { realName: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, createdAt: true },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    })

    return Promise.all(
      conversations.map(async (conv) => {
        const isPatient = conv.patientId === userId
        const otherUser = isPatient ? conv.doctor : conv.patient
        const otherName = isPatient
          ? conv.doctor.doctorProfile?.realName || '医生'
          : conv.patient.patientProfile?.nickname || '患者'

        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            isRead: false,
          },
        })

        return {
          id: conv.id,
          otherUser: {
            id: otherUser.id,
            name: otherName,
            avatar: otherUser.avatarUrl,
            role: otherUser.role,
          },
          lastMessage: conv.messages[0]?.content,
          lastMessageAt: conv.messages[0]?.createdAt || conv.lastMessageAt,
          unreadCount,
        }
      }),
    )
  }

  async getMessages(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    })
    if (!conversation) {
      throw new NotFoundException('会话不存在')
    }
    if (conversation.patientId !== userId && conversation.doctorId !== userId) {
      throw new ForbiddenException('无权访问此会话')
    }

    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    })

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, avatarUrl: true, role: true },
        },
      },
    })
  }

  async sendMessage(userId: string, dto: { conversationId: string; contentType: string; content: string }) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: dto.conversationId },
    })
    if (!conversation) {
      throw new NotFoundException('会话不存在')
    }
    if (conversation.patientId !== userId && conversation.doctorId !== userId) {
      throw new ForbiddenException('无权在此会话中发送消息')
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: dto.conversationId,
        senderId: userId,
        contentType: dto.contentType as MessageContentType,
        content: dto.content,
      },
      include: {
        sender: {
          select: { id: true, avatarUrl: true, role: true },
        },
      },
    })

    await this.prisma.conversation.update({
      where: { id: dto.conversationId },
      data: { lastMessageAt: new Date() },
    })

    return message
  }

  async createConversation(patientId: string, doctorId: string) {
    const existing = await this.prisma.conversation.findUnique({
      where: { patientId_doctorId: { patientId, doctorId } },
    })
    if (existing) {
      return existing
    }

    return this.prisma.conversation.create({
      data: { patientId, doctorId },
    })
  }
}

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../common/prisma.service'
import { SendMessageDto } from './chat.dto'

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        OR: [{ patientId: userId }, { doctorId: userId }],
      },
      include: {
        patient: { select: { id: true, phone: true, patientProfile: { select: { nickname: true } } } },
        doctor: { select: { id: true, phone: true, doctorProfile: { select: { realName: true } } } },
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { lastMessageAt: 'desc' },
    })
  }

  async getMessages(conversationId: string) {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, role: true } } },
    })
  }

  async sendMessage(senderId: string, dto: SendMessageDto) {
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
}

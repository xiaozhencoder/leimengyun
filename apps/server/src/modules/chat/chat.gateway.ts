import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { JwtService } from '@nestjs/jwt'
import { Logger } from '@nestjs/common'

@WebSocketGateway({
  cors: { origin: ['http://localhost:5173', 'http://localhost:5174'] },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private logger = new Logger('ChatGateway')
  private userSockets = new Map<string, Set<string>>()

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.query?.token as string)

      if (!token) {
        this.logger.warn(`连接被拒绝: 缺少 token (${client.id})`)
        client.disconnect()
        return
      }

      const payload = this.jwtService.verify(token)
      const userId = payload.sub as string
      client.data.userId = userId

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set())
      }
      this.userSockets.get(userId)!.add(client.id)

      client.join(`user:${userId}`)
      this.logger.log(`用户 ${userId} 已连接 (${client.id})`)
    } catch {
      this.logger.warn(`连接被拒绝: token 无效 (${client.id})`)
      client.disconnect()
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId
    if (userId) {
      const sockets = this.userSockets.get(userId)
      if (sockets) {
        sockets.delete(client.id)
        if (sockets.size === 0) this.userSockets.delete(userId)
      }
      this.logger.log(`用户 ${userId} 已断开 (${client.id})`)
    }
  }

  pushNewMessage(targetUserId: string, message: any) {
    this.server.to(`user:${targetUserId}`).emit('newMessage', message)
  }

  pushConversationUpdate(targetUserId: string, conversation: any) {
    this.server.to(`user:${targetUserId}`).emit('conversationUpdate', conversation)
  }

  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0
  }
}

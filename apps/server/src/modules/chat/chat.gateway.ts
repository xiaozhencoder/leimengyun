import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { ChatService } from './chat.service'

@WebSocketGateway({ cors: true })
export class ChatGateway {
  @WebSocketServer()
  server: Server

  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage('joinConversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.join(`conversation:${data.conversationId}`)
    return { event: 'joinedConversation', data: { conversationId: data.conversationId } }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      userId: string
      conversationId: string
      contentType: string
      content: string
    },
  ) {
    const message = await this.chatService.sendMessage(data.userId, {
      conversationId: data.conversationId,
      contentType: data.contentType,
      content: data.content,
    })

    this.server.to(`conversation:${data.conversationId}`).emit('newMessage', message)

    return { event: 'messageSent', data: message }
  }
}

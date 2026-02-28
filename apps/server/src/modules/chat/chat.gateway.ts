import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

@WebSocketGateway({
  cors: { origin: ['http://localhost:5173', 'http://localhost:5174'] },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private userSockets = new Map<string, string>()

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string
    if (userId) {
      this.userSockets.set(userId, client.id)
      console.log(`用户 ${userId} 已连接`)
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId)
        console.log(`用户 ${userId} 已断开`)
        break
      }
    }
  }

  @SubscribeMessage('sendMessage')
  handleMessage(client: Socket, payload: { to: string; message: any }) {
    const targetSocketId = this.userSockets.get(payload.to)
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('newMessage', payload.message)
    }
  }
}

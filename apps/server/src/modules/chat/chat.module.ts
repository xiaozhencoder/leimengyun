import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'
import { ChatGateway } from './chat.gateway'

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-jwt-secret-leimengyun-2026',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
})
export class ChatModule {}

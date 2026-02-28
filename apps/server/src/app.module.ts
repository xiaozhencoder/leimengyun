import { Module } from '@nestjs/common'
import { AuthModule } from './modules/auth/auth.module'
import { UserModule } from './modules/user/user.module'
import { HealthModule } from './modules/health/health.module'
import { ChatModule } from './modules/chat/chat.module'
import { PrismaModule } from './modules/common/prisma.module'

@Module({
  imports: [PrismaModule, AuthModule, UserModule, HealthModule, ChatModule],
})
export class AppModule {}

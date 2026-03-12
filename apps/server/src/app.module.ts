import { Module } from '@nestjs/common'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'path'
import { AuthModule } from './modules/auth/auth.module'
import { UserModule } from './modules/user/user.module'
import { HealthModule } from './modules/health/health.module'
import { ChatModule } from './modules/chat/chat.module'
import { PrismaModule } from './modules/common/prisma.module'
import { UploadModule } from './modules/upload/upload.module'

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: { index: false },
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    HealthModule,
    ChatModule,
    UploadModule,
  ],
})
export class AppModule {}

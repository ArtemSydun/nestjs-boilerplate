import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { ThrottlerBehindProxyGuard } from './common/guards/throttler-proxy.guard';
import { DatabaseModule } from './database/database.module';
import { MailerModule } from './mailer/mailer.module';
import { UsersModule } from './user/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`],
    }),
    DatabaseModule,
    ThrottlerModule.forRoot([
      {
        ttl: (parseInt(process.env.API_REQUEST_LIMIT ?? '10', 10) || 10) * 1000,
        limit: parseInt(process.env.API_REQUEST_LIMIT ?? '20', 10) || 20,
      },
    ]),
    AuthModule,
    MailerModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
  ],
})
export class AppModule {}

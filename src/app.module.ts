import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { ThrottlerBehindProxyGuard } from './common/guards/throttler-proxy.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: (parseInt(process.env.API_REQUEST_LIMIT ?? '10', 10) || 10) * 1000,
        limit: parseInt(process.env.API_REQUEST_LIMIT ?? '20', 10) || 20,
      },
    ]),
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

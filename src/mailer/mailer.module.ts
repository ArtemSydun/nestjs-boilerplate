import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule as NodeMailerModule } from '@nestjs-modules/mailer';
import { configServiceKeys } from 'src/common/enums/config.service.enum';
import { MailerService } from './services/mailer.service';

@Module({
  imports: [
    NodeMailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>(configServiceKeys.MAILER_HOST),
          port: configService.get<number>(configServiceKeys.MAILER_PORT),
          secure: false,
          auth: {
            user: configService.get<string>(configServiceKeys.MAILER_SENDER),
            pass: configService.get<string>(configServiceKeys.MAILER_PASSWORD),
          },
          authMethod: 'PLAIN',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [MailerService, Logger],
  exports: [MailerService],
})
export class MailerModule {}

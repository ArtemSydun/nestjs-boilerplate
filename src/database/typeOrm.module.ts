import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configServiceKeys } from 'src/common/enums/config.service.enum';
import { User } from 'src/user/entities/user.entity';
import { UsersSeederService } from './services/users-seeder.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get(configServiceKeys.POSTGRES_HOSTNAME),
        port: parseInt(configService.get(configServiceKeys.POSTGRES_PORT), 10),
        username: configService.get(configServiceKeys.POSTGRES_USERNAME),
        password: configService.get(configServiceKeys.POSTGRES_PASSWORD),
        database: configService.get(configServiceKeys.POSTGRES_DATABASE),
        entities: [],
        autoLoadEntities: true,
      }),
    }),
  ],
  providers: [UsersSeederService],
})
export class TypeORMConnectionModule {}

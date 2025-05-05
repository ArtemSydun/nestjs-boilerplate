import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
// import * as mongoose from 'mongoose';
import { configServiceKeys } from 'src/common/enums/config.service.enum';
import { User, UserSchema } from 'src/user/entities/user.entity';
import { SeederService } from './seeders/user.seeder';

//do not enable db debugging on prod
// if (process.env.NODE_ENV === 'development') {
//   mongoose.set('debug', true);
// }

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const username = configService.get<string>(
          configServiceKeys.MONGODB_USERNAME,
        );
        const password = configService.get<string>(
          configServiceKeys.MONGODB_PASSWORD,
        );
        const host = configService.get<string>(
          configServiceKeys.MONGODB_HOSTNAME,
        );
        const port = configService.get<string>(configServiceKeys.MONGODB_PORT);
        const database = configService.get<string>(
          configServiceKeys.MONGODB_DATABASE,
        );
        const authSource =
          configService.get<string>(configServiceKeys.MONGODB_AUTH_SOURCE) ||
          'admin';
        console.log(
          `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=${authSource}`,
        );
        return {
          uri: `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=${authSource}`,
        };
      },
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],

  providers: [SeederService],
  exports: [MongooseModule],
})
export class DatabaseModule {}

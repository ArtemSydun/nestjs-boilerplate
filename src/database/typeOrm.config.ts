import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { configServiceKeys } from 'src/common/enums/config.service.enum';
import { User } from 'src/user/entities/user.entity';
import { DataSource } from 'typeorm';
import { CreateUserTable1719932316256 } from './migrations/1719932316256-createUserMigration';

config({ path: `.env.${process.env.NODE_ENV}` });
const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  host: configService.get(configServiceKeys.POSTGRES_HOSTNAME),
  port: parseInt(configService.get(configServiceKeys.POSTGRES_PORT), 10),
  username: configService.get(configServiceKeys.POSTGRES_USERNAME),
  password: configService.get(configServiceKeys.POSTGRES_PASSWORD),
  database: configService.get(configServiceKeys.POSTGRES_DATABASE),
  entities: [User],
  migrations: [CreateUserTable1719932316256],
  synchronize: false,
});

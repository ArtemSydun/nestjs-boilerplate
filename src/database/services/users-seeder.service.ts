import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { configServiceKeys } from 'src/common/enums/config.service.enum';
import { User } from 'src/user/entities/user.entity';
import { UserRoles } from 'src/user/enums/role.enum';
import { Repository } from 'typeorm';

@Injectable()
export class UsersSeederService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
  ) {}
  async onModuleInit() {
    const email =
      this.configService.get<string>(
        configServiceKeys.POSTGRES_SUPERADMIN_EMAIL,
      ) || 'superadmin@example.com';
    const password =
      this.configService.get<string>(
        configServiceKeys.POSTGRES_SUPERADMIN_PASSWORD,
      ) || 'supersecurepassword';

    const exists = await this.userRepo.findOne({ where: { email } });

    if (exists) {
      console.log(`🟡 Superadmin ${email} already exists`);
      return;
    }

    const user = this.userRepo.create({
      email,
      password,
      role: UserRoles.superadmin,
    });

    await this.userRepo.save(user);
    console.log(`✅ Superadmin ${email} created`);
  }
}

import {
  Injectable,
  UnauthorizedException,
  ExecutionContext,
} from '@nestjs/common';
import { CanActivate } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { User } from 'src/user/entities/user.entity';
import { UsersService } from 'src/user/services/users.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('Invalid or expired authorization token');
    }

    let userPayload;

    // Validate the JWT and get the payload
    try {
      userPayload = this.jwtService.verify(token); // Verify and decode the token
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired authorization token');
    }

    if (!userPayload || !userPayload.email || !userPayload.hash) {
      throw new UnauthorizedException(
        'Invalid or expired authorization token'
      );
    }

    // Fetch the user from the database
    const dbUser: User | null = await this.usersService.findUserByEmail(
      userPayload.email,
    );

    // Get the hash from the userPayload
    const hashFromToken = userPayload.hash;

    // Compare last 10 characters of password hash
    const last10HashDb = dbUser.password?.slice(-10);
    const last10HashToken = hashFromToken?.slice(-10);

    if (
      dbUser.email !== userPayload.email ||
      last10HashDb !== last10HashToken
    ) {
      throw new UnauthorizedException(
        'Invalid or expired authorization token'
      );
    }

    // Attach full user object to request for further use in controllers
    delete dbUser.password;

    request.user = dbUser;
    return true;
  }
}

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { configServiceKeys } from 'src/common/enums/config.service.enum';
import { hashPassword, verifyPassword } from 'src/common/helpers/hashing';
import { DefaultResponse } from 'src/common/interfaces/responses';
import { MailerService } from 'src/mailer/services/mailer.service';
import { ChangeEmailDto } from 'src/user/dto/change-email.dto';
import { ChangePasswordDto } from 'src/user/dto/change-password.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { User } from 'src/user/entities/user.entity';
import { UserRoles } from 'src/user/enums/role.enum';
import { UsersRepository } from 'src/user/repositories/users.repository';
import { UsersService } from 'src/user/services/users.service';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { LoginUserDto } from '../dto/login.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
    private readonly userRepository: UsersRepository,
    private readonly configService: ConfigService,
    private readonly mailService: MailerService,
  ) {}

  public verifyToken(token: string): any {
    try {
      const decoded = this.jwtService.verify(token);
      return decoded;
    } catch (err) {
      this.logger.error('Invalid or expired token', err.stack);
      throw new BadRequestException('Your token is not valid or expired');
    }
  }

  public async login(
    loginUserDto: LoginUserDto,
  ): Promise<{ accessToken: string; user: Partial<User> }> {
    const user = await this.userService.findUserByEmail(loginUserDto.email);

    // Validate password
    await verifyPassword(loginUserDto.password, user.password);

    const payload = {
      email: user.email,
      id: user.id,
      role: user.role,
      hash: user.password.slice(-10),
    };

    const token: string = this.jwtService.sign(payload);

    this.logger.log(`User logged in successfully: ${user.email}`);

    return {
      accessToken: token,
      user,
    };
  }

  public async initiateUserRegistration(
    createUserDto: CreateUserDto,
  ): Promise<DefaultResponse<null>> {
    this.logger.log(
      `Initiating user registration for email: ${createUserDto.email}`,
    );

    const { email, password } = createUserDto;

    const userByEmail = await this.userService.doesUserExist(
      createUserDto.email,
    );

    if (userByEmail) {
      this.logger.warn(`User ${createUserDto.email} already exists`);
      throw new ConflictException(`User ${createUserDto.email} already exists`);
    }

    const payload = {
      email,
      password,
    };

    const token = this.jwtService.sign(payload, { expiresIn: '1d' });

    await this.mailService.sendRegistrationLink(createUserDto.email, token);

    this.logger.log(`Confirmation link sent to ${createUserDto.email}`);
    return {
      message: `Confirmation link sent to your email ${createUserDto.email}`,
      statusCode: HttpStatus.OK,
    };
  }

  public async confirmUserRegistration(
    token: string,
  ): Promise<DefaultResponse<User>> {
    const decoded = this.verifyToken(token);
    const { email, password, ...userData } = decoded;

    const newUser = {
      email,
      password,
      ...userData,
    };

    const createdUser = await this.userService.createUser(newUser);

    this.logger.log(`User registered successfully: ${email}`);
    return {
      message: `User ${createdUser.email} registered successfully`,
      statusCode: HttpStatus.OK,
      data: createdUser,
    };
  }

  public async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<DefaultResponse<null>> {
    const user = await this.userService.findUserByEmail(
      forgotPasswordDto.email,
    );
    const token: string = this.jwtService.sign(
      { id: user.id },
      {
        expiresIn:
          this.configService.get(configServiceKeys.JWT_EXPIRES_CONFIRMATIONS) ||
          '15m',
      },
    );

    await this.mailService.sendResetPasswordLink(user.email, token);

    this.logger.log(`Password reset email sent to: ${user.email}`);
    return {
      message: `Password reset email sent on ${user.email}`,
      statusCode: HttpStatus.OK,
    };
  }

  public async resetPassword(
    token: string,
    resetPasswordDto: ResetPasswordDto,
  ): Promise<DefaultResponse<null>> {
    const { newPassword, repeatPassword } = resetPasswordDto;

    if (newPassword !== repeatPassword) {
      this.logger.warn('Password mismatch during reset');
      throw new BadRequestException(
        `Password and repeat password does not match`,
      );
    }

    const { id } = this.verifyToken(token);

    await this.userService.resetPassword(id, newPassword);

    this.logger.log(`Password successfully reset for user ID: ${id}`);

    return {
      message: 'Password has been successfully changed',
      statusCode: HttpStatus.OK,
    };
  }

  public async initiateChangeUserEmail(
    userId: string,
    changeEmailDto: ChangeEmailDto,
  ): Promise<DefaultResponse<null>> {
    const userToUpdate = await this.userRepository.findOneById(userId);
    const { newEmail, password } = changeEmailDto;

    if (userToUpdate.email === newEmail) {
      throw new ConflictException('New email must be different from current');
    }

    const isEmailUsed = await this.userService.doesUserExist(newEmail);

    if (isEmailUsed) {
      throw new ConflictException(`User ${newEmail} already exists`);
    }

    await verifyPassword(password, userToUpdate.password);

    const payload = {
      id: userToUpdate.id,
      newEmail,
    };

    const token = this.jwtService.sign(payload, {
      expiresIn:
        this.configService.get(configServiceKeys.JWT_EXPIRES_CONFIRMATIONS) ||
        '15m',
    });
    await this.mailService.sendChangeEmailLink(newEmail, token);

    return {
      message: `Confirmation link sent on ${newEmail}`,
      statusCode: HttpStatus.OK,
    };
  }

  public async confirmChangeUserEmail(
    token: string,
  ): Promise<DefaultResponse<null>> {
    const decoded = this.verifyToken(token);
    const { newEmail, id } = decoded;

    await this.userService.updateUserEmail(id, newEmail);
    return {
      message: 'Email changed succesfully',
      statusCode: HttpStatus.OK,
    };
  }

  public async initiateUserDeletion(
    requestedAuthor: string | User,
    userToDelete: string | User,
  ): Promise<DefaultResponse<null>> {
    const requestAuthor = await this.userService.getUser(requestedAuthor);

    const targetUser = await this.userService.getUser(userToDelete);

    if (
      requestAuthor.role !== UserRoles.superadmin &&
      requestAuthor.id !== targetUser.id
    ) {
      throw new ForbiddenException('Forbidden resource');
    }

    // Prevent a superadmin from deleting themselves
    if (
      requestAuthor.role === UserRoles.superadmin &&
      requestAuthor.id === targetUser.id
    ) {
      throw new ForbiddenException('Forbidden resource');
    }

    const payload = {
      id: targetUser.id,
    };

    const token = this.jwtService.sign(payload, {
      expiresIn:
        this.configService.get(configServiceKeys.JWT_EXPIRES_CONFIRMATIONS) ||
        '15m',
    });

    await this.mailService.sendDeleteProfileLink(targetUser.email, token);

    return {
      message: `Confirmation link sent on ${targetUser.email}`,
      statusCode: HttpStatus.OK,
    };
  }

  public async confirmUserDeletion(
    token: string,
  ): Promise<DefaultResponse<null>> {
    const decoded = this.verifyToken(token);
    const { id } = decoded;

    return await this.userService.deleteUserById(id, id);
  }

  public async changeUserPassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<DefaultResponse<null>> {
    const userToUpdate = await this.userRepository.findOneById(userId);
    const { oldPassword, newPassword } = changePasswordDto;

    if (oldPassword === newPassword) {
      throw new ConflictException(
        'New password can not be the same as previous',
      );
    }

    await verifyPassword(oldPassword, userToUpdate.password);

    const hashedPassword = await hashPassword(newPassword);

    await this.userRepository.updateById(userToUpdate.id, {
      password: hashedPassword,
    });

    return {
      message: 'Password changed successfully',
      statusCode: HttpStatus.OK,
    };
  }
}

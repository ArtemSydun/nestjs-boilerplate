import { randomUUID } from 'crypto';
import {
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';

import { hashPassword } from 'src/common/helpers/hashing';
import {
  DefaultPaginatedResponse,
  DefaultResponse,
} from 'src/common/interfaces/responses';

import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserQueryDto } from '../dto/user.query.dto';
import { User } from '../entities/user.entity';
import { UserSearchPath } from '../enums/query.enum';
import { UserRoles } from '../enums/role.enum';

import { UsersRepository } from '../repositories/users.repository';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly userRepository: UsersRepository) {}

  public async getUser(user: string | User): Promise<User> {
    if (typeof user === 'string') {
      // If it's a string, fetch the user by ID
      return await this.findUserById(user);
    }
    return user; // If it's already a User object, return it as-is
  }

  //all commented parts will be used when payments will be implemented
  //lifetimeSubscriptionPlan should be changed to trialSubscriptionPlan then
  public async createUser(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(`Creating user with email: ${createUserDto.email}`);

    const userByEmail = await this.userRepository.findOneByEmail(
      createUserDto.email,
    );

    if (userByEmail) {
      this.logger.warn(`User ${createUserDto.email} already exists`);
      throw new ConflictException(`User ${createUserDto.email} already exists`);
    }

    const newUser = {
      id: randomUUID(),
      ...createUserDto,
      password: await hashPassword(createUserDto.password),
    };

    const createdUser = await this.userRepository.create(newUser);

    this.logger.log(
      `User with email ${createdUser.email} created successfully`,
    );
    return createdUser;
  }

  public async deleteUserById(
    requestedAuthor: string | User,
    userToDelete: string | User,
  ): Promise<DefaultResponse<null>> {
    const requestAuthor = await this.getUser(requestedAuthor);
    const targetUser = await this.getUser(userToDelete);

    // Check if the requesting user is allowed to delete the target user
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

    this.logger.log(`Deleting user with ID: ${targetUser.id}`);

    // Perform the user deletion
    await this.userRepository.delete(targetUser.id);

    this.logger.log(`User ${targetUser.email} deleted successfully`);
    return {
      message: `All user data ${targetUser.email} has been deleted successfully`,
      statusCode: HttpStatus.OK,
    };
  }

  public async findAll(
    filters: UserQueryDto = {},
  ): Promise<DefaultPaginatedResponse<User>> {
    return this.userRepository.getAll(filters);
  }

  public async findTotal(): Promise<number> {
    return this.userRepository.getTotal();
  }

  public async findUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOneById(id);
    if (!user) {
      this.logger.warn(`User with ID ${id} not found`);
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const userWithoutPass = { ...user };
    delete userWithoutPass.password;
    return userWithoutPass;
  }

  public async findUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOneByEmail(email);

    if (!user) {
      this.logger.warn(`User with email ${email} not found`);
      throw new NotFoundException(`User with email ${email} does not exists`);
    }

    return user;
  }

  public async findUserProfile(user: string | User): Promise<Partial<User>> {
    const userToFind = await this.getUser(user);

    delete userToFind.password;

    return userToFind;
  }

  public async findUserByProperty(
    path: UserSearchPath,
    value: any,
  ): Promise<User> {
    const user = await this.userRepository.findUserByProperty(path, value);
    if (!user) {
      this.logger.warn(`User with property ${path}: ${value} not found`);
      throw new NotFoundException(
        `User with property ${path}: ${value} not found`,
      );
    }

    this.logger.log(`User with property ${path}: ${value} found`);
    delete user.password;
    return user;
  }

  public async doesUserExist(email: string): Promise<boolean> {
    this.logger.log(`Checking if user exists with email: ${email}`);
    return await this.userRepository.existsByEmail(email);
  }

  public async updateUserEmail(
    user: string | User,
    newEmail: string,
  ): Promise<User> {
    const userToUpdate = await this.getUser(user);

    const oldEmail = userToUpdate.email;

    if (oldEmail === newEmail) {
      throw new ConflictException('New email must be different from current');
    }

    const isEmailUsed = await this.doesUserExist(newEmail);

    if (isEmailUsed) {
      throw new ConflictException(`User ${newEmail} already exists`);
    }

    const updatedUser = await this.userRepository.updateById(userToUpdate.id, {
      email: newEmail,
    });

    return updatedUser;
  }

  public async updateUser(
    user: string | User,
    updateUserDto: UpdateUserDto,
    reqUser?: Partial<User>,
  ): Promise<DefaultResponse<User>> {
    const userToUpdate = await this.getUser(user);

    if (updateUserDto.email) {
      const updatedUser = await this.updateUserEmail(user, updateUserDto.email);
      return {
        message: `User ${userToUpdate.email} updated successfully`,
        statusCode: HttpStatus.OK,
        data: updatedUser,
      };
    }

    //do not let update roles for not superadmins, and do not let superadmin lower his role
    if (
      reqUser?.role !== UserRoles.superadmin ||
      (reqUser?.role === UserRoles.superadmin &&
        userToUpdate.id === reqUser?.id)
    ) {
      delete updateUserDto.role;
    }

    const updatedUserProps: Partial<User> = {};

    for (const [key, value] of Object.entries(updateUserDto)) {
      if (value !== undefined) {
        updatedUserProps[key] = value;
      }
    }

    const updatedUser = await this.userRepository.updateById(
      userToUpdate.id,
      updatedUserProps,
    );

    delete updatedUser.password;

    return {
      message: `User ${userToUpdate.email} updated successfully`,
      statusCode: HttpStatus.OK,
      data: updatedUser,
    };
  }

  public async updateManyUsers(operations: any[]) {
    return await this.userRepository.bulkUpdateUsers(operations);
  }

  public async resetPassword(id: string, newPassword: string): Promise<void> {
    const userToReset = await this.getUser(id);
    const encryptedPassword = await hashPassword(newPassword);

    await this.userRepository.updateById(userToReset.id, {
      password: encryptedPassword,
    });
    this.logger.log(`Password for user with ID ${id} reset successfully`);
  }
}

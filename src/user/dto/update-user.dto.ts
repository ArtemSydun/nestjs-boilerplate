import { Optional } from '@nestjs/common';
import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import { UserRoles } from '../enums/role.enum';
import { CreateUserDto } from './create-user.dto';

// @Optional() decorator for nested objects here do not work properly, nest js do not support it
// https://github.com/nestjs/swagger/issues/2382
export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional()
  @Optional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ type: String, enum: UserRoles })
  @Optional()
  role?: UserRoles;
}

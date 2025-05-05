import {
  Controller,
  Body,
  Patch,
  Param,
  UseGuards,
  HttpStatus,
  Req,
  Get,
  Delete,
  Query,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  getSchemaPath,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

import { Roles } from 'src/common/decorators/auth.role.decorator';
import {
  ApiCustomForbiddenResponse,
  ApiCustomNotFoundResponse,
  ApiCustomUnathorizedResponse,
} from 'src/common/decorators/swagger.decorators';

import {
  DefaultPaginatedResponse,
  DefaultResponse,
} from 'src/common/interfaces/responses';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserQueryDto } from '../dto/user.query.dto';
import { User } from '../entities/user.entity';
import { UserRoles } from '../enums/role.enum';
import { UsersService } from '../services/users.service';

@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.admin, UserRoles.superadmin)
  @Get()
  @ApiOperation({
    summary: 'Get all users (Admin / Superadmin only)',
    description:
      'This endpoint retrieves a list of all users in the system. It can only be accessed by users with the admin or superadmin role.',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    description: 'Filter by email (case-insensitive)',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: UserRoles,
    description: 'Filter by user role',
  })
  @ApiQuery({
    name: 'lastLoginDate',
    required: false,
    description: 'Filter by last login date (ISO format)',
  })
  @ApiQuery({
    name: 'lastActivityDate',
    required: false,
    description: 'Filter by last activity date (ISO format)',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Date field to filter by (e.g., createdAt, lastLoginDate)',
  })
  @ApiQuery({
    name: 'fromDate',
    required: false,
    description: 'Start of date range (ISO format)',
  })
  @ApiQuery({
    name: 'toDate',
    required: false,
    description: 'End of date range (ISO format)',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sorting order (asc or desc)',
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    description: 'Field to order results by (default: createdAt)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (default: 10)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiOkResponse({
    description: 'All users list',
    type: [User],
  })
  @ApiCustomUnathorizedResponse()
  @ApiCustomForbiddenResponse()
  async findAll(
    @Query() queryParams: UserQueryDto,
  ): Promise<DefaultPaginatedResponse<User>> {
    return this.usersService.findAll(queryParams);
  }

  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({
    summary: 'Get user profile',
    description:
      'This endpoint retrieves the profile of the currently authenticated user.',
  })
  @ApiOkResponse({
    description: 'User profile',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
        email: { type: 'string', example: 'john.doe@example.com' },
        role: {
          type: 'string',
          enum: Object.values(UserRoles),
          example: UserRoles.user,
        },
      },
    },
  })
  @ApiCustomUnathorizedResponse()
  @ApiCustomNotFoundResponse('User', 'id')
  getUserProfile(@Req() req): Promise<Partial<User>> {
    return this.usersService.findUserProfile(req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.admin, UserRoles.superadmin)
  @Get(':id')
  @ApiOperation({
    summary: 'Get a user by ID (Admin / Superadmin only)',
    description:
      'This endpoint retrieves the details of a specific user by their ID. It can only be accessed by users with the admin or superadmin role.',
  })
  @ApiOkResponse({
    description: 'User by id',
    type: User,
  })
  @ApiCustomUnathorizedResponse()
  @ApiCustomForbiddenResponse()
  @ApiCustomNotFoundResponse('User', 'id')
  findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findUserById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.superadmin)
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a user by ID (Superadmin only)',
    description: 'This endpoint allows to delete a user by their ID.',
  })
  @ApiOkResponse({
    description: 'User deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'User {{id}} deleted successfully',
        },
        statusCode: {
          type: 'number',
          example: HttpStatus.OK,
        },
      },
    },
  })
  @ApiCustomUnathorizedResponse()
  @ApiCustomForbiddenResponse()
  @ApiCustomNotFoundResponse('User', 'id')
  deleteUserById(
    @Param('id') id: string,
    @Req() req,
  ): Promise<DefaultResponse<string>> {
    return this.usersService.deleteUserById(req.user, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.superadmin, UserRoles.admin)
  @Patch(':id')
  @ApiOperation({
    summary: 'Update a user by ID (Superadmin only)',
    description:
      'This endpoint allows to update a user by their ID. It can only be accessed by users with the superadmin role.',
  })
  @ApiOkResponse({
    description: 'User updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'User {{id}} updated successfully',
        },
        statusCode: {
          type: 'number',
          example: HttpStatus.OK,
        },
        data: {
          type: 'object',
          $ref: getSchemaPath(User),
        },
      },
    },
  })
  @ApiCustomUnathorizedResponse()
  @ApiCustomForbiddenResponse()
  @ApiCustomNotFoundResponse('User', 'id')
  updateUserById(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req,
  ): Promise<DefaultResponse<User>> {
    return this.usersService.updateUser(
      id,
      updateUserDto,
      req.user,
    );
  }
}

import {
  Controller,
  Post,
  HttpStatus,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  ApiCustomNotFoundResponse,
  ApiCustomConflictResponse,
  ApiCustomUnathorizedResponse,
  ApiCustomBadRequestResponse,
} from 'src/common/decorators/swagger.decorators';
import { DefaultResponse } from 'src/common/interfaces/responses';
import { ChangeEmailDto } from 'src/user/dto/change-email.dto';
import { ChangePasswordDto } from 'src/user/dto/change-password.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { User } from 'src/user/entities/user.entity';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { LoginUserResponseDto, LoginUserDto } from '../dto/login.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { AuthService } from '../services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Login with user credentials',
    description:
      'Logs in the user with their credentials and returns an access token and user data.',
  })
  @ApiOkResponse({
    description: 'Successfully logged in',
    type: LoginUserResponseDto,
  })
  @ApiCustomNotFoundResponse('User', 'email')
  @ApiCustomBadRequestResponse('Invalid credentials', 'Invalid credentials')
  public login(
    @Body() loginCredentials: LoginUserDto,
  ): Promise<{ accessToken: string; user: Partial<User> }> {
    return this.authService.login(loginCredentials);
  }

  @Throttle({
    default: {
      limit: 2,
      ttl: 60 * 1000,
    },
  })
  @Post('sign-up')
  @ApiOperation({
    summary: 'Sign up a new user',
    description:
      'Registers a new user and sends a confirmation email with a link to verify the account.',
  })
  @ApiOkResponse({
    description: 'Confirmation link sent',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Confirmation link sent to your email mail@mail.com',
        },
        statusCode: {
          type: 'number',
          example: HttpStatus.OK,
        },
      },
    },
  })
  @ApiCustomConflictResponse('User', 'email')
  public createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<DefaultResponse<null>> {
    return this.authService.initiateUserRegistration(
      createUserDto,
    );
  }

  @Post('sign-up/:token')
  @ApiOperation({
    summary: 'Confirm user registration',
    description:
      'Confirms the user’s email address by verifying the confirmation token.',
  })
  @ApiOkResponse({
    description: 'User registered successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'User registered successfully',
        },
        statusCode: {
          type: 'number',
          example: HttpStatus.OK,
        },
      },
    },
  })
  @ApiCustomConflictResponse('User', 'email')
  public confirmUserRegistration(
    @Param('token') token: string,
  ): Promise<DefaultResponse<User>> {
    return this.authService.confirmUserRegistration(token);
  }

  @Throttle({
    default: {
      limit: 1,
      ttl: 60 * 1000,
    },
  })
  @Post('forgot-password')
  @ApiOperation({
    summary: 'Request password reset',
    description:
      'Sends a password reset email to the user with a link to reset their password.',
  })
  @ApiOkResponse({
    description: 'Password reset email sent successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Password reset email sent on user@mail.com',
        },
        statusCode: {
          type: 'number',
          example: HttpStatus.OK,
        },
      },
    },
  })
  @ApiCustomNotFoundResponse('User', 'email')
  public forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<DefaultResponse<null>> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password/:token')
  @ApiOperation({
    summary: 'Reset user password',
    description:
      'Resets the user password based on the provided reset token and new password.',
  })
  @ApiOkResponse({
    description: 'Password changed successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Password changed successfully',
        },
        statusCode: {
          type: 'number',
          example: HttpStatus.OK,
        },
      },
    },
  })
  @ApiCustomNotFoundResponse('User', 'id')
  @ApiCustomUnathorizedResponse()
  @ApiCustomBadRequestResponse(
    'Invalid token',
    'Your token is not valid or expired',
  )
  public resetPassword(
    @Param('token') token: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<DefaultResponse<null>> {
    return this.authService.resetPassword(
      token,
      resetPasswordDto,
    );
  }

  @Throttle({
    default: {
      limit: 1,
      ttl: 60 * 1000,
    },
  })
  @UseGuards(JwtAuthGuard)
  @Post('change-email')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change email.',
    description: 'This endpoint allows users to change their email.',
  })
  @ApiOkResponse({
    description: 'Email change success',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Email successfully changed',
        },
        statusCode: {
          type: 'number',
          example: HttpStatus.OK,
        },
      },
    },
  })
  @ApiCustomUnathorizedResponse()
  @ApiCustomBadRequestResponse('Invalid credentials', 'Invalid credentials')
  @ApiCustomNotFoundResponse('User', 'id')
  public changeUserEmail(
    @Req() req,
    @Body() changeEmailDto: ChangeEmailDto,
  ): Promise<DefaultResponse<null>> {
    return this.authService.initiateChangeUserEmail(
      req.user.id,
      changeEmailDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-email/:token')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change email.',
    description: 'This endpoint allows users to change their email.',
  })
  @ApiOkResponse({
    description: 'Email change success',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Email successfully changed',
        },
        statusCode: {
          type: 'number',
          example: HttpStatus.OK,
        },
      },
    },
  })
  @ApiCustomUnathorizedResponse()
  @ApiCustomNotFoundResponse('User', 'id')
  public confirmChangeUserEmail(
    @Param('token') token: string,
  ): Promise<DefaultResponse<null>> {
    return this.authService.confirmChangeUserEmail(token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change password.',
    description: 'This endpoint allows users to change their password.',
  })
  @ApiOkResponse({
    description: 'Password changed success',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Password successfully changed',
        },
        statusCode: {
          type: 'number',
          example: HttpStatus.OK,
        },
      },
    },
  })
  @ApiCustomUnathorizedResponse()
  @ApiCustomBadRequestResponse('Invalid credentials', 'Invalid credentials')
  @ApiCustomNotFoundResponse('User', 'id')
  public changeUserPassword(
    @Req() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<DefaultResponse<null>> {
    return this.authService.changeUserPassword(
      req.user.id,
      changePasswordDto,
    );
  }

  @Throttle({
    default: {
      limit: 1,
      ttl: 60 * 1000,
    },
  })
  @UseGuards(JwtAuthGuard)
  @Post('delete-profile')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete profile.',
    description: 'This endpoint allows users to delete their RHT profile.',
  })
  @ApiOkResponse({
    description: 'Link sent to the user email',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Link sent to your email',
        },
        statusCode: {
          type: 'number',
          example: HttpStatus.OK,
        },
      },
    },
  })
  @ApiCustomUnathorizedResponse()
  @ApiCustomNotFoundResponse('User', 'id')
  public initiateDeleteUser(
    @Req() req,
    @Body() userToDelete: { id: string },
  ): Promise<DefaultResponse<null>> {
    return this.authService.initiateUserDeletion(
      req.user,
      userToDelete.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('delete-profile/:token')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Confirm user deletion.',
    description: 'This endpoint allows users to confirm deleting RHT profile.',
  })
  @ApiOkResponse({
    description: 'Email change success',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Email successfully changed',
        },
        statusCode: {
          type: 'number',
          example: HttpStatus.OK,
        },
      },
    },
  })
  @ApiCustomUnathorizedResponse()
  @ApiCustomNotFoundResponse('User', 'id')
  public confirmDeleteUserProfile(
    @Param('token') token: string,
  ): Promise<DefaultResponse<null>> {
    return this.authService.confirmUserDeletion(token);
  }
}

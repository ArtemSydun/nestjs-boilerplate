import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { User } from 'src/user/entities/user.entity';

export class LoginUserDto {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class LoginUserResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'jwt token',
  })
  accessToken: string;

  @ApiProperty({
    description: 'User object that contains user data',
    type: User,
  })
  user: User;
}

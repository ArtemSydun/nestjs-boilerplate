import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class ContactUsDto {
  @ApiProperty({
    description: 'Email user contacting from',
    example: 'user@mail.com',
    required: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User mail subject',
    example: 'Login does not work',
    required: true,
  })
  @IsString()
  @MinLength(6)
  @MaxLength(52)
  subject: string;

  @ApiProperty({
    description: 'User mail text',
    example: 'Hello. Here is my message...',
    required: true,
  })
  @IsString()
  @MinLength(6)
  @MaxLength(2048)
  message: string;
}

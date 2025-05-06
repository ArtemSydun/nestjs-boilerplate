import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches } from 'class-validator';
import {
  PASSWORD_REGEX,
  PASSWORD_ERROR_MESSAGE,
} from 'src/common/constants/regex';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_ERROR_MESSAGE })
  password: string;
}

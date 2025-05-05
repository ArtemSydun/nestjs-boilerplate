import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, Matches } from 'class-validator';
import {
  PASSWORD_REGEX,
  PASSWORD_ERROR_MESSAGE,
} from 'src/common/constants/regex';

export class ChangeEmailDto {
  @ApiProperty()
  @IsEmail()
  readonly newEmail: string;

  @ApiProperty()
  @IsNotEmpty()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_ERROR_MESSAGE })
  readonly password: string;
}

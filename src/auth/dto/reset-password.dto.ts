import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Matches } from 'class-validator';
import {
  PASSWORD_ERROR_MESSAGE,
  PASSWORD_REGEX,
} from 'src/common/constants/regex';

export class ResetPasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_ERROR_MESSAGE })
  readonly newPassword: string;

  @ApiProperty()
  @IsNotEmpty()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_ERROR_MESSAGE })
  readonly repeatPassword: string;
}

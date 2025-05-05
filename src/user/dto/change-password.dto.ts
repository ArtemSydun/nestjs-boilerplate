import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Matches } from 'class-validator';
import {
  PASSWORD_REGEX,
  PASSWORD_ERROR_MESSAGE,
} from 'src/common/constants/regex';

export class ChangePasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_ERROR_MESSAGE })
  readonly oldPassword: string;

  @ApiProperty()
  @IsNotEmpty()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_ERROR_MESSAGE })
  readonly newPassword: string;
}

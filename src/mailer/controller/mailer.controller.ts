import {
  Controller,
  Post,
  Body,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';

import { Throttle } from '@nestjs/throttler';
import { DefaultResponse } from 'src/common/interfaces/responses';
import { ContactUsDto } from 'src/user/dto/contact-us.dto';
import { MailerService } from '../services/mailer.service';



@Controller('customers')
export class CustomersController {
  constructor(private readonly mailerService: MailerService) {}

  @Throttle({
    default: {
      limit: 1,
      ttl: 60 * 1000,
    },
  })
  @ApiOperation({
    summary: 'Contact us route for user emails',
    description: 'This endpoint sends a contact us form message.',
  })
  @ApiOkResponse({
    description: 'Contact us',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'Your message were sent to RHT team. We will send you a response in 12-48 hours',
        },
        statusCode: {
          type: 'number',
          example: HttpStatus.OK,
        },
      },
    },
  })
  @Post('contact-us')
  async contactUs(
    @Body() formBody: ContactUsDto,
  ): Promise<DefaultResponse<null>> {
    return await this.mailerService.contactUs(formBody);
  }
}

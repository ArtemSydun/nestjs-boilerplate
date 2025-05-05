/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Errors } from '../enums/errors.enum';

@Injectable()
export class ParseJsonPipe implements PipeTransform {
  constructor(
    private readonly dto: any,
    private readonly options?: { optional?: boolean },
  ) {}

  async transform(value: any, metadata: ArgumentMetadata) {
    // If value is empty and optional, just return undefined
    if (
      (value === undefined || value === null || value === '') &&
      this.options?.optional
    ) {
      return undefined;
    }

    let parsed;
    try {
      parsed = JSON.parse(value);
    } catch (err) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: ['Invalid JSON format'],
        error: Errors.BAD_REQUEST,
      });
    }

    const object = plainToInstance(this.dto, parsed);
    const errors = await validate(object);

    if (errors.length > 0) {
      const messages = errors.flatMap((error) =>
        Object.values(error.constraints || {}),
      );

      throw new BadRequestException({
        message: messages,
        statusCode: HttpStatus.BAD_REQUEST,
        error: Errors.BAD_REQUEST,
      });
    }

    return object;
  }
}

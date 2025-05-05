import { ApiProperty } from '@nestjs/swagger';

export class LocalePropDto<T = string> {
  @ApiProperty({
    description: 'Array of translated elements in English',
    example: ['SEO', 'Design', 'Elements'],
    required: true,
  })
  en: T;

  @ApiProperty({
    description: 'Array of translated elements in Ukrainian',
    example: ['SEO Оптимізація', 'Розробка дизайну', 'Інтерактивні елементи'],
    required: true,
  })
  uk: T;
}

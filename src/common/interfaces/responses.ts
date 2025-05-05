import { HttpStatus } from '@nestjs/common';

export interface DefaultResponse<T> {
  message: string;
  statusCode: HttpStatus;
  data?: T;
}

export interface DefaultPaginatedResponse<T> {
  total: number;
  totalPages: number;
  limitPerPage: number;
  currentPage: number;
  data?: T[];
}

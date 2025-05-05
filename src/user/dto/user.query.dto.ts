import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { CommonQueryParams } from 'src/common/dto/common.query.dto';
import { UserRoles } from 'src/user/enums/role.enum';

export enum UserOrderBy {
  CreatedAt = 'createdAt',
  UpdatedAt = 'updatedAt',
}

export class UserQueryDto extends CommonQueryParams {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ enum: UserRoles })
  @IsOptional()
  @IsString()
  role?: UserRoles;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: UserOrderBy,
  })
  @IsOptional()
  @IsEnum(UserOrderBy)
  orderBy?: UserOrderBy = UserOrderBy.CreatedAt;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  toDate?: string;
}

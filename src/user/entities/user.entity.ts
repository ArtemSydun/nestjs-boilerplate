import { randomUUID } from 'crypto';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { UserRoles } from '../enums/role.enum';

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @ApiProperty({
    description: 'Unique identifier for the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Prop({ default: () => randomUUID() })
  id: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
    required: true,
  })
  @Prop({ required: true })
  email: string;

  @ApiProperty({
    description: 'Role of the user in the application',
    example: 'user',
    enum: UserRoles,
    default: UserRoles.user,
  })
  @Prop({ type: String, enum: UserRoles, default: UserRoles.user })
  role: UserRoles;

  @Prop({ required: true })
  password: string;

  @ApiProperty({
    description: 'Date when the user was created',
    example: new Date(),
  })
  createdAt?: Date;

  @ApiProperty({
    description: 'Date when the user was last updated',
    example: new Date(),
  })
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DefaultPaginatedResponse } from 'src/common/interfaces/responses';
import { In, Repository } from 'typeorm';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserOrderBy, UserQueryDto } from '../dto/user.query.dto';
import { User } from '../entities/user.entity';
import { UserSearchPath } from '../enums/query.enum';
import { UserRoles } from '../enums/role.enum';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Bulk update logic is not a direct TypeORM feature like bulkWrite in Mongoose
  // but you can perform multiple updates in a loop or batch.
  public async bulkUpdateUsers(operations: any[]): Promise<any> {
    const updateResults = [];
    for (const operation of operations) {
      // Example: operation would be { id: 'some-id', updateData: {} }
      const updatedUser = await this.userRepository.update(
        operation.id,
        operation.updateData,
      );
      updateResults.push(updatedUser);
    }
    return updateResults;
  }

  public async findOneByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  public async findOneById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  public async findAdmins(): Promise<User[]> {
    return await this.userRepository.find({
      where: {
        role: In([UserRoles.admin, UserRoles.superadmin]),
      },
    });
  }

  public async findUserByProperty(
    path: UserSearchPath,
    value: any,
  ): Promise<User | null> {
    const query = {};
    if (Array.isArray(value)) {
      query[path] = In(value); // If the value is an array, use "IN" query
    } else {
      query[path] = value; // Otherwise, use exact match
    }
    return await this.userRepository.findOne({ where: query });
  }

  public async existsByEmail(email: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { email } });

    return user !== null;
  }

  public async updateById(
    id: string,
    updateData: Partial<User>,
  ): Promise<User | null> {
    await this.userRepository.update(id, updateData);
    return await this.userRepository.findOne({ where: { id } });
  }

  public async create(user: CreateUserDto): Promise<User> {
    const newUser = this.userRepository.create(user);
    return await this.userRepository.save(newUser);
  }

  public async delete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  public async getAll(
    filters: UserQueryDto,
  ): Promise<DefaultPaginatedResponse<User>> {
    const {
      order = 'desc',
      orderBy = UserOrderBy.CreatedAt,
      limit = 10,
      page = 1,
      email,
      role,
      date,
      fromDate,
      toDate,
    } = filters;
    
    const table = 'users';

    const perPage = limit;
    const offset = (page - 1) * perPage;

    const queryBuilder = this.userRepository.createQueryBuilder(table);

    if (email)
      queryBuilder.andWhere(`${table}.email LIKE :email`, { email: `%${email}%` });
    if (role) queryBuilder.andWhere('users.role = :role', { role });
    if (date && (fromDate || toDate)) {
      queryBuilder.andWhere(`${table}.date BETWEEN :fromDate AND :toDate`, {
        fromDate: new Date(fromDate),
        toDate: new Date(toDate),
      });
    }

    // Sort by the specified column
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
    queryBuilder.orderBy(`${table}.${orderBy}`, sortOrder);

    // Pagination: Skip and take for pagination
    queryBuilder.skip(offset).take(perPage);

    // Get the total count
    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      total,
      totalPages: Math.ceil(total / perPage),
      limitPerPage: +perPage,
      currentPage: page,
      data: users,
    };
  }

  public async getTotal(): Promise<number> {
    return await this.userRepository.count();
  }
}

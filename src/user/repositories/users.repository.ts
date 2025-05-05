import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DefaultPaginatedResponse } from 'src/common/interfaces/responses';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserOrderBy, UserQueryDto } from '../dto/user.query.dto';
import { User } from '../entities/user.entity';
import { UserSearchPath } from '../enums/query.enum';
import { UserRoles } from '../enums/role.enum';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name)
    private UserModel: Model<User>,
  ) {}

  public async bulkUpdateUsers(operations: any[]): Promise<any> {
    return await this.UserModel.bulkWrite(operations);
  }

  public async findOneByEmail(email: string): Promise<User> {
    return await this.UserModel.findOne({ email }).lean().exec();
  }

  public async findOneById(id: string): Promise<User> {
    return await this.UserModel.findOne({ id }).lean().exec();
  }

  public async findAdmins(): Promise<User[]> {
    return await this.UserModel.find({
      role: { $in: [UserRoles.admin, UserRoles.superadmin] },
    }).exec();
  }

  public async findUserByProperty(
    path: UserSearchPath,
    value: any,
  ): Promise<User> {
    const query = {};

    if (Array.isArray(value)) {
      query[path] = { $in: value }; // if the value is an array, use `$in`
    } else {
      query[path] = value; // otherwise, match the exact value
    }

    return await this.UserModel.findOne(query).lean().exec();
  }

  public async existsByEmail(email: string): Promise<boolean> {
    const user = await this.UserModel.findOne({ email }).lean().exec();
    return user !== null;
  }

  public async updateById(
    id: string,
    updateData: Partial<User>,
  ): Promise<User> {
    const updatedUser = await this.UserModel.findOneAndUpdate(
      { id },
      { $set: updateData },
      { new: true, lean: true },
    ).exec();

    delete updatedUser.password;
    return updatedUser;
  }

  public async create(user: CreateUserDto): Promise<User> {
    return await this.UserModel.create(user);
  }

  public async delete(id: string): Promise<void> {
    return await this.UserModel.findOneAndDelete({ id });
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
    const perPage = limit; // Elements per page
    const offset = (page - 1) * perPage; // Calculate skip amount

    const query: any = {};

    if (email) query.email = { $regex: email, $options: 'i' };
    if (role) query.role = role;
    if (date && (fromDate || toDate)) {
      query[date] = {}; // Dynamically assign the date field
      if (fromDate) query[date].$gte = new Date(fromDate);
      if (toDate) query[date].$lte = new Date(toDate);
    }

    // Define sorting
    const sortOrder = order === 'asc' ? 1 : -1;

    // Get total query count
    const total = await this.UserModel.countDocuments(query);

    // Fetch paginated results
    const users = await this.UserModel.find(query)
      .sort({ [orderBy]: sortOrder })
      .skip(offset)
      .limit(perPage)
      .lean();

    return {
      total,
      totalPages: Math.ceil(total / perPage),
      limitPerPage: +perPage,
      currentPage: +page,
      data: users,
    };
  }

  public async getTotal(): Promise<number> {
    return await this.UserModel.countDocuments();
  }
}

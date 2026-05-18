import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../../entities/user.entity';

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UpdatePasswordDto {
  currentPassword: string;
  newPassword: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(filters?: {
    role?: UserRole;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: User[]; total: number }> {
    const { role, isActive, search, page = 1, limit = 20 } = filters || {};

    const query = this.userRepository.createQueryBuilder('user');

    if (role) {
      query.andWhere('user.role = :role', { role });
    }

    if (isActive !== undefined) {
      query.andWhere('user.isActive = :isActive', { isActive });
    }

    if (search) {
      query.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    query.orderBy('user.createdAt', 'DESC');
    query.skip((page - 1) * limit).take(limit);

    const [data, total] = await query.getManyAndCount();

    // Remove sensitive fields
    const sanitized = data.map(({ passwordHash, refreshToken, ...user }) => user as User);
    return { data: sanitized, total };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email: email.toLowerCase() } });
  }

  async update(id: string, updateUserDto: UpdateUserDto, requestingUser: User): Promise<User> {
    const user = await this.findOne(id);

    // Only admin can change roles or deactivate users
    if (
      (updateUserDto.role !== undefined || updateUserDto.isActive !== undefined) &&
      requestingUser.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Only admin can change user roles or active status');
    }

    // Prevent self-demotion from admin
    if (
      id === requestingUser.id &&
      updateUserDto.role &&
      updateUserDto.role !== UserRole.ADMIN &&
      requestingUser.role === UserRole.ADMIN
    ) {
      throw new ForbiddenException('Admin cannot demote themselves');
    }

    Object.assign(user, updateUserDto);
    const updated = await this.userRepository.save(user);
    const { passwordHash, refreshToken, ...result } = updated as any;
    return result;
  }

  async updatePassword(id: string, updatePasswordDto: UpdatePasswordDto): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      updatePasswordDto.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new ForbiddenException('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(updatePasswordDto.newPassword, 12);
    await this.userRepository.update(id, { passwordHash: newPasswordHash, refreshToken: null });
  }

  async getExecutors(): Promise<User[]> {
    return this.userRepository.find({
      where: { role: UserRole.EXECUTOR, isActive: true },
      order: { firstName: 'ASC' },
    });
  }

  async getUserStats(userId: string): Promise<any> {
    const user = await this.findOne(userId);
    return {
      id: user.id,
      name: user.fullName,
      role: user.role,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }
}

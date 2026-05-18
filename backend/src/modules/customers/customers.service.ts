import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, ILike } from 'typeorm';
import { Customer } from '../../entities/customer.entity';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/create-customer.dto';

export interface CustomerFilterDto {
  search?: string;
  segment?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    // Check for duplicate email
    if (createCustomerDto.email) {
      const existing = await this.customerRepository.findOne({
        where: { email: createCustomerDto.email },
      });
      if (existing) {
        throw new ConflictException('Customer with this email already exists');
      }
    }

    const customer = this.customerRepository.create(createCustomerDto);
    return this.customerRepository.save(customer);
  }

  async findAll(
    filterDto: CustomerFilterDto,
  ): Promise<{ data: Customer[]; total: number; page: number; limit: number }> {
    const { search, segment, isActive, page = 1, limit = 20 } = filterDto;

    const query = this.customerRepository.createQueryBuilder('customer');

    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('customer.firstName ILIKE :search', { search: `%${search}%` })
            .orWhere('customer.lastName ILIKE :search', { search: `%${search}%` })
            .orWhere('customer.company ILIKE :search', { search: `%${search}%` })
            .orWhere('customer.email ILIKE :search', { search: `%${search}%` })
            .orWhere('customer.phone ILIKE :search', { search: `%${search}%` });
        }),
      );
    }

    if (segment) {
      query.andWhere('customer.segment = :segment', { segment });
    }

    if (isActive !== undefined) {
      query.andWhere('customer.isActive = :isActive', { isActive });
    }

    query.orderBy('customer.createdAt', 'DESC');
    query.skip((page - 1) * limit).take(limit);

    const [data, total] = await query.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['orders'],
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);

    if (updateCustomerDto.email && updateCustomerDto.email !== customer.email) {
      const existing = await this.customerRepository.findOne({
        where: { email: updateCustomerDto.email },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Customer with this email already exists');
      }
    }

    Object.assign(customer, updateCustomerDto);
    return this.customerRepository.save(customer);
  }

  async remove(id: string): Promise<void> {
    const customer = await this.findOne(id);
    await this.customerRepository.remove(customer);
  }

  async getStats(): Promise<any> {
    const [total, bySegment, topCustomers] = await Promise.all([
      this.customerRepository.count({ where: { isActive: true } }),
      this.customerRepository
        .createQueryBuilder('customer')
        .select('customer.segment', 'segment')
        .addSelect('COUNT(*)', 'count')
        .where('customer.isActive = true')
        .groupBy('customer.segment')
        .getRawMany(),
      this.customerRepository.find({
        where: { isActive: true },
        order: { totalRevenue: 'DESC' },
        take: 10,
      }),
    ]);

    return {
      total,
      bySegment: bySegment.reduce(
        (acc, row) => ({ ...acc, [row.segment]: Number(row.count) }),
        {},
      ),
      topCustomers,
    };
  }
}

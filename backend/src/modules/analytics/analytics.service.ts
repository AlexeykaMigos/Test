import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../../entities/order.entity';
import { User, UserRole } from '../../entities/user.entity';
import { Customer } from '../../entities/customer.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  async getDashboardStats(startDate?: Date, endDate?: Date) {
    const now = new Date();
    const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate || now;

    const [
      totalOrders,
      completedOrders,
      cancelledOrders,
      overdueOrders,
      revenue,
      newCustomers,
      activeExecutors,
    ] = await Promise.all([
      // Total orders in period
      this.orderRepository
        .createQueryBuilder('order')
        .where('order.createdAt BETWEEN :start AND :end', { start, end })
        .getCount(),

      // Completed orders
      this.orderRepository
        .createQueryBuilder('order')
        .where('order.status = :status', { status: OrderStatus.COMPLETED })
        .andWhere('order.completedAt BETWEEN :start AND :end', { start, end })
        .getCount(),

      // Cancelled orders
      this.orderRepository
        .createQueryBuilder('order')
        .where('order.status = :status', { status: OrderStatus.CANCELLED })
        .andWhere('order.createdAt BETWEEN :start AND :end', { start, end })
        .getCount(),

      // Overdue orders
      this.orderRepository
        .createQueryBuilder('order')
        .where('order.deadline IS NOT NULL')
        .andWhere('order.deadline < :now', { now })
        .andWhere('order.status NOT IN (:...statuses)', {
          statuses: [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.DELIVERED],
        })
        .getCount(),

      // Total revenue from completed orders
      this.orderRepository
        .createQueryBuilder('order')
        .select('COALESCE(SUM(order.totalAmount), 0)', 'total')
        .where('order.status = :status', { status: OrderStatus.COMPLETED })
        .andWhere('order.completedAt BETWEEN :start AND :end', { start, end })
        .getRawOne(),

      // New customers
      this.customerRepository
        .createQueryBuilder('customer')
        .where('customer.createdAt BETWEEN :start AND :end', { start, end })
        .getCount(),

      // Active executors
      this.userRepository.count({
        where: { role: UserRole.EXECUTOR, isActive: true },
      }),
    ]);

    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    return {
      period: { start, end },
      orders: {
        total: totalOrders,
        completed: completedOrders,
        cancelled: cancelledOrders,
        overdue: overdueOrders,
        completionRate: Math.round(completionRate * 100) / 100,
      },
      revenue: {
        total: Number(revenue?.total || 0),
        currency: 'USD',
      },
      customers: {
        new: newCustomers,
      },
      executors: {
        active: activeExecutors,
      },
    };
  }

  async getOrdersCount(
    groupBy: 'day' | 'week' | 'month' = 'day',
    startDate?: Date,
    endDate?: Date,
  ) {
    const now = new Date();
    const start = startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || now;

    let dateFormat: string;
    switch (groupBy) {
      case 'week':
        dateFormat = 'YYYY-IW';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
    }

    const results = await this.orderRepository
      .createQueryBuilder('order')
      .select(`TO_CHAR(order.createdAt, '${dateFormat}')`, 'date')
      .addSelect('COUNT(*)', 'total')
      .addSelect(
        `SUM(CASE WHEN order.status = 'completed' THEN 1 ELSE 0 END)`,
        'completed',
      )
      .addSelect(
        `SUM(CASE WHEN order.status = 'cancelled' THEN 1 ELSE 0 END)`,
        'cancelled',
      )
      .where('order.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy(`TO_CHAR(order.createdAt, '${dateFormat}')`)
      .orderBy(`TO_CHAR(order.createdAt, '${dateFormat}')`, 'ASC')
      .getRawMany();

    return results.map((r) => ({
      date: r.date,
      total: Number(r.total),
      completed: Number(r.completed),
      cancelled: Number(r.cancelled),
    }));
  }

  async getRevenue(
    groupBy: 'day' | 'week' | 'month' = 'month',
    startDate?: Date,
    endDate?: Date,
  ) {
    const now = new Date();
    const start = startDate || new Date(now.getFullYear(), 0, 1);
    const end = endDate || now;

    let dateFormat: string;
    switch (groupBy) {
      case 'week':
        dateFormat = 'YYYY-IW';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
    }

    const results = await this.orderRepository
      .createQueryBuilder('order')
      .select(`TO_CHAR(order.completedAt, '${dateFormat}')`, 'date')
      .addSelect('COALESCE(SUM(order.totalAmount), 0)', 'revenue')
      .addSelect('COUNT(*)', 'orderCount')
      .where('order.status = :status', { status: OrderStatus.COMPLETED })
      .andWhere('order.completedAt BETWEEN :start AND :end', { start, end })
      .groupBy(`TO_CHAR(order.completedAt, '${dateFormat}')`)
      .orderBy(`TO_CHAR(order.completedAt, '${dateFormat}')`, 'ASC')
      .getRawMany();

    return results.map((r) => ({
      date: r.date,
      revenue: Number(r.revenue),
      orderCount: Number(r.orderCount),
    }));
  }

  async getAvgProcessingTime(startDate?: Date, endDate?: Date) {
    const now = new Date();
    const start = startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || now;

    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select(
        'AVG(EXTRACT(EPOCH FROM (order.completedAt - order.acceptedAt)) / 3600)',
        'avgHours',
      )
      .addSelect(
        'MIN(EXTRACT(EPOCH FROM (order.completedAt - order.acceptedAt)) / 3600)',
        'minHours',
      )
      .addSelect(
        'MAX(EXTRACT(EPOCH FROM (order.completedAt - order.acceptedAt)) / 3600)',
        'maxHours',
      )
      .addSelect('COUNT(*)', 'count')
      .where('order.status = :status', { status: OrderStatus.COMPLETED })
      .andWhere('order.acceptedAt IS NOT NULL')
      .andWhere('order.completedAt BETWEEN :start AND :end', { start, end })
      .getRawOne();

    return {
      period: { start, end },
      avgProcessingTimeHours: result?.avgHours ? Math.round(Number(result.avgHours) * 100) / 100 : 0,
      minProcessingTimeHours: result?.minHours ? Math.round(Number(result.minHours) * 100) / 100 : 0,
      maxProcessingTimeHours: result?.maxHours ? Math.round(Number(result.maxHours) * 100) / 100 : 0,
      completedOrdersCount: Number(result?.count || 0),
    };
  }

  async getEmployeeEfficiency(startDate?: Date, endDate?: Date) {
    const now = new Date();
    const start = startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || now;

    const results = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.executor', 'executor')
      .select('executor.id', 'executorId')
      .addSelect(
        `CONCAT(executor.firstName, ' ', executor.lastName)`,
        'executorName',
      )
      .addSelect('COUNT(*)', 'totalOrders')
      .addSelect(
        `SUM(CASE WHEN order.status = 'completed' THEN 1 ELSE 0 END)`,
        'completedOrders',
      )
      .addSelect(
        `SUM(CASE WHEN order.status = 'cancelled' THEN 1 ELSE 0 END)`,
        'cancelledOrders',
      )
      .addSelect(
        'AVG(EXTRACT(EPOCH FROM (order.completedAt - order.acceptedAt)) / 3600)',
        'avgProcessingHours',
      )
      .addSelect('COALESCE(SUM(order.totalAmount), 0)', 'totalRevenue')
      .where('order.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('executor.id IS NOT NULL')
      .groupBy('executor.id')
      .addGroupBy('executor.firstName')
      .addGroupBy('executor.lastName')
      .orderBy('completedOrders', 'DESC')
      .getRawMany();

    return results.map((r) => ({
      executorId: r.executorId,
      executorName: r.executorName,
      totalOrders: Number(r.totalOrders),
      completedOrders: Number(r.completedOrders),
      cancelledOrders: Number(r.cancelledOrders),
      completionRate:
        Number(r.totalOrders) > 0
          ? Math.round((Number(r.completedOrders) / Number(r.totalOrders)) * 10000) / 100
          : 0,
      avgProcessingHours: r.avgProcessingHours
        ? Math.round(Number(r.avgProcessingHours) * 100) / 100
        : 0,
      totalRevenue: Number(r.totalRevenue),
    }));
  }

  async getOverdueOrders() {
    const now = new Date();

    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.executor', 'executor')
      .where('order.deadline IS NOT NULL')
      .andWhere('order.deadline < :now', { now })
      .andWhere('order.status NOT IN (:...statuses)', {
        statuses: [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.DELIVERED],
      })
      .orderBy('order.deadline', 'ASC')
      .getMany();

    return {
      count: orders.length,
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        priority: order.priority,
        deadline: order.deadline,
        overdueByHours: Math.round((now.getTime() - order.deadline.getTime()) / (1000 * 60 * 60)),
        customer: order.customer
          ? {
              id: order.customer.id,
              name: order.customer.fullName,
              company: order.customer.company,
            }
          : null,
        executor: order.executor
          ? { id: order.executor.id, name: order.executor.fullName }
          : null,
      })),
    };
  }

  async getStatusDistribution() {
    const results = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.status')
      .getRawMany();

    return results.map((r) => ({
      status: r.status,
      count: Number(r.count),
    }));
  }

  async getPriorityDistribution() {
    const results = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .where('order.status NOT IN (:...statuses)', {
        statuses: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      })
      .groupBy('order.priority')
      .getRawMany();

    return results.map((r) => ({
      priority: r.priority,
      count: Number(r.count),
    }));
  }
}

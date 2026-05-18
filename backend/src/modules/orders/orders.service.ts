import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets } from 'typeorm';
import {
  Order,
  OrderStatus,
  OrderPriority,
  STATUS_TRANSITIONS,
} from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { OrderHistory } from '../../entities/order-history.entity';
import { User, UserRole } from '../../entities/user.entity';
import { Customer } from '../../entities/customer.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto, ChangeStatusDto, AssignExecutorDto } from './dto/update-order.dto';
import { FilterOrderDto } from './dto/filter-order.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../entities/notification.entity';

export enum AssignmentAlgorithm {
  ROUND_ROBIN = 'round_robin',
  MIN_LOAD = 'min_load',
  PRIORITY = 'priority',
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private roundRobinIndex = 0;

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(OrderHistory)
    private orderHistoryRepository: Repository<OrderHistory>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    private notificationsService: NotificationsService,
  ) {}

  async create(createOrderDto: CreateOrderDto, createdByUser: User): Promise<Order> {
    // Validate customer if provided
    if (createOrderDto.customerId) {
      const customer = await this.customerRepository.findOne({
        where: { id: createOrderDto.customerId, isActive: true },
      });
      if (!customer) {
        throw new NotFoundException(`Customer with ID ${createOrderDto.customerId} not found`);
      }
    }

    // Validate executor if provided
    if (createOrderDto.executorId) {
      const executor = await this.userRepository.findOne({
        where: { id: createOrderDto.executorId, isActive: true, role: UserRole.EXECUTOR },
      });
      if (!executor) {
        throw new NotFoundException(`Executor with ID ${createOrderDto.executorId} not found`);
      }
    }

    // Calculate total amount
    let totalAmount = 0;
    if (createOrderDto.items && createOrderDto.items.length > 0) {
      totalAmount = createOrderDto.items.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0,
      );
    }

    const order = this.orderRepository.create({
      priority: createOrderDto.priority || OrderPriority.MEDIUM,
      comment: createOrderDto.comment,
      description: createOrderDto.description,
      deadline: createOrderDto.deadline ? new Date(createOrderDto.deadline) : undefined,
      customerId: createOrderDto.customerId,
      executorId: createOrderDto.executorId,
      managerId: createdByUser.role === UserRole.MANAGER ? createdByUser.id : undefined,
      totalAmount,
      status: createOrderDto.executorId ? OrderStatus.ASSIGNED : OrderStatus.NEW,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Save order items
    if (createOrderDto.items && createOrderDto.items.length > 0) {
      const items = createOrderDto.items.map((itemDto) =>
        this.orderItemRepository.create({
          ...itemDto,
          orderId: savedOrder.id,
        }),
      );
      await this.orderItemRepository.save(items);
    }

    // Create history entry
    await this.createHistoryEntry(
      savedOrder.id,
      createdByUser.id,
      'ORDER_CREATED',
      null,
      savedOrder.status,
      { orderNumber: savedOrder.orderNumber },
    );

    // Update customer stats
    if (createOrderDto.customerId) {
      await this.customerRepository.increment(
        { id: createOrderDto.customerId },
        'totalOrders',
        1,
      );
    }

    // Send notification to assigned executor
    if (savedOrder.executorId) {
      await this.notificationsService.create({
        userId: savedOrder.executorId,
        type: NotificationType.ORDER_ASSIGNED,
        title: 'New order assigned to you',
        message: `Order ${savedOrder.orderNumber} has been assigned to you`,
        referenceId: savedOrder.id,
        referenceType: 'order',
      });
    }

    return this.findOne(savedOrder.id);
  }

  async findAll(
    filterDto: FilterOrderDto,
    currentUser: User,
  ): Promise<{ data: Order[]; total: number; page: number; limit: number }> {
    const {
      status,
      priority,
      customerId,
      executorId,
      search,
      dateFrom,
      dateTo,
      isOverdue,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filterDto;

    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.executor', 'executor')
      .leftJoinAndSelect('order.items', 'items');

    // Role-based filtering: executors only see their orders
    if (currentUser.role === UserRole.EXECUTOR) {
      query.andWhere('order.executorId = :userId', { userId: currentUser.id });
    } else if (currentUser.role === UserRole.CLIENT) {
      // Clients see orders linked to their customer profile
      const customer = await this.customerRepository.findOne({
        where: { email: currentUser.email },
      });
      if (customer) {
        query.andWhere('order.customerId = :customerId', { customerId: customer.id });
      } else {
        return { data: [], total: 0, page, limit };
      }
    }

    if (status) {
      query.andWhere('order.status = :status', { status });
    }

    if (priority) {
      query.andWhere('order.priority = :priority', { priority });
    }

    if (customerId) {
      query.andWhere('order.customerId = :customerId', { customerId });
    }

    if (executorId) {
      query.andWhere('order.executorId = :executorId', { executorId });
    }

    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('order.orderNumber ILIKE :search', { search: `%${search}%` })
            .orWhere('order.comment ILIKE :search', { search: `%${search}%` })
            .orWhere('order.description ILIKE :search', { search: `%${search}%` })
            .orWhere('customer.firstName ILIKE :search', { search: `%${search}%` })
            .orWhere('customer.lastName ILIKE :search', { search: `%${search}%` })
            .orWhere('customer.company ILIKE :search', { search: `%${search}%` });
        }),
      );
    }

    if (dateFrom) {
      query.andWhere('order.createdAt >= :dateFrom', { dateFrom: new Date(dateFrom) });
    }

    if (dateTo) {
      query.andWhere('order.createdAt <= :dateTo', { dateTo: new Date(dateTo) });
    }

    if (isOverdue === true || isOverdue === 'true' as any) {
      query.andWhere('order.deadline IS NOT NULL')
        .andWhere('order.deadline < :now', { now: new Date() })
        .andWhere('order.status NOT IN (:...terminalStatuses)', {
          terminalStatuses: [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.DELIVERED],
        });
    }

    // Validate sort field to prevent SQL injection
    const allowedSortFields = ['createdAt', 'updatedAt', 'deadline', 'totalAmount', 'priority', 'status', 'orderNumber'];
    const actualSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    query.orderBy(`order.${actualSortBy}`, sortOrder);
    query.skip((page - 1) * limit).take(limit);

    const [data, total] = await query.getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['customer', 'executor', 'manager', 'items', 'history', 'history.user'],
      order: { history: { createdAt: 'DESC' } },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderNumber },
      relations: ['customer', 'executor', 'items'],
    });

    if (!order) {
      throw new NotFoundException(`Order with number ${orderNumber} not found`);
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto, currentUser: User): Promise<Order> {
    const order = await this.findOne(id);

    // Permission check
    if (currentUser.role === UserRole.EXECUTOR && order.executorId !== currentUser.id) {
      throw new ForbiddenException('You can only update orders assigned to you');
    }

    // Status transition validation
    if (updateOrderDto.status && updateOrderDto.status !== order.status) {
      this.validateStatusTransition(order.status, updateOrderDto.status);
    }

    const oldStatus = order.status;
    const changes: Record<string, { old: any; new: any }> = {};

    // Track changes
    if (updateOrderDto.status && updateOrderDto.status !== order.status) {
      changes.status = { old: order.status, new: updateOrderDto.status };
    }
    if (updateOrderDto.priority && updateOrderDto.priority !== order.priority) {
      changes.priority = { old: order.priority, new: updateOrderDto.priority };
    }
    if (updateOrderDto.executorId && updateOrderDto.executorId !== order.executorId) {
      changes.executor = { old: order.executorId, new: updateOrderDto.executorId };
    }

    // Apply updates
    Object.assign(order, {
      ...(updateOrderDto.status && { status: updateOrderDto.status }),
      ...(updateOrderDto.priority && { priority: updateOrderDto.priority }),
      ...(updateOrderDto.comment !== undefined && { comment: updateOrderDto.comment }),
      ...(updateOrderDto.description !== undefined && { description: updateOrderDto.description }),
      ...(updateOrderDto.deadline && { deadline: new Date(updateOrderDto.deadline) }),
      ...(updateOrderDto.executorId !== undefined && { executorId: updateOrderDto.executorId }),
      ...(updateOrderDto.customerId !== undefined && { customerId: updateOrderDto.customerId }),
    });

    // Handle status-specific timestamps
    if (updateOrderDto.status === OrderStatus.ACCEPTED && !order.acceptedAt) {
      order.acceptedAt = new Date();
    }
    if (updateOrderDto.status === OrderStatus.COMPLETED && !order.completedAt) {
      order.completedAt = new Date();
    }
    if (updateOrderDto.status === OrderStatus.CANCELLED && !order.cancelledAt) {
      order.cancelledAt = new Date();
      order.cancellationReason = updateOrderDto.cancellationReason;
    }

    const updatedOrder = await this.orderRepository.save(order);

    // Create history entries for changes
    for (const [field, change] of Object.entries(changes)) {
      await this.createHistoryEntry(
        id,
        currentUser.id,
        `${field.toUpperCase()}_CHANGED`,
        String(change.old),
        String(change.new),
        { field },
      );
    }

    // Send notifications for status changes
    if (changes.status) {
      await this.sendStatusChangeNotifications(updatedOrder, oldStatus, currentUser);
    }

    // Send notification for executor assignment
    if (changes.executor && updateOrderDto.executorId) {
      await this.notificationsService.create({
        userId: updateOrderDto.executorId,
        type: NotificationType.ORDER_ASSIGNED,
        title: 'Order assigned to you',
        message: `Order ${order.orderNumber} has been assigned to you`,
        referenceId: id,
        referenceType: 'order',
      });
    }

    // Update customer revenue if completed
    if (updateOrderDto.status === OrderStatus.COMPLETED && order.customerId) {
      await this.customerRepository.increment(
        { id: order.customerId },
        'totalRevenue',
        Number(order.totalAmount),
      );
    }

    return this.findOne(id);
  }

  async changeStatus(id: string, changeStatusDto: ChangeStatusDto, currentUser: User): Promise<Order> {
    const order = await this.findOne(id);

    this.validateStatusTransition(order.status, changeStatusDto.status);

    const oldStatus = order.status;
    order.status = changeStatusDto.status;

    if (changeStatusDto.status === OrderStatus.ACCEPTED && !order.acceptedAt) {
      order.acceptedAt = new Date();
    }
    if (changeStatusDto.status === OrderStatus.COMPLETED) {
      order.completedAt = new Date();
    }
    if (changeStatusDto.status === OrderStatus.CANCELLED) {
      order.cancelledAt = new Date();
    }

    await this.orderRepository.save(order);

    await this.createHistoryEntry(
      id,
      currentUser.id,
      'STATUS_CHANGED',
      oldStatus,
      changeStatusDto.status,
      { comment: changeStatusDto.comment },
    );

    await this.sendStatusChangeNotifications(order, oldStatus, currentUser);

    return this.findOne(id);
  }

  async assignExecutor(id: string, assignDto: AssignExecutorDto, currentUser: User): Promise<Order> {
    const order = await this.findOne(id);

    const executor = await this.userRepository.findOne({
      where: { id: assignDto.executorId, isActive: true },
    });

    if (!executor) {
      throw new NotFoundException(`Executor with ID ${assignDto.executorId} not found`);
    }

    if (executor.role !== UserRole.EXECUTOR && executor.role !== UserRole.MANAGER) {
      throw new BadRequestException('User must have executor or manager role to be assigned');
    }

    const oldExecutorId = order.executorId;
    order.executorId = assignDto.executorId;

    // Auto advance status to ASSIGNED if applicable
    if (order.status === OrderStatus.NEW || order.status === OrderStatus.ACCEPTED || order.status === OrderStatus.PROCESSING) {
      order.status = OrderStatus.ASSIGNED;
    }

    await this.orderRepository.save(order);

    await this.createHistoryEntry(
      id,
      currentUser.id,
      'EXECUTOR_ASSIGNED',
      oldExecutorId,
      assignDto.executorId,
      { note: assignDto.note, executorName: executor.fullName },
    );

    await this.notificationsService.create({
      userId: assignDto.executorId,
      type: NotificationType.ORDER_ASSIGNED,
      title: 'Order assigned to you',
      message: `Order ${order.orderNumber} has been assigned to you. ${assignDto.note ? 'Note: ' + assignDto.note : ''}`,
      referenceId: id,
      referenceType: 'order',
    });

    return this.findOne(id);
  }

  async autoAssign(id: string, algorithm: AssignmentAlgorithm, currentUser: User): Promise<Order> {
    const order = await this.findOne(id);
    const executors = await this.userRepository.find({
      where: { role: UserRole.EXECUTOR, isActive: true },
    });

    if (executors.length === 0) {
      throw new BadRequestException('No active executors available for assignment');
    }

    let selectedExecutor: User;

    switch (algorithm) {
      case AssignmentAlgorithm.ROUND_ROBIN:
        selectedExecutor = await this.assignRoundRobin(executors);
        break;
      case AssignmentAlgorithm.MIN_LOAD:
        selectedExecutor = await this.assignMinLoad(executors);
        break;
      case AssignmentAlgorithm.PRIORITY:
        selectedExecutor = await this.assignByPriority(executors, order.priority);
        break;
      default:
        selectedExecutor = await this.assignMinLoad(executors);
    }

    return this.assignExecutor(id, { executorId: selectedExecutor.id, note: `Auto-assigned via ${algorithm}` }, currentUser);
  }

  private async assignRoundRobin(executors: User[]): Promise<User> {
    const executor = executors[this.roundRobinIndex % executors.length];
    this.roundRobinIndex = (this.roundRobinIndex + 1) % executors.length;
    return executor;
  }

  private async assignMinLoad(executors: User[]): Promise<User> {
    const activeStatuses = [
      OrderStatus.NEW, OrderStatus.ACCEPTED, OrderStatus.PROCESSING,
      OrderStatus.ASSIGNED, OrderStatus.IN_PROGRESS, OrderStatus.READY,
    ];

    const executorLoads = await Promise.all(
      executors.map(async (executor) => {
        const count = await this.orderRepository.count({
          where: {
            executorId: executor.id,
            status: activeStatuses[0] as any,
          },
        });
        // Count all active orders for this executor
        const activeCount = await this.orderRepository
          .createQueryBuilder('order')
          .where('order.executorId = :executorId', { executorId: executor.id })
          .andWhere('order.status IN (:...statuses)', { statuses: activeStatuses })
          .getCount();

        return { executor, load: activeCount };
      }),
    );

    executorLoads.sort((a, b) => a.load - b.load);
    return executorLoads[0].executor;
  }

  private async assignByPriority(executors: User[], orderPriority: OrderPriority): Promise<User> {
    // For urgent/high priority orders, pick the executor with least load
    if (orderPriority === OrderPriority.URGENT || orderPriority === OrderPriority.HIGH) {
      return this.assignMinLoad(executors);
    }
    // For medium/low priority, use round robin
    return this.assignRoundRobin(executors);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const order = await this.findOne(id);

    if (![OrderStatus.NEW, OrderStatus.CANCELLED].includes(order.status)) {
      throw new BadRequestException('Only new or cancelled orders can be deleted');
    }

    if (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.MANAGER) {
      throw new ForbiddenException('Only admin or manager can delete orders');
    }

    await this.orderRepository.remove(order);
    this.logger.log(`Order ${order.orderNumber} deleted by ${currentUser.email}`);
  }

  async getHistory(orderId: string): Promise<OrderHistory[]> {
    await this.findOne(orderId); // Validate order exists

    return this.orderHistoryRepository.find({
      where: { orderId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getStats(userId?: string): Promise<any> {
    const baseQuery = this.orderRepository.createQueryBuilder('order');

    if (userId) {
      baseQuery.where('order.executorId = :userId', { userId });
    }

    const [total, byStatus, overdue] = await Promise.all([
      baseQuery.getCount(),
      this.orderRepository
        .createQueryBuilder('order')
        .select('order.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('order.status')
        .getRawMany(),
      this.orderRepository
        .createQueryBuilder('order')
        .where('order.deadline IS NOT NULL')
        .andWhere('order.deadline < :now', { now: new Date() })
        .andWhere('order.status NOT IN (:...statuses)', {
          statuses: [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.DELIVERED],
        })
        .getCount(),
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc, row) => ({ ...acc, [row.status]: Number(row.count) }), {}),
      overdue,
    };
  }

  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus];

    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'. ` +
        `Allowed transitions: ${allowedTransitions.join(', ') || 'none'}`,
      );
    }
  }

  private async createHistoryEntry(
    orderId: string,
    userId: string,
    action: string,
    oldValue: string | null,
    newValue: string | null,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const history = this.orderHistoryRepository.create({
      orderId,
      userId,
      action,
      oldValue,
      newValue,
      metadata,
    });
    await this.orderHistoryRepository.save(history);
  }

  private async sendStatusChangeNotifications(
    order: Order,
    oldStatus: OrderStatus,
    changedBy: User,
  ): Promise<void> {
    const notifications: Array<{ userId: string; type: NotificationType; title: string; message: string }> = [];

    // Notify executor on status change
    if (order.executorId && order.executorId !== changedBy.id) {
      notifications.push({
        userId: order.executorId,
        type: NotificationType.ORDER_STATUS_CHANGED,
        title: 'Order status updated',
        message: `Order ${order.orderNumber} status changed from ${oldStatus} to ${order.status}`,
      });
    }

    // Notify manager
    if (order.managerId && order.managerId !== changedBy.id) {
      notifications.push({
        userId: order.managerId,
        type: NotificationType.ORDER_STATUS_CHANGED,
        title: 'Order status updated',
        message: `Order ${order.orderNumber} status changed from ${oldStatus} to ${order.status}`,
      });
    }

    await Promise.all(
      notifications.map((n) =>
        this.notificationsService.create({
          ...n,
          referenceId: order.id,
          referenceType: 'order',
        }),
      ),
    );
  }
}

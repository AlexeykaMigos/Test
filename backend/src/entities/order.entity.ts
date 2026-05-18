import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  BeforeInsert,
} from 'typeorm';
import { User } from './user.entity';
import { Customer } from './customer.entity';
import { OrderItem } from './order-item.entity';
import { OrderHistory } from './order-history.entity';

export enum OrderStatus {
  NEW = 'new',
  ACCEPTED = 'accepted',
  PROCESSING = 'processing',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  READY = 'ready',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum OrderPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

// Valid status transitions
export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.NEW]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
  [OrderStatus.ACCEPTED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
  [OrderStatus.ASSIGNED]: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
  [OrderStatus.IN_PROGRESS]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

@Entity('orders')
@Index(['orderNumber'], { unique: true })
@Index(['status'])
@Index(['customerId'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_number', unique: true, length: 50 })
  orderNumber: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.NEW,
  })
  @Index()
  status: OrderStatus;

  @Column({
    type: 'enum',
    enum: OrderPriority,
    default: OrderPriority.MEDIUM,
  })
  priority: OrderPriority;

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalAmount: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'deadline', type: 'timestamp', nullable: true })
  deadline: Date;

  @Column({ name: 'accepted_at', type: 'timestamp', nullable: true })
  acceptedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ name: 'customer_id', nullable: true })
  customerId: string;

  @Column({ name: 'executor_id', nullable: true })
  executorId: string;

  @Column({ name: 'manager_id', nullable: true })
  managerId: string;

  @ManyToOne(() => Customer, (customer) => customer.orders, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => User, (user) => user.assignedOrders, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'executor_id' })
  executor: User;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'manager_id' })
  manager: User;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
    eager: false,
  })
  items: OrderItem[];

  @OneToMany(() => OrderHistory, (history) => history.order, { cascade: true })
  history: OrderHistory[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  generateOrderNumber() {
    if (!this.orderNumber) {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
      this.orderNumber = `ORD-${year}${month}${day}-${random}`;
    }
  }

  get isOverdue(): boolean {
    if (!this.deadline) return false;
    const terminalStatuses = [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.DELIVERED];
    if (terminalStatuses.includes(this.status)) return false;
    return new Date() > this.deadline;
  }

  get processingTimeHours(): number | null {
    if (!this.acceptedAt) return null;
    const endTime = this.completedAt || new Date();
    return (endTime.getTime() - this.acceptedAt.getTime()) / (1000 * 60 * 60);
  }
}

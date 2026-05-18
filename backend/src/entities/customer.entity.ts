import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Order } from './order.entity';

export enum CustomerSegment {
  VIP = 'vip',
  REGULAR = 'regular',
  NEW = 'new',
  INACTIVE = 'inactive',
}

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ length: 200, nullable: true })
  company: string;

  @Column({ length: 20, nullable: true })
  @Index()
  phone: string;

  @Column({ length: 255, nullable: true })
  @Index()
  email: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({
    type: 'enum',
    enum: CustomerSegment,
    default: CustomerSegment.NEW,
  })
  segment: CustomerSegment;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'total_orders', default: 0 })
  totalOrders: number;

  @Column({
    name: 'total_revenue',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalRevenue: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[];

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

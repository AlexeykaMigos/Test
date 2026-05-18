import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Order } from './order.entity';
import { Notification } from './notification.entity';
import { OrderHistory } from './order-history.entity';

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EXECUTOR = 'executor',
  CLIENT = 'client',
}

@Entity('users')
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ unique: true, length: 255 })
  @Index()
  email: string;

  @Column({ name: 'password_hash' })
  @Exclude()
  passwordHash: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.EXECUTOR,
  })
  role: UserRole;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'refresh_token', nullable: true })
  @Exclude()
  refreshToken: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Order, (order) => order.executor)
  assignedOrders: Order[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => OrderHistory, (history) => history.user)
  orderHistories: OrderHistory[];

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

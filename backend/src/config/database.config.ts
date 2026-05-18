import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Customer } from '../entities/customer.entity';
import { OrderHistory } from '../entities/order-history.entity';
import { Notification } from '../entities/notification.entity';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 5432),
  username: configService.get<string>('DB_USERNAME', 'orderflow'),
  password: configService.get<string>('DB_PASSWORD', 'orderflow_pass'),
  database: configService.get<string>('DB_NAME', 'orderflow'),
  entities: [User, Order, OrderItem, Customer, OrderHistory, Notification],
  synchronize: configService.get<string>('NODE_ENV') !== 'production',
  logging: configService.get<string>('NODE_ENV') === 'development',
  ssl:
    configService.get<string>('DB_SSL') === 'true'
      ? { rejectUnauthorized: false }
      : false,
  poolSize: 10,
  connectTimeoutMS: 10000,
});

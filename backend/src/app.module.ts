import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthModule } from './modules/auth/auth.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CustomersModule } from './modules/customers/customers.module';
import { UsersModule } from './modules/users/users.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AdminModule } from './modules/admin/admin.module';
import { getDatabaseConfig } from './config/database.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),

    // Cache (Redis)
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: await import('cache-manager-ioredis-yet').then((m) =>
          m.redisInsStore({
            host: configService.get('REDIS_HOST', 'localhost'),
            port: configService.get<number>('REDIS_PORT', 6379),
            password: configService.get('REDIS_PASSWORD', ''),
          }),
        ),
        ttl: 300,
      }),
    }),

    // Feature modules
    AuthModule,
    OrdersModule,
    CustomersModule,
    UsersModule,
    NotificationsModule,
    AnalyticsModule,
    AdminModule,
  ],
})
export class AppModule {}

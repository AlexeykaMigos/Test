import { IsOptional, IsEnum, IsUUID, IsDateString, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, OrderPriority } from '../../../entities/order.entity';

export class FilterOrderDto {
  @ApiPropertyOptional({ enum: OrderStatus, description: 'Filter by order status' })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ enum: OrderPriority, description: 'Filter by priority' })
  @IsOptional()
  @IsEnum(OrderPriority)
  priority?: OrderPriority;

  @ApiPropertyOptional({ description: 'Filter by customer ID' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Filter by executor ID' })
  @IsOptional()
  @IsUUID()
  executorId?: string;

  @ApiPropertyOptional({ description: 'Search in order number, comment, description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter from date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter to date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Filter overdue orders only', type: Boolean })
  @IsOptional()
  isOverdue?: boolean;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort field', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort direction', enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

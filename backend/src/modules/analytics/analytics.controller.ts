import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('analytics')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiQuery({ name: 'startDate', required: false, description: 'ISO 8601 date string' })
  @ApiQuery({ name: 'endDate', required: false, description: 'ISO 8601 date string' })
  @ApiResponse({ status: 200, description: 'Returns dashboard statistics' })
  async getDashboardStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getDashboardStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('orders-count')
  @ApiOperation({ summary: 'Get orders count grouped by time period' })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['day', 'week', 'month'] })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'Returns time-series orders count data' })
  async getOrdersCount(
    @Query('groupBy') groupBy: 'day' | 'week' | 'month' = 'day',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getOrdersCount(
      groupBy,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue analytics grouped by time period' })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['day', 'week', 'month'] })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'Returns time-series revenue data' })
  async getRevenue(
    @Query('groupBy') groupBy: 'day' | 'week' | 'month' = 'month',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getRevenue(
      groupBy,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('processing-time')
  @ApiOperation({ summary: 'Get average order processing time statistics' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'Returns processing time statistics' })
  async getAvgProcessingTime(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getAvgProcessingTime(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('employee-efficiency')
  @ApiOperation({ summary: 'Get employee efficiency metrics' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'Returns employee efficiency data' })
  async getEmployeeEfficiency(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getEmployeeEfficiency(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('overdue-orders')
  @ApiOperation({ summary: 'Get all currently overdue orders' })
  @ApiResponse({ status: 200, description: 'Returns list of overdue orders' })
  async getOverdueOrders() {
    return this.analyticsService.getOverdueOrders();
  }

  @Get('status-distribution')
  @ApiOperation({ summary: 'Get order status distribution' })
  @ApiResponse({ status: 200, description: 'Returns order count by status' })
  async getStatusDistribution() {
    return this.analyticsService.getStatusDistribution();
  }

  @Get('priority-distribution')
  @ApiOperation({ summary: 'Get active order priority distribution' })
  @ApiResponse({ status: 200, description: 'Returns active order count by priority' })
  async getPriorityDistribution() {
    return this.analyticsService.getPriorityDistribution();
  }
}

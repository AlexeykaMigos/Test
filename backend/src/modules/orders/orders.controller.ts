import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { OrdersService, AssignmentAlgorithm } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto, ChangeStatusDto, AssignExecutorDto } from './dto/update-order.dto';
import { FilterOrderDto } from './dto/filter-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@ApiTags('orders')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async create(@Body() createOrderDto: CreateOrderDto, @Request() req: any) {
    return this.ordersService.create(createOrderDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of orders' })
  async findAll(@Query() filterDto: FilterOrderDto, @Request() req: any) {
    return this.ordersService.findAll(filterDto, req.user);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get order statistics' })
  @ApiResponse({ status: 200, description: 'Returns order statistics' })
  async getStats(@Request() req: any) {
    const userId = req.user.role === UserRole.EXECUTOR ? req.user.id : undefined;
    return this.ordersService.getStats(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Returns order details' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get order change history' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Returns order history entries' })
  async getHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.getHistory(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update order (admin/manager only)' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Order updated successfully' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @Request() req: any,
  ) {
    return this.ordersService.update(id, updateOrderDto, req.user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Change order status' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Status changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  async changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() changeStatusDto: ChangeStatusDto,
    @Request() req: any,
  ) {
    return this.ordersService.changeStatus(id, changeStatusDto, req.user);
  }

  @Patch(':id/assign')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Assign executor to order' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Executor assigned successfully' })
  async assignExecutor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignDto: AssignExecutorDto,
    @Request() req: any,
  ) {
    return this.ordersService.assignExecutor(id, assignDto, req.user);
  }

  @Patch(':id/auto-assign')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Auto-assign executor using algorithm' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiQuery({
    name: 'algorithm',
    enum: AssignmentAlgorithm,
    required: false,
    description: 'Assignment algorithm (default: min_load)',
  })
  @ApiResponse({ status: 200, description: 'Auto-assignment completed' })
  async autoAssign(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('algorithm') algorithm: AssignmentAlgorithm = AssignmentAlgorithm.MIN_LOAD,
    @Request() req: any,
  ) {
    return this.ordersService.autoAssign(id, algorithm, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete order (only new or cancelled orders)' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 204, description: 'Order deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete order in current status' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    await this.ordersService.remove(id, req.user);
  }
}

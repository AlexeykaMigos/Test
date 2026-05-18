import {
  Controller,
  Get,
  Post,
  Delete,
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
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns user notifications' })
  async getMyNotifications(
    @Request() req: any,
    @Query('unreadOnly') unreadOnly?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.notificationsService.getUserNotifications(req.user.id, {
      unreadOnly: unreadOnly === true || (unreadOnly as any) === 'true',
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Returns unread count' })
  async getUnreadCount(@Request() req: any) {
    const count = await this.notificationsService.getUnreadCount(req.user.id);
    return { count };
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@Request() req: any) {
    await this.notificationsService.markAllAsRead(req.user.id);
    return { message: 'All notifications marked as read' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  @ApiResponse({ status: 204, description: 'Notification deleted' })
  async deleteNotification(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    await this.notificationsService.deleteNotification(id, req.user.id);
  }
}

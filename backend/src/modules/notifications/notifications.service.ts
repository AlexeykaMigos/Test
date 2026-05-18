import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import {
  Notification,
  NotificationType,
  NotificationChannel,
} from '../../entities/notification.entity';

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  channel?: NotificationChannel;
  referenceId?: string;
  referenceType?: string;
  data?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private configService: ConfigService,
  ) {
    this.initEmailTransport();
  }

  private initEmailTransport() {
    const host = this.configService.get<string>('SMTP_HOST', 'smtp.mailtrap.io');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const user = this.configService.get<string>('SMTP_USER', '');
    const pass = this.configService.get<string>('SMTP_PASS', '');

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    } else {
      // Fallback to ethereal for development
      nodemailer.createTestAccount().then((account) => {
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: account.user,
            pass: account.pass,
          },
        });
        this.logger.log(`Email transport initialized (Ethereal): ${account.user}`);
      }).catch(() => {
        this.logger.warn('Failed to create email transport. Email notifications disabled.');
      });
    }
  }

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: createNotificationDto.userId,
      type: createNotificationDto.type,
      title: createNotificationDto.title,
      message: createNotificationDto.message,
      channel: createNotificationDto.channel || NotificationChannel.IN_APP,
      referenceId: createNotificationDto.referenceId,
      referenceType: createNotificationDto.referenceType,
      data: createNotificationDto.data,
    });

    const saved = await this.notificationRepository.save(notification);

    // Send via channel if specified
    if (createNotificationDto.channel === NotificationChannel.EMAIL) {
      await this.sendEmailNotification(createNotificationDto).catch((err) => {
        this.logger.error(`Failed to send email notification: ${err.message}`);
      });
    }

    return saved;
  }

  async createBulk(notifications: CreateNotificationDto[]): Promise<void> {
    const entities = notifications.map((n) =>
      this.notificationRepository.create({
        userId: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        channel: n.channel || NotificationChannel.IN_APP,
        referenceId: n.referenceId,
        referenceType: n.referenceType,
        data: n.data,
      }),
    );

    await this.notificationRepository.save(entities);
  }

  async getUserNotifications(
    userId: string,
    options?: { unreadOnly?: boolean; page?: number; limit?: number },
  ): Promise<{ data: Notification[]; total: number; unreadCount: number }> {
    const { unreadOnly = false, page = 1, limit = 20 } = options || {};

    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId });

    if (unreadOnly) {
      query.andWhere('notification.isRead = false');
    }

    query.orderBy('notification.createdAt', 'DESC');
    query.skip((page - 1) * limit).take(limit);

    const [data, total] = await query.getManyAndCount();

    const unreadCount = await this.notificationRepository.count({
      where: { userId, isRead: false },
    });

    return { data, total, unreadCount };
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    notification.readAt = new Date();
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true, readAt: new Date() })
      .where('userId = :userId AND isRead = false', { userId })
      .execute();
  }

  async deleteNotification(id: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.notificationRepository.remove(notification);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  private async sendEmailNotification(dto: CreateNotificationDto): Promise<void> {
    if (!this.transporter) {
      this.logger.warn('Email transport not available');
      return;
    }

    const fromEmail = this.configService.get<string>('SMTP_FROM', 'noreply@orderflow.com');

    try {
      const info = await this.transporter.sendMail({
        from: `"OrderFlow" <${fromEmail}>`,
        to: dto.data?.email || '',
        subject: dto.title,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #3B82F6; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">OrderFlow</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
              <h2 style="color: #333;">${dto.title}</h2>
              <p style="color: #555; line-height: 1.6;">${dto.message}</p>
              ${dto.referenceId ? `
                <a href="${this.configService.get('FRONTEND_URL', 'http://localhost:3000')}/orders/${dto.referenceId}"
                   style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">
                  View Order
                </a>
              ` : ''}
              <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
              <p style="color: #999; font-size: 12px;">
                This is an automated message from OrderFlow. Please do not reply to this email.
              </p>
            </div>
          </div>
        `,
      });

      this.logger.log(`Email sent: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Email sending failed: ${error.message}`);
      throw error;
    }
  }

  async sendOrderOverdueAlerts(): Promise<void> {
    // This would be called by a cron job to check for overdue orders
    this.logger.log('Checking for overdue orders...');
  }
}

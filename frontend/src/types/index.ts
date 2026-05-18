// User types
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EXECUTOR = 'executor',
  CLIENT = 'client',
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Order types
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

export interface OrderItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  unit: string;
  sku?: string;
  orderId: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  priority: OrderPriority;
  totalAmount: number;
  comment?: string;
  description?: string;
  deadline?: string;
  acceptedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  customerId?: string;
  executorId?: string;
  managerId?: string;
  customer?: Customer;
  executor?: User;
  manager?: User;
  items?: OrderItem[];
  history?: OrderHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderHistory {
  id: string;
  orderId: string;
  userId?: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  user?: User;
}

// Customer types
export enum CustomerSegment {
  VIP = 'vip',
  REGULAR = 'regular',
  NEW = 'new',
  INACTIVE = 'inactive',
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  phone?: string;
  email?: string;
  address?: string;
  segment: CustomerSegment;
  notes?: string;
  totalOrders: number;
  totalRevenue: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  orders?: Order[];
}

// Notification types
export enum NotificationType {
  ORDER_CREATED = 'order_created',
  ORDER_STATUS_CHANGED = 'order_status_changed',
  ORDER_ASSIGNED = 'order_assigned',
  ORDER_OVERDUE = 'order_overdue',
  ORDER_COMPLETED = 'order_completed',
  SYSTEM_ALERT = 'system_alert',
  USER_MENTION = 'user_mention',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  channel: string;
  referenceId?: string;
  referenceType?: string;
  data?: Record<string, any>;
  createdAt: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

// Analytics types
export interface DashboardStats {
  period: { start: string; end: string };
  orders: {
    total: number;
    completed: number;
    cancelled: number;
    overdue: number;
    completionRate: number;
  };
  revenue: { total: number; currency: string };
  customers: { new: number };
  executors: { active: number };
}

export interface OrdersCountData {
  date: string;
  total: number;
  completed: number;
  cancelled: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface EmployeeEfficiency {
  executorId: string;
  executorName: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  completionRate: number;
  avgProcessingHours: number;
  totalRevenue: number;
}

// Filter types
export interface OrderFilters {
  status?: OrderStatus;
  priority?: OrderPriority;
  customerId?: string;
  executorId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  isOverdue?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

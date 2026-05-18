import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { OrderStatus, OrderPriority } from '@/types';

const statusConfig: Record<OrderStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' }> = {
  [OrderStatus.NEW]: { label: 'New', variant: 'info' },
  [OrderStatus.ACCEPTED]: { label: 'Accepted', variant: 'purple' },
  [OrderStatus.PROCESSING]: { label: 'Processing', variant: 'warning' },
  [OrderStatus.ASSIGNED]: { label: 'Assigned', variant: 'warning' },
  [OrderStatus.IN_PROGRESS]: { label: 'In Progress', variant: 'warning' },
  [OrderStatus.READY]: { label: 'Ready', variant: 'success' },
  [OrderStatus.SHIPPED]: { label: 'Shipped', variant: 'info' },
  [OrderStatus.DELIVERED]: { label: 'Delivered', variant: 'success' },
  [OrderStatus.COMPLETED]: { label: 'Completed', variant: 'success' },
  [OrderStatus.CANCELLED]: { label: 'Cancelled', variant: 'danger' },
};

const priorityConfig: Record<OrderPriority, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' }> = {
  [OrderPriority.LOW]: { label: 'Low', variant: 'default' },
  [OrderPriority.MEDIUM]: { label: 'Medium', variant: 'info' },
  [OrderPriority.HIGH]: { label: 'High', variant: 'warning' },
  [OrderPriority.URGENT]: { label: 'Urgent', variant: 'danger' },
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, size = 'sm' }) => {
  const config = statusConfig[status] || { label: status, variant: 'default' as const };
  return (
    <Badge variant={config.variant} size={size} dot>
      {config.label}
    </Badge>
  );
};

interface OrderPriorityBadgeProps {
  priority: OrderPriority;
  size?: 'sm' | 'md';
}

export const OrderPriorityBadge: React.FC<OrderPriorityBadgeProps> = ({ priority, size = 'sm' }) => {
  const config = priorityConfig[priority] || { label: priority, variant: 'default' as const };
  return (
    <Badge variant={config.variant} size={size}>
      {config.label}
    </Badge>
  );
};

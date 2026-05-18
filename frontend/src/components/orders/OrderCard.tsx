import React from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { Order } from '@/types';
import { OrderStatusBadge, OrderPriorityBadge } from './OrderStatusBadge';

interface OrderCardProps {
  order: Order;
  className?: string;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, className }) => {
  const isOverdue = order.deadline && new Date() > new Date(order.deadline) &&
    !['completed', 'cancelled', 'delivered'].includes(order.status);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));

  return (
    <Link href={`/orders/${order.id}`}>
      <div
        className={clsx(
          'bg-white rounded-xl border p-4 hover:shadow-md transition-all duration-200 cursor-pointer',
          isOverdue ? 'border-red-200 bg-red-50/30' : 'border-gray-200 hover:border-blue-200',
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-blue-600">{order.orderNumber}</p>
            {order.customer && (
              <p className="text-xs text-gray-500 mt-0.5">
                {order.customer.firstName} {order.customer.lastName}
                {order.customer.company && ` · ${order.customer.company}`}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <OrderStatusBadge status={order.status} />
            <OrderPriorityBadge priority={order.priority} />
          </div>
        </div>

        {/* Content */}
        {order.comment && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{order.comment}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{formatDate(order.createdAt)}</span>
            {order.deadline && (
              <span className={clsx('flex items-center gap-1', isOverdue && 'text-red-600 font-medium')}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {isOverdue ? 'Overdue: ' : 'Due: '}{formatDate(order.deadline)}
              </span>
            )}
          </div>
          <span className="text-sm font-semibold text-gray-800">
            {formatCurrency(Number(order.totalAmount))}
          </span>
        </div>

        {/* Executor */}
        {order.executor && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 text-xs font-medium">
                {order.executor.firstName[0]}{order.executor.lastName[0]}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {order.executor.firstName} {order.executor.lastName}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
};

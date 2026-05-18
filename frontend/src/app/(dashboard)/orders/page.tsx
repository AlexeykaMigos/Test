'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useOrders, useDeleteOrder } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';
import { Table, Pagination } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';
import { OrderStatusBadge, OrderPriorityBadge } from '@/components/orders/OrderStatusBadge';
import { OrderFiltersComponent } from '@/components/orders/OrderFilters';
import { Order, OrderFilters, UserRole } from '@/types';

const DEFAULT_FILTERS: OrderFilters = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'DESC',
};

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [filters, setFilters] = useState<OrderFilters>(DEFAULT_FILTERS);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useOrders(filters);
  const deleteOrder = useDeleteOrder();

  const canCreateOrder = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;
  const canDeleteOrder = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));

  const columns = [
    {
      key: 'orderNumber',
      header: 'Order #',
      render: (_: any, order: Order) => (
        <span className="font-medium text-blue-600">{order.orderNumber}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (_: any, order: Order) => <OrderStatusBadge status={order.status} />,
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (_: any, order: Order) => <OrderPriorityBadge priority={order.priority} />,
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (_: any, order: Order) => (
        <span>
          {order.customer
            ? `${order.customer.firstName} ${order.customer.lastName}`
            : <span className="text-gray-400">-</span>}
        </span>
      ),
    },
    {
      key: 'executor',
      header: 'Assigned To',
      render: (_: any, order: Order) => (
        <span>
          {order.executor
            ? `${order.executor.firstName} ${order.executor.lastName}`
            : <span className="text-gray-400 text-xs">Unassigned</span>}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      render: (_: any, order: Order) => (
        <span className="font-medium">{formatCurrency(Number(order.totalAmount))}</span>
      ),
    },
    {
      key: 'deadline',
      header: 'Deadline',
      render: (_: any, order: Order) => {
        if (!order.deadline) return <span className="text-gray-400">-</span>;
        const isOverdue = new Date() > new Date(order.deadline) &&
          !['completed', 'cancelled', 'delivered'].includes(order.status);
        return (
          <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-700'}>
            {formatDate(order.deadline)}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (_: any, order: Order) => (
        <span className="text-gray-500">{formatDate(order.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, order: Order) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/orders/${order.id}`}
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View order"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Link>
          {canDeleteOrder && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteId(order.id);
              }}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete order"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">
            {data?.total ?? 0} orders total
          </p>
        </div>
        {canCreateOrder && (
          <Button
            onClick={() => router.push('/orders/new')}
            leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            New Order
          </Button>
        )}
      </div>

      {/* Filters */}
      <OrderFiltersComponent
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      {/* Table */}
      <div>
        <Table
          data={data?.data || []}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No orders found. Try adjusting your filters."
          onRowClick={(order) => router.push(`/orders/${order.id}`)}
        />
        {data && data.total > 0 && (
          <Pagination
            total={data.total}
            page={filters.page || 1}
            limit={filters.limit || 20}
            onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          />
        )}
      </div>

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteOrder.mutate(deleteId, {
              onSuccess: () => setDeleteId(null),
            });
          }
        }}
        title="Delete Order"
        message="Are you sure you want to delete this order? This action cannot be undone."
        confirmLabel="Delete Order"
        isLoading={deleteOrder.isPending}
      />
    </div>
  );
}

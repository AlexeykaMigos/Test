'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useOrder, useChangeOrderStatus, useAssignExecutor } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Input';
import { OrderStatusBadge, OrderPriorityBadge } from '@/components/orders/OrderStatusBadge';
import { OrderStatus, OrderPriority, UserRole, STATUS_TRANSITIONS } from '@/types';
import api from '@/lib/api';
import { clsx } from 'clsx';

// We need STATUS_TRANSITIONS for frontend too - define here
const STATUS_TRANSITIONS_FE: Record<string, string[]> = {
  new: ['accepted', 'cancelled'],
  accepted: ['processing', 'cancelled'],
  processing: ['assigned', 'cancelled'],
  assigned: ['in_progress', 'cancelled'],
  in_progress: ['ready', 'cancelled'],
  ready: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const orderId = params.id as string;

  const { data: order, isLoading } = useOrder(orderId);
  const changeStatus = useChangeOrderStatus();
  const assignExecutor = useAssignExecutor();

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedExecutor, setSelectedExecutor] = useState('');
  const [statusComment, setStatusComment] = useState('');

  const { data: executors } = useQuery({
    queryKey: ['users', 'executors'],
    queryFn: async () => {
      const response = await api.get('/users/executors');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Order not found</p>
        <Button variant="ghost" onClick={() => router.push('/orders')} className="mt-4">
          Back to Orders
        </Button>
      </div>
    );
  }

  const availableTransitions = STATUS_TRANSITIONS_FE[order.status] || [];
  const canChangeStatus = user?.role !== UserRole.CLIENT;
  const canAssign = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatDateTime = (date: string) =>
    new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(date));

  const handleStatusChange = () => {
    if (!selectedStatus) return;
    changeStatus.mutate(
      { id: orderId, status: selectedStatus as OrderStatus, comment: statusComment },
      { onSuccess: () => { setShowStatusModal(false); setSelectedStatus(''); setStatusComment(''); } },
    );
  };

  const handleAssign = () => {
    if (!selectedExecutor) return;
    assignExecutor.mutate(
      { id: orderId, executorId: selectedExecutor },
      { onSuccess: () => { setShowAssignModal(false); setSelectedExecutor(''); } },
    );
  };

  const statusOptions = availableTransitions.map((s) => ({
    value: s,
    label: s.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
  }));

  const executorOptions = (executors || []).map((e: any) => ({
    value: e.id,
    label: `${e.firstName} ${e.lastName}`,
  }));

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
            <OrderStatusBadge status={order.status} size="md" />
            <OrderPriorityBadge priority={order.priority} size="md" />
          </div>
          <p className="text-gray-500 text-sm">Created {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          {canAssign && (
            <Button variant="outline" size="sm" onClick={() => setShowAssignModal(true)}>
              {order.executor ? 'Reassign' : 'Assign Executor'}
            </Button>
          )}
          {canChangeStatus && availableTransitions.length > 0 && (
            <Button size="sm" onClick={() => setShowStatusModal(true)}>
              Change Status
            </Button>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Order Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Order Information</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</dt>
                <dd className="mt-1"><OrderStatusBadge status={order.status} /></dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</dt>
                <dd className="mt-1"><OrderPriorityBadge priority={order.priority} /></dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</dt>
                <dd className="mt-1 text-lg font-bold text-gray-900">{formatCurrency(Number(order.totalAmount))}</dd>
              </div>
              {order.deadline && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</dt>
                  <dd className={clsx('mt-1 text-sm font-medium', new Date() > new Date(order.deadline) && 'text-red-600')}>
                    {formatDateTime(order.deadline)}
                  </dd>
                </div>
              )}
              {order.acceptedAt && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Accepted At</dt>
                  <dd className="mt-1 text-sm text-gray-700">{formatDateTime(order.acceptedAt)}</dd>
                </div>
              )}
              {order.completedAt && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Completed At</dt>
                  <dd className="mt-1 text-sm text-green-600 font-medium">{formatDateTime(order.completedAt)}</dd>
                </div>
              )}
            </dl>
            {order.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description</dt>
                <p className="text-sm text-gray-700">{order.description}</p>
              </div>
            )}
            {order.comment && (
              <div className="mt-3">
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Comment</dt>
                <p className="text-sm text-gray-700">{order.comment}</p>
              </div>
            )}
            {order.cancellationReason && (
              <div className="mt-3 p-3 bg-red-50 rounded-lg">
                <dt className="text-xs font-medium text-red-600 uppercase tracking-wider mb-1">Cancellation Reason</dt>
                <p className="text-sm text-red-700">{order.cancellationReason}</p>
              </div>
            )}
          </div>

          {/* Order Items */}
          {order.items && order.items.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">Item</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase py-2">Qty</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase py-2">Unit</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase py-2">Price</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-3">
                          <p className="text-sm font-medium text-gray-900">{item.name}</p>
                          {item.sku && <p className="text-xs text-gray-400">SKU: {item.sku}</p>}
                        </td>
                        <td className="text-right py-3 text-sm">{item.quantity}</td>
                        <td className="text-right py-3 text-sm text-gray-500">{item.unit}</td>
                        <td className="text-right py-3 text-sm">{formatCurrency(Number(item.price))}</td>
                        <td className="text-right py-3 text-sm font-medium">
                          {formatCurrency(Number(item.quantity) * Number(item.price))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-200">
                      <td colSpan={4} className="text-right py-3 text-sm font-semibold text-gray-900">Total:</td>
                      <td className="text-right py-3 text-base font-bold text-gray-900">
                        {formatCurrency(Number(order.totalAmount))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* History */}
          {order.history && order.history.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Order History</h2>
              <div className="space-y-3">
                {order.history.map((entry) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {entry.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}
                      </p>
                      {(entry.oldValue || entry.newValue) && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {entry.oldValue && <span className="line-through text-red-500">{entry.oldValue}</span>}
                          {entry.oldValue && entry.newValue && <span className="mx-1">→</span>}
                          {entry.newValue && <span className="text-green-600">{entry.newValue}</span>}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">{formatDateTime(entry.createdAt)}</span>
                        {entry.user && (
                          <span className="text-xs text-gray-400">by {entry.user.firstName} {entry.user.lastName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Customer */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Customer</h2>
            {order.customer ? (
              <div>
                <p className="font-medium text-gray-900">
                  {order.customer.firstName} {order.customer.lastName}
                </p>
                {order.customer.company && (
                  <p className="text-sm text-gray-500">{order.customer.company}</p>
                )}
                {order.customer.email && (
                  <a href={`mailto:${order.customer.email}`} className="text-sm text-blue-600 hover:underline block mt-1">
                    {order.customer.email}
                  </a>
                )}
                {order.customer.phone && (
                  <a href={`tel:${order.customer.phone}`} className="text-sm text-gray-600 block mt-1">
                    {order.customer.phone}
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No customer assigned</p>
            )}
          </div>

          {/* Executor */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Assigned Executor</h2>
            {order.executor ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold text-sm">
                    {order.executor.firstName[0]}{order.executor.lastName[0]}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {order.executor.firstName} {order.executor.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{order.executor.email}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-400 mb-2">No executor assigned</p>
                {canAssign && (
                  <Button variant="outline" size="sm" onClick={() => setShowAssignModal(true)}>
                    Assign Now
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Manager */}
          {order.manager && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Manager</h2>
              <p className="text-sm font-medium text-gray-900">
                {order.manager.firstName} {order.manager.lastName}
              </p>
              <p className="text-sm text-gray-500">{order.manager.email}</p>
            </div>
          )}
        </div>
      </div>

      {/* Change Status Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Change Order Status"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowStatusModal(false)}>Cancel</Button>
            <Button
              onClick={handleStatusChange}
              isLoading={changeStatus.isPending}
              disabled={!selectedStatus}
            >
              Update Status
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="New Status"
            options={[{ value: '', label: 'Select status...' }, ...statusOptions]}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Reason for status change..."
              value={statusComment}
              onChange={(e) => setStatusComment(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* Assign Executor Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Executor"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAssignModal(false)}>Cancel</Button>
            <Button
              onClick={handleAssign}
              isLoading={assignExecutor.isPending}
              disabled={!selectedExecutor}
            >
              Assign
            </Button>
          </>
        }
      >
        <Select
          label="Select Executor"
          options={[{ value: '', label: 'Select executor...' }, ...executorOptions]}
          value={selectedExecutor}
          onChange={(e) => setSelectedExecutor(e.target.value)}
        />
      </Modal>
    </div>
  );
}

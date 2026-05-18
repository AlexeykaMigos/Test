'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { OrderForm } from '@/components/orders/OrderForm';
import { useCreateOrder } from '@/hooks/useOrders';
import api from '@/lib/api';

export default function NewOrderPage() {
  const router = useRouter();
  const createOrder = useCreateOrder();

  const { data: customers } = useQuery({
    queryKey: ['customers', { page: 1, limit: 100 }],
    queryFn: async () => {
      const response = await api.get('/customers?limit=100');
      return response.data?.data || [];
    },
  });

  const { data: executors } = useQuery({
    queryKey: ['users', 'executors'],
    queryFn: async () => {
      const response = await api.get('/users/executors');
      return response.data || [];
    },
  });

  const handleSubmit = (data: any) => {
    const orderData = {
      ...data,
      customerId: data.customerId || undefined,
      executorId: data.executorId || undefined,
      items: data.items?.length ? data.items : undefined,
    };
    createOrder.mutate(orderData, {
      onSuccess: (order) => {
        router.push(`/orders/${order.id}`);
      },
    });
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create New Order</h1>
        <p className="text-gray-500 text-sm mt-1">Fill in the details to create a new order</p>
      </div>

      <OrderForm
        customers={customers || []}
        executors={executors || []}
        onSubmit={handleSubmit}
        isLoading={createOrder.isPending}
        submitLabel="Create Order"
      />
    </div>
  );
}

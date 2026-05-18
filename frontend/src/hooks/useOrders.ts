'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api, { handleApiError } from '@/lib/api';
import { Order, OrderFilters, PaginatedResponse, OrderStatus } from '@/types';

const ordersApi = {
  getAll: async (filters: OrderFilters = {}): Promise<PaginatedResponse<Order>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    const response = await api.get(`/orders?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  create: async (data: Partial<Order>): Promise<Order> => {
    const response = await api.post('/orders', data);
    return response.data;
  },

  update: async ({ id, data }: { id: string; data: Partial<Order> }): Promise<Order> => {
    const response = await api.put(`/orders/${id}`, data);
    return response.data;
  },

  changeStatus: async ({
    id,
    status,
    comment,
  }: {
    id: string;
    status: OrderStatus;
    comment?: string;
  }): Promise<Order> => {
    const response = await api.patch(`/orders/${id}/status`, { status, comment });
    return response.data;
  },

  assignExecutor: async ({
    id,
    executorId,
    note,
  }: {
    id: string;
    executorId: string;
    note?: string;
  }): Promise<Order> => {
    const response = await api.patch(`/orders/${id}/assign`, { executorId, note });
    return response.data;
  },

  autoAssign: async ({
    id,
    algorithm = 'min_load',
  }: {
    id: string;
    algorithm?: string;
  }): Promise<Order> => {
    const response = await api.patch(`/orders/${id}/auto-assign?algorithm=${algorithm}`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/orders/${id}`);
  },

  getHistory: async (id: string) => {
    const response = await api.get(`/orders/${id}/history`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/orders/stats');
    return response.data;
  },
};

export function useOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => ordersApi.getAll(filters),
    staleTime: 30 * 1000,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => ordersApi.getById(id),
    enabled: !!id,
  });
}

export function useOrderStats() {
  return useQuery({
    queryKey: ['orders', 'stats'],
    queryFn: ordersApi.getStats,
    staleTime: 60 * 1000,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ordersApi.create,
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(`Order ${order.orderNumber} created successfully!`);
    },
    onError: (error: any) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ordersApi.update,
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.setQueryData(['orders', order.id], order);
      toast.success('Order updated successfully');
    },
    onError: (error: any) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useChangeOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ordersApi.changeStatus,
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.setQueryData(['orders', order.id], order);
      toast.success(`Status changed to ${order.status.replace('_', ' ')}`);
    },
    onError: (error: any) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useAssignExecutor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ordersApi.assignExecutor,
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.setQueryData(['orders', order.id], order);
      toast.success('Executor assigned successfully');
    },
    onError: (error: any) => {
      toast.error(handleApiError(error));
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ordersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order deleted successfully');
    },
    onError: (error: any) => {
      toast.error(handleApiError(error));
    },
  });
}

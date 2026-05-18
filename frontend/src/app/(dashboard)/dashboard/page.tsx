'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { StatsCard } from '@/components/analytics/StatsCard';
import { OrdersChart } from '@/components/analytics/OrdersChart';
import { OrderCard } from '@/components/orders/OrderCard';
import { useAuth } from '@/hooks/useAuth';
import { useOrderStats } from '@/hooks/useOrders';
import { Order, OrderStatus } from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: statsData } = useOrderStats();

  const { data: dashboardStats } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: async () => {
      const response = await api.get('/analytics/dashboard');
      return response.data;
    },
    staleTime: 60 * 1000,
  });

  const { data: ordersChart } = useQuery({
    queryKey: ['analytics', 'orders-count', 'day'],
    queryFn: async () => {
      const response = await api.get('/analytics/orders-count?groupBy=day');
      return response.data;
    },
    staleTime: 60 * 1000,
  });

  const { data: recentOrdersData } = useQuery({
    queryKey: ['orders', { page: 1, limit: 5 }],
    queryFn: async () => {
      const response = await api.get('/orders?page=1&limit=5&sortBy=createdAt&sortOrder=DESC');
      return response.data;
    },
  });

  const { data: overdueData } = useQuery({
    queryKey: ['orders', 'overdue-count'],
    queryFn: async () => {
      const response = await api.get('/orders?isOverdue=true&limit=1');
      return response.data;
    },
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good morning, {user?.firstName}!
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Here&apos;s what&apos;s happening with your orders today.
          </p>
        </div>
        <Link
          href="/orders/new"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Order
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Orders"
          value={statsData?.total || 0}
          subtitle="All time"
          color="blue"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatsCard
          title="Revenue (This Month)"
          value={dashboardStats ? formatCurrency(dashboardStats.revenue?.total || 0) : '$0'}
          subtitle="Completed orders"
          color="green"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Completion Rate"
          value={`${dashboardStats?.orders?.completionRate || 0}%`}
          subtitle="This month"
          color="purple"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Overdue Orders"
          value={overdueData?.total || statsData?.overdue || 0}
          subtitle="Need immediate attention"
          color="red"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      </div>

      {/* Status breakdown */}
      {statsData?.byStatus && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Orders by Status</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {Object.entries(statsData.byStatus).map(([status, count]) => (
              <Link
                key={status}
                href={`/orders?status=${status}`}
                className="text-center p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors group"
              >
                <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600">{count as number}</p>
                <p className="text-xs text-gray-500 capitalize mt-1">{status.replace(/_/g, ' ')}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Charts and recent orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders chart */}
        <div className="lg:col-span-2">
          {ordersChart && ordersChart.length > 0 ? (
            <OrdersChart data={ordersChart} type="area" />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-center h-64">
              <p className="text-gray-400 text-sm">No chart data available yet</p>
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Recent Orders</h3>
            <Link href="/orders" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all
            </Link>
          </div>
          {recentOrdersData?.data?.length ? (
            recentOrdersData.data.slice(0, 4).map((order: Order) => (
              <OrderCard key={order.id} order={order} />
            ))
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm">No orders yet</p>
              <Link
                href="/orders/new"
                className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Create first order
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

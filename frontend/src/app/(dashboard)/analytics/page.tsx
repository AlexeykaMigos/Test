'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { StatsCard } from '@/components/analytics/StatsCard';
import { OrdersChart, RevenueChart, StatusPieChart } from '@/components/analytics/OrdersChart';
import { Table } from '@/components/ui/Table';
import { Select } from '@/components/ui/Input';

type GroupBy = 'day' | 'week' | 'month';

export default function AnalyticsPage() {
  const [groupBy, setGroupBy] = useState<GroupBy>('day');

  const { data: dashStats, isLoading: dashLoading } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: async () => {
      const response = await api.get('/analytics/dashboard');
      return response.data;
    },
  });

  const { data: ordersCount } = useQuery({
    queryKey: ['analytics', 'orders-count', groupBy],
    queryFn: async () => {
      const response = await api.get(`/analytics/orders-count?groupBy=${groupBy}`);
      return response.data;
    },
  });

  const { data: revenue } = useQuery({
    queryKey: ['analytics', 'revenue', groupBy],
    queryFn: async () => {
      const response = await api.get(`/analytics/revenue?groupBy=${groupBy}`);
      return response.data;
    },
  });

  const { data: processingTime } = useQuery({
    queryKey: ['analytics', 'processing-time'],
    queryFn: async () => {
      const response = await api.get('/analytics/processing-time');
      return response.data;
    },
  });

  const { data: efficiency } = useQuery({
    queryKey: ['analytics', 'employee-efficiency'],
    queryFn: async () => {
      const response = await api.get('/analytics/employee-efficiency');
      return response.data;
    },
  });

  const { data: statusDist } = useQuery({
    queryKey: ['analytics', 'status-distribution'],
    queryFn: async () => {
      const response = await api.get('/analytics/status-distribution');
      return response.data;
    },
  });

  const { data: overdueOrders } = useQuery({
    queryKey: ['analytics', 'overdue'],
    queryFn: async () => {
      const response = await api.get('/analytics/overdue-orders');
      return response.data;
    },
  });

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const efficiencyColumns = [
    { key: 'executorName', header: 'Employee', accessor: 'executorName' as const },
    { key: 'totalOrders', header: 'Total', accessor: 'totalOrders' as const },
    { key: 'completedOrders', header: 'Completed', accessor: 'completedOrders' as const },
    {
      key: 'completionRate',
      header: 'Rate',
      render: (v: number) => (
        <span className={v >= 80 ? 'text-green-600 font-medium' : v >= 60 ? 'text-yellow-600' : 'text-red-600'}>
          {v}%
        </span>
      ),
    },
    {
      key: 'avgProcessingHours',
      header: 'Avg Time',
      render: (v: number) => <span>{v ? `${v}h` : '-'}</span>,
    },
    {
      key: 'totalRevenue',
      header: 'Revenue',
      render: (v: number) => <span>{formatCurrency(v)}</span>,
    },
  ];

  const groupByOptions = [
    { value: 'day', label: 'Daily' },
    { value: 'week', label: 'Weekly' },
    { value: 'month', label: 'Monthly' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Business performance and insights</p>
        </div>
        <Select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as GroupBy)}
          options={groupByOptions}
          className="w-36"
        />
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Orders (Month)"
          value={dashStats?.orders?.total || 0}
          color="blue"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatsCard
          title="Revenue (Month)"
          value={dashStats ? formatCurrency(dashStats.revenue?.total || 0) : '$0'}
          color="green"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Completion Rate"
          value={`${dashStats?.orders?.completionRate || 0}%`}
          subtitle="This month"
          color="purple"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Avg Processing Time"
          value={processingTime?.avgProcessingTimeHours ? `${processingTime.avgProcessingTimeHours}h` : 'N/A'}
          subtitle={processingTime?.completedOrdersCount ? `From ${processingTime.completedOrdersCount} orders` : ''}
          color="yellow"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {ordersCount && <OrdersChart data={ordersCount} type="area" />}
        {revenue && <RevenueChart data={revenue} />}
      </div>

      {/* Status distribution + Overdue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {statusDist && <StatusPieChart data={statusDist} />}

        {/* Overdue Orders */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Overdue Orders{' '}
            {overdueOrders?.count > 0 && (
              <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full ml-1">
                {overdueOrders.count}
              </span>
            )}
          </h3>
          {overdueOrders?.orders?.length ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {overdueOrders.orders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">
                      {order.customer?.name || 'No customer'} · {order.executor?.name || 'Unassigned'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-red-600">{order.overdueByHours}h overdue</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400">
              <div className="text-center">
                <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">No overdue orders!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Employee Efficiency */}
      {efficiency && efficiency.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Employee Efficiency</h3>
          </div>
          <Table
            data={efficiency}
            columns={efficiencyColumns}
            emptyMessage="No efficiency data available"
          />
        </div>
      )}
    </div>
  );
}

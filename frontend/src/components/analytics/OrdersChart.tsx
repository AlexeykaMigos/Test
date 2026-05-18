'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface OrdersChartProps {
  data: Array<{
    date: string;
    total: number;
    completed: number;
    cancelled: number;
  }>;
  type?: 'area' | 'bar' | 'line';
}

export const OrdersChart: React.FC<OrdersChartProps> = ({ data, type = 'area' }) => {
  const ChartComponent = type === 'bar' ? BarChart : type === 'line' ? LineChart : AreaChart;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Orders Over Time</h3>
      <ResponsiveContainer width="100%" height={280}>
        {type === 'area' ? (
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#totalGradient)"
              name="Total Orders"
            />
            <Area
              type="monotone"
              dataKey="completed"
              stroke="#10B981"
              strokeWidth={2}
              fill="url(#completedGradient)"
              name="Completed"
            />
          </AreaChart>
        ) : type === 'bar' ? (
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }} />
            <Legend />
            <Bar dataKey="total" fill="#3B82F6" name="Total Orders" radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed" fill="#10B981" name="Completed" radius={[4, 4, 0, 0]} />
            <Bar dataKey="cancelled" fill="#EF4444" name="Cancelled" radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : (
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }} />
            <Legend />
            <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} name="Total Orders" dot={false} />
            <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} name="Completed" dot={false} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

interface RevenueChartProps {
  data: Array<{ date: string; revenue: number; orderCount: number }>;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(value);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Revenue</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), 'Revenue']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#8B5CF6"
            strokeWidth={2}
            fill="url(#revenueGradient)"
            name="Revenue"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const STATUS_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6B7280'];

interface StatusPieChartProps {
  data: Array<{ status: string; count: number }>;
}

export const StatusPieChart: React.FC<StatusPieChartProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Status Distribution</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="count"
            nameKey="status"
          >
            {data.map((entry, index) => (
              <Cell key={entry.status} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [value, String(name).replace(/_/g, ' ')]}
            contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
          />
          <Legend
            formatter={(value) => String(value).replace(/_/g, ' ')}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

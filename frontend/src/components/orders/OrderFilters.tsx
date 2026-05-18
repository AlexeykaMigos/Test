'use client';

import React from 'react';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { OrderStatus, OrderPriority, OrderFilters } from '@/types';

interface OrderFiltersProps {
  filters: OrderFilters;
  onChange: (filters: OrderFilters) => void;
  onReset: () => void;
}

const statusOptions = [
  { value: '', label: 'All Statuses' },
  ...Object.values(OrderStatus).map((s) => ({
    value: s,
    label: s.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
  })),
];

const priorityOptions = [
  { value: '', label: 'All Priorities' },
  ...Object.values(OrderPriority).map((p) => ({
    value: p,
    label: p.charAt(0).toUpperCase() + p.slice(1),
  })),
];

const sortOptions = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'updatedAt', label: 'Date Updated' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'totalAmount', label: 'Amount' },
  { value: 'priority', label: 'Priority' },
];

export const OrderFiltersComponent: React.FC<OrderFiltersProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  const hasFilters = filters.status || filters.priority || filters.search ||
    filters.dateFrom || filters.dateTo;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <Input
          placeholder="Search orders..."
          value={filters.search || ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value, page: 1 })}
          leftAddon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />

        {/* Status filter */}
        <Select
          value={filters.status || ''}
          onChange={(e) => onChange({ ...filters, status: e.target.value as OrderStatus || undefined, page: 1 })}
          options={statusOptions}
        />

        {/* Priority filter */}
        <Select
          value={filters.priority || ''}
          onChange={(e) => onChange({ ...filters, priority: e.target.value as OrderPriority || undefined, page: 1 })}
          options={priorityOptions}
        />

        {/* Sort */}
        <Select
          value={filters.sortBy || 'createdAt'}
          onChange={(e) => onChange({ ...filters, sortBy: e.target.value })}
          options={sortOptions}
        />
      </div>

      {/* Date range & additional filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
        <Input
          type="date"
          label=""
          placeholder="From date"
          value={filters.dateFrom || ''}
          onChange={(e) => onChange({ ...filters, dateFrom: e.target.value, page: 1 })}
        />
        <Input
          type="date"
          placeholder="To date"
          value={filters.dateTo || ''}
          onChange={(e) => onChange({ ...filters, dateTo: e.target.value, page: 1 })}
        />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="overdue-filter"
            checked={!!filters.isOverdue}
            onChange={(e) => onChange({ ...filters, isOverdue: e.target.checked || undefined, page: 1 })}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="overdue-filter" className="text-sm text-gray-700 cursor-pointer">
            Overdue only
          </label>
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
};

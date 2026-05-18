'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomers, useCreateCustomer, useDeleteCustomer } from '@/hooks/useCustomers';
import { Table, Pagination } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Customer, CustomerSegment } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const customerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  company: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  segment: z.nativeEnum(CustomerSegment).default(CustomerSegment.NEW),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

const segmentConfig: Record<CustomerSegment, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' }> = {
  vip: { label: 'VIP', variant: 'purple' },
  regular: { label: 'Regular', variant: 'info' },
  new: { label: 'New', variant: 'success' },
  inactive: { label: 'Inactive', variant: 'default' },
};

const segmentOptions = Object.values(CustomerSegment).map((s) => ({
  value: s,
  label: s.charAt(0).toUpperCase() + s.slice(1),
}));

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useCustomers({ page, limit: 20, search, segment });
  const createCustomer = useCreateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: { segment: CustomerSegment.NEW },
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (_: any, customer: Customer) => (
        <div>
          <p className="font-medium text-gray-900">
            {customer.firstName} {customer.lastName}
          </p>
          {customer.company && (
            <p className="text-xs text-gray-500">{customer.company}</p>
          )}
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (_: any, customer: Customer) => (
        <div>
          {customer.email && <p className="text-sm text-gray-700">{customer.email}</p>}
          {customer.phone && <p className="text-xs text-gray-500">{customer.phone}</p>}
        </div>
      ),
    },
    {
      key: 'segment',
      header: 'Segment',
      render: (_: any, customer: Customer) => {
        const config = segmentConfig[customer.segment];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: 'totalOrders',
      header: 'Orders',
      render: (_: any, customer: Customer) => (
        <span className="font-medium">{customer.totalOrders}</span>
      ),
    },
    {
      key: 'totalRevenue',
      header: 'Revenue',
      render: (_: any, customer: Customer) => (
        <span className="font-medium">{formatCurrency(Number(customer.totalRevenue))}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Added',
      render: (_: any, customer: Customer) => (
        <span className="text-gray-500 text-sm">{formatDate(customer.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (_: any, customer: Customer) => (
        <button
          onClick={(e) => { e.stopPropagation(); setDeleteId(customer.id); }}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      ),
    },
  ];

  const onSubmit = (data: CustomerFormData) => {
    createCustomer.mutate(data as any, {
      onSuccess: () => {
        setShowCreateModal(false);
        reset();
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 text-sm mt-1">{data?.total ?? 0} customers total</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          + New Customer
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3">
        <Input
          placeholder="Search customers..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1"
          leftAddon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />
        <Select
          value={segment}
          onChange={(e) => { setSegment(e.target.value); setPage(1); }}
          options={[{ value: '', label: 'All Segments' }, ...segmentOptions]}
          className="w-40"
        />
      </div>

      {/* Table */}
      <div>
        <Table
          data={data?.data || []}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No customers found"
        />
        {data && data.total > 0 && (
          <Pagination total={data.total} page={page} limit={20} onPageChange={setPage} />
        )}
      </div>

      {/* Create Customer Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); reset(); }}
        title="Add New Customer"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => { setShowCreateModal(false); reset(); }}>Cancel</Button>
            <Button onClick={handleSubmit(onSubmit)} isLoading={createCustomer.isPending}>
              Create Customer
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name" required error={errors.firstName?.message} {...register('firstName')} />
            <Input label="Last Name" required error={errors.lastName?.message} {...register('lastName')} />
          </div>
          <Input label="Company" error={errors.company?.message} {...register('company')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
            <Input label="Phone" type="tel" error={errors.phone?.message} {...register('phone')} />
          </div>
          <Input label="Address" error={errors.address?.message} {...register('address')} />
          <Select
            label="Segment"
            options={segmentOptions}
            error={errors.segment?.message}
            {...register('segment')}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Any notes about this customer..."
              {...register('notes')}
            />
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteCustomer.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
          }
        }}
        title="Delete Customer"
        message="Are you sure you want to delete this customer? All associated orders will remain but will no longer be linked to this customer."
        confirmLabel="Delete Customer"
        isLoading={deleteCustomer.isPending}
      />
    </div>
  );
}

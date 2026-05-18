'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Order, OrderPriority, Customer, User } from '@/types';

const orderItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  quantity: z.number().min(0.01, 'Quantity must be positive'),
  price: z.number().min(0, 'Price must be non-negative'),
  unit: z.string().default('pcs'),
  sku: z.string().optional(),
});

const orderFormSchema = z.object({
  priority: z.nativeEnum(OrderPriority).default(OrderPriority.MEDIUM),
  comment: z.string().optional(),
  description: z.string().optional(),
  deadline: z.string().optional(),
  customerId: z.string().optional(),
  executorId: z.string().optional(),
  items: z.array(orderItemSchema).optional(),
});

type OrderFormData = z.infer<typeof orderFormSchema>;

interface OrderFormProps {
  initialData?: Partial<Order>;
  customers?: Customer[];
  executors?: User[];
  onSubmit: (data: OrderFormData) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

const priorityOptions = Object.values(OrderPriority).map((p) => ({
  value: p,
  label: p.charAt(0).toUpperCase() + p.slice(1),
}));

export const OrderForm: React.FC<OrderFormProps> = ({
  initialData,
  customers = [],
  executors = [],
  onSubmit,
  isLoading = false,
  submitLabel = 'Create Order',
}) => {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      priority: initialData?.priority || OrderPriority.MEDIUM,
      comment: initialData?.comment || '',
      description: initialData?.description || '',
      deadline: initialData?.deadline ? initialData.deadline.slice(0, 16) : '',
      customerId: initialData?.customerId || '',
      executorId: initialData?.executorId || '',
      items: initialData?.items?.map((item) => ({
        name: item.name,
        description: item.description || '',
        quantity: Number(item.quantity),
        price: Number(item.price),
        unit: item.unit || 'pcs',
        sku: item.sku || '',
      })) || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const items = watch('items') || [];
  const totalAmount = items.reduce((sum, item) => {
    return sum + (Number(item?.quantity) || 0) * (Number(item?.price) || 0);
  }, 0);

  const customerOptions = [
    { value: '', label: 'No customer' },
    ...customers.map((c) => ({
      value: c.id,
      label: `${c.firstName} ${c.lastName}${c.company ? ` (${c.company})` : ''}`,
    })),
  ];

  const executorOptions = [
    { value: '', label: 'Auto-assign later' },
    ...executors.map((e) => ({
      value: e.id,
      label: `${e.firstName} ${e.lastName}`,
    })),
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Order Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Priority"
            options={priorityOptions}
            error={errors.priority?.message}
            {...register('priority')}
          />
          <Input
            label="Deadline"
            type="datetime-local"
            error={errors.deadline?.message}
            {...register('deadline')}
          />
          <Select
            label="Customer"
            options={customerOptions}
            error={errors.customerId?.message}
            {...register('customerId')}
          />
          <Select
            label="Assign Executor"
            options={executorOptions}
            error={errors.executorId?.message}
            {...register('executorId')}
          />
        </div>
        <div className="mt-4 space-y-3">
          <Textarea
            label="Description"
            rows={2}
            placeholder="Order description..."
            error={errors.description?.message}
            {...register('description')}
          />
          <Textarea
            label="Comment"
            rows={2}
            placeholder="Additional notes..."
            error={errors.comment?.message}
            {...register('comment')}
          />
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Order Items</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ name: '', quantity: 1, price: 0, unit: 'pcs' })}
          >
            + Add Item
          </Button>
        </div>

        {fields.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No items added yet. Click "Add Item" to add order items.
          </p>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-end bg-gray-50 rounded-lg p-3">
                <div className="col-span-12 sm:col-span-4">
                  <Input
                    label={index === 0 ? 'Item Name' : undefined}
                    placeholder="Product name"
                    error={errors.items?.[index]?.name?.message}
                    {...register(`items.${index}.name`)}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Input
                    label={index === 0 ? 'Qty' : undefined}
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="1"
                    error={errors.items?.[index]?.quantity?.message}
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Input
                    label={index === 0 ? 'Unit' : undefined}
                    placeholder="pcs"
                    {...register(`items.${index}.unit`)}
                  />
                </div>
                <div className="col-span-4 sm:col-span-3">
                  <Input
                    label={index === 0 ? 'Price (USD)' : undefined}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    error={errors.items?.[index]?.price?.message}
                    {...register(`items.${index}.price`, { valueAsNumber: true })}
                  />
                </div>
                <div className="col-span-12 sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total */}
        {fields.length > 0 && (
          <div className="flex justify-end mt-4 pt-3 border-t border-gray-200">
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-xl font-bold text-gray-900">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalAmount)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="submit" isLoading={isLoading} size="lg">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};

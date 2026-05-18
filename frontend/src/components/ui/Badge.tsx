import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantClasses = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
};

const dotVariantClasses = {
  default: 'bg-gray-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  purple: 'bg-purple-500',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'sm',
  children,
  className,
  dot = false,
}) => {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full mr-1.5',
            dotVariantClasses[variant],
          )}
        />
      )}
      {children}
    </span>
  );
};

import React from 'react';
import { clsx } from 'clsx';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  className?: string;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-100 text-blue-600',
    text: 'text-blue-600',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'bg-green-100 text-green-600',
    text: 'text-green-600',
  },
  yellow: {
    bg: 'bg-yellow-50',
    icon: 'bg-yellow-100 text-yellow-600',
    text: 'text-yellow-600',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-100 text-red-600',
    text: 'text-red-600',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-purple-100 text-purple-600',
    text: 'text-purple-600',
  },
};

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'blue',
  className,
}) => {
  const colors = colorClasses[color];

  return (
    <div
      className={clsx(
        'bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4',
        className,
      )}
    >
      {icon && (
        <div className={clsx('p-3 rounded-xl flex-shrink-0', colors.icon)}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <span
              className={clsx(
                'flex items-center text-xs font-medium',
                trend.direction === 'up' && 'text-green-600',
                trend.direction === 'down' && 'text-red-600',
                trend.direction === 'neutral' && 'text-gray-500',
              )}
            >
              {trend.direction === 'up' && (
                <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
              {trend.direction === 'down' && (
                <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              {trend.value}%
            </span>
            <span className="text-xs text-gray-400">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
};

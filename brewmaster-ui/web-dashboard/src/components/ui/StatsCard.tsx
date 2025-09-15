import React, { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    type: 'increase' | 'decrease';
  };
  icon: ReactNode;
  iconColor?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon,
  iconColor = 'text-brand-600',
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg bg-brand-50 ${iconColor}`}>
          {icon}
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {change && (
              <p
                className={`ml-2 flex items-baseline text-sm font-semibold ${
                  change.type === 'increase'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {change.type === 'increase' ? '↗' : '↘'} {change.value}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
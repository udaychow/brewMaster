import React from 'react';
import { Card } from '../../components/ui/Card';

export const SchedulePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Production Schedule</h1>
        <p className="mt-1 text-sm text-gray-600">Plan brewing activities</p>
      </div>
      <Card><div className="text-center py-12"><p className="text-gray-500">Production Schedule coming soon...</p></div></Card>
    </div>
  );
};

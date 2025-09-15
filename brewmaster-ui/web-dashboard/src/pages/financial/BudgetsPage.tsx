import React from 'react';
import { Card } from '../../components/ui/Card';

export const BudgetsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold text-gray-900">Budgets</h1></div>
      <Card><div className="text-center py-12"><p className="text-gray-500">Budgets management coming soon...</p></div></Card>
    </div>
  );
};

import React from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';

export const BatchDetailPage: React.FC = () => {
  const { id } = useParams();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Batch Details</h1>
        <p className="mt-1 text-sm text-gray-600">
          Viewing batch {id}
        </p>
      </div>
      
      <Card>
        <div className="text-center py-12">
          <p className="text-gray-500">Batch details coming soon...</p>
        </div>
      </Card>
    </div>
  );
};
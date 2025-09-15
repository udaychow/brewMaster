import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { StatsCard } from '../../components/ui/StatsCard';
import {
  BeakerIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

export const ProductionPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Production Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your brewing operations, batches, and recipes
        </p>
      </div>

      {/* Production Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Batches"
          value="12"
          icon={<BeakerIcon className="h-6 w-6" />}
        />
        <StatsCard
          title="Completed This Month"
          value="8"
          icon={<ChartBarIcon className="h-6 w-6" />}
        />
        <StatsCard
          title="Recipes"
          value="24"
          icon={<ClipboardDocumentListIcon className="h-6 w-6" />}
        />
        <StatsCard
          title="Scheduled Today"
          value="3"
          icon={<CalendarIcon className="h-6 w-6" />}
        />
      </div>

      {/* Production Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/production/batches">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <div className="text-center">
              <BeakerIcon className="h-12 w-12 text-brand-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Batches</h3>
              <p className="text-gray-600 text-sm">
                Track and manage all brewing batches
              </p>
            </div>
          </Card>
        </Link>

        <Link to="/production/recipes">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <div className="text-center">
              <ClipboardDocumentListIcon className="h-12 w-12 text-brand-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Recipes</h3>
              <p className="text-gray-600 text-sm">
                Create and manage brewing recipes
              </p>
            </div>
          </Card>
        </Link>

        <Link to="/production/schedule">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <div className="text-center">
              <CalendarIcon className="h-12 w-12 text-brand-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Schedule</h3>
              <p className="text-gray-600 text-sm">
                Plan and schedule brewing activities
              </p>
            </div>
          </Card>
        </Link>

        <Link to="/production/fermentation">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <div className="text-center">
              <ChartBarIcon className="h-12 w-12 text-brand-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Fermentation</h3>
              <p className="text-gray-600 text-sm">
                Monitor fermentation progress
              </p>
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <Card title="Recent Production Activity">
        <div className="space-y-4">
          {[
            { action: 'Batch B-2024-045 moved to fermentation', time: '2 hours ago' },
            { action: 'Quality check completed for B-2024-043', time: '4 hours ago' },
            { action: 'New recipe "Summer Wheat" created', time: '1 day ago' },
            { action: 'Batch B-2024-042 completed', time: '2 days ago' },
          ].map((item, index) => (
            <div key={index} className="flex justify-between items-center py-2">
              <span className="text-gray-900">{item.action}</span>
              <span className="text-gray-500 text-sm">{item.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
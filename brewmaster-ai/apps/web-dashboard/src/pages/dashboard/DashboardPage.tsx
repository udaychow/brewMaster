import React, { useEffect, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { apiClient } from '@brewmaster/api-client';
import { DashboardStats } from '@brewmaster/shared-types';
import { StatsCard } from '../../components/ui/StatsCard';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import {
  BeakerIcon,
  CubeTransparentIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const mockRevenueData = [
  { month: 'Jan', revenue: 65000, expenses: 42000 },
  { month: 'Feb', revenue: 72000, expenses: 45000 },
  { month: 'Mar', revenue: 68000, expenses: 44000 },
  { month: 'Apr', revenue: 75000, expenses: 48000 },
  { month: 'May', revenue: 82000, expenses: 52000 },
  { month: 'Jun', revenue: 78000, expenses: 50000 },
];

const mockProductionData = [
  { name: 'IPA', value: 35, color: '#8884d8' },
  { name: 'Lager', value: 28, color: '#82ca9d' },
  { name: 'Stout', value: 20, color: '#ffc658' },
  { name: 'Wheat', value: 17, color: '#ff7c7c' },
];

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useApp();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Mock data since backend might not be fully implemented
        const mockStats: DashboardStats = {
          totalBatches: 45,
          activeBatches: 12,
          totalCustomers: 1247,
          monthlyRevenue: 78000,
          inventoryAlerts: 8,
          complianceAlerts: 3,
        };
        
        // Simulate API delay
        setTimeout(() => {
          setStats(mockStats);
          setLoading(false);
        }, 1000);
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to load dashboard data',
        });
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [addNotification]);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Welcome back!</h1>
        <p className="mt-1 text-sm text-gray-600">
          Here's what's happening with your brewery today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Active Batches"
          value={stats.activeBatches}
          change={{ value: '+2 from yesterday', type: 'increase' }}
          icon={<BeakerIcon className="h-6 w-6" />}
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Inventory Alerts"
          value={stats.inventoryAlerts}
          change={{ value: '-3 from last week', type: 'decrease' }}
          icon={<CubeTransparentIcon className="h-6 w-6" />}
          iconColor="text-yellow-600"
        />
        <StatsCard
          title="Total Customers"
          value={stats.totalCustomers}
          change={{ value: '+127 this month', type: 'increase' }}
          icon={<UsersIcon className="h-6 w-6" />}
          iconColor="text-green-600"
        />
        <StatsCard
          title="Monthly Revenue"
          value={`$${stats.monthlyRevenue.toLocaleString()}`}
          change={{ value: '+12% vs last month', type: 'increase' }}
          icon={<CurrencyDollarIcon className="h-6 w-6" />}
          iconColor="text-emerald-600"
        />
        <StatsCard
          title="Compliance Alerts"
          value={stats.complianceAlerts}
          icon={<ShieldCheckIcon className="h-6 w-6" />}
          iconColor="text-red-600"
        />
        <StatsCard
          title="Total Batches"
          value={stats.totalBatches}
          change={{ value: '+5 this month', type: 'increase' }}
          icon={<BeakerIcon className="h-6 w-6" />}
          iconColor="text-purple-600"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card title="Revenue vs Expenses">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Revenue"
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Expenses"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Production Mix Chart */}
        <Card title="Production Mix">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockProductionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {mockProductionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Recent Activity">
            <div className="flow-root">
              <ul className="-mb-8">
                {[
                  {
                    id: 1,
                    content: 'Batch #B-2024-045 moved to fermentation',
                    time: '2 hours ago',
                    type: 'production',
                  },
                  {
                    id: 2,
                    content: 'Low stock alert: Cascade Hops (5 lbs remaining)',
                    time: '4 hours ago',
                    type: 'inventory',
                  },
                  {
                    id: 3,
                    content: 'Quality check completed for Batch #B-2024-043',
                    time: '6 hours ago',
                    type: 'quality',
                  },
                  {
                    id: 4,
                    content: 'New customer registered: John Smith',
                    time: '8 hours ago',
                    type: 'customer',
                  },
                ].map((item, index) => (
                  <li key={item.id}>
                    <div className="relative pb-8">
                      {index !== 3 && (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-brand-500 flex items-center justify-center ring-8 ring-white">
                            <BeakerIcon className="h-5 w-5 text-white" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">{item.content}</p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            <time>{item.time}</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>

        <Card title="Quick Actions">
          <div className="space-y-3">
            <button className="w-full btn-primary text-left">
              Start New Batch
            </button>
            <button className="w-full btn-secondary text-left">
              Create Purchase Order
            </button>
            <button className="w-full btn-secondary text-left">
              Add Customer
            </button>
            <button className="w-full btn-secondary text-left">
              Generate Report
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
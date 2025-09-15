import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import {
  XMarkIcon,
  HomeIcon,
  BeakerIcon,
  CubeTransparentIcon,
  UsersIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  CpuChipIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  ChartBarIcon,
  TruckIcon,
  DocumentTextIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
  },
  {
    name: 'Production',
    icon: BeakerIcon,
    children: [
      { name: 'Overview', href: '/production' },
      { name: 'Batches', href: '/production/batches' },
      { name: 'Recipes', href: '/production/recipes' },
      { name: 'Schedule', href: '/production/schedule' },
      { name: 'Fermentation', href: '/production/fermentation' },
    ],
  },
  {
    name: 'Inventory',
    icon: CubeTransparentIcon,
    children: [
      { name: 'Overview', href: '/inventory' },
      { name: 'Ingredients', href: '/inventory/ingredients' },
      { name: 'Suppliers', href: '/inventory/suppliers' },
      { name: 'Purchase Orders', href: '/inventory/purchase-orders' },
    ],
  },
  {
    name: 'Customers',
    icon: UsersIcon,
    children: [
      { name: 'Overview', href: '/customers' },
      { name: 'Customer List', href: '/customers/list' },
      { name: 'Reservations', href: '/customers/reservations' },
      { name: 'Events', href: '/customers/events' },
    ],
  },
  {
    name: 'Compliance',
    icon: ShieldCheckIcon,
    children: [
      { name: 'Overview', href: '/compliance' },
      { name: 'Licenses', href: '/compliance/licenses' },
      { name: 'Reports', href: '/compliance/reports' },
      { name: 'Inspections', href: '/compliance/inspections' },
    ],
  },
  {
    name: 'Financial',
    icon: CurrencyDollarIcon,
    children: [
      { name: 'Overview', href: '/financial' },
      { name: 'Transactions', href: '/financial/transactions' },
      { name: 'Budgets', href: '/financial/budgets' },
      { name: 'Invoices', href: '/financial/invoices' },
      { name: 'Reports', href: '/financial/reports' },
    ],
  },
  {
    name: 'AI Agents',
    icon: CpuChipIcon,
    children: [
      { name: 'Overview', href: '/agents' },
      { name: 'Tasks', href: '/agents/tasks' },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const { sidebarOpen, setSidebarOpen } = useApp();

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex items-center justify-between h-16 px-4 bg-gray-800">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🍺</div>
            <span className="text-white font-semibold text-lg">BrewMaster</span>
          </div>
          <button
            type="button"
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <div key={item.name}>
              {item.children ? (
                <NavigationGroup item={item} />
              ) : (
                <NavLink
                  to={item.href!}
                  className={({ isActive }) =>
                    `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                      isActive
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                >
                  <item.icon
                    className="mr-3 h-6 w-6 flex-shrink-0"
                    aria-hidden="true"
                  />
                  {item.name}
                </NavLink>
              )}
            </div>
          ))}
        </nav>
      </div>
    </>
  );
};

const NavigationGroup: React.FC<{ item: any }> = ({ item }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full group flex items-center px-2 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors duration-200"
      >
        <item.icon
          className="mr-3 h-6 w-6 flex-shrink-0"
          aria-hidden="true"
        />
        <span className="flex-1 text-left">{item.name}</span>
        <svg
          className={`ml-3 h-5 w-5 transform transition-transform duration-200 ${
            isOpen ? 'rotate-90' : ''
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="space-y-1">
          {item.children.map((child: any) => (
            <NavLink
              key={child.name}
              to={child.href}
              className={({ isActive }) =>
                `group flex items-center pl-11 pr-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }
            >
              {child.name}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};
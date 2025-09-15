import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { AuthLayout } from '../components/auth/AuthLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { ProductionPage } from '../pages/production/ProductionPage';
import { BatchListPage } from '../pages/production/BatchListPage';
import { BatchDetailPage } from '../pages/production/BatchDetailPage';
import { RecipeListPage } from '../pages/production/RecipeListPage';
import { RecipeDetailPage } from '../pages/production/RecipeDetailPage';
import { SchedulePage } from '../pages/production/SchedulePage';
import { FermentationPage } from '../pages/production/FermentationPage';
import { InventoryPage } from '../pages/inventory/InventoryPage';
import { IngredientsPage } from '../pages/inventory/IngredientsPage';
import { SuppliersPage } from '../pages/inventory/SuppliersPage';
import { PurchaseOrdersPage } from '../pages/inventory/PurchaseOrdersPage';
import { CustomerPage } from '../pages/customers/CustomerPage';
import { CustomerListPage } from '../pages/customers/CustomerListPage';
import { ReservationsPage } from '../pages/customers/ReservationsPage';
import { EventsPage } from '../pages/customers/EventsPage';
import { CompliancePage } from '../pages/compliance/CompliancePage';
import { LicensesPage } from '../pages/compliance/LicensesPage';
import { ReportsPage } from '../pages/compliance/ReportsPage';
import { InspectionsPage } from '../pages/compliance/InspectionsPage';
import { FinancialPage } from '../pages/financial/FinancialPage';
import { TransactionsPage } from '../pages/financial/TransactionsPage';
import { BudgetsPage } from '../pages/financial/BudgetsPage';
import { InvoicesPage } from '../pages/financial/InvoicesPage';
import { FinancialReportsPage } from '../pages/financial/FinancialReportsPage';
import { AgentsPage } from '../pages/agents/AgentsPage';
import { TasksPage } from '../pages/agents/TasksPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
    ],
  },
  {
    path: '/',
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'production',
        children: [
          {
            index: true,
            element: <ProductionPage />,
          },
          {
            path: 'batches',
            children: [
              {
                index: true,
                element: <BatchListPage />,
              },
              {
                path: ':id',
                element: <BatchDetailPage />,
              },
            ],
          },
          {
            path: 'recipes',
            children: [
              {
                index: true,
                element: <RecipeListPage />,
              },
              {
                path: ':id',
                element: <RecipeDetailPage />,
              },
            ],
          },
          {
            path: 'schedule',
            element: <SchedulePage />,
          },
          {
            path: 'fermentation',
            element: <FermentationPage />,
          },
        ],
      },
      {
        path: 'inventory',
        children: [
          {
            index: true,
            element: <InventoryPage />,
          },
          {
            path: 'ingredients',
            element: <IngredientsPage />,
          },
          {
            path: 'suppliers',
            element: <SuppliersPage />,
          },
          {
            path: 'purchase-orders',
            element: <PurchaseOrdersPage />,
          },
        ],
      },
      {
        path: 'customers',
        children: [
          {
            index: true,
            element: <CustomerPage />,
          },
          {
            path: 'list',
            element: <CustomerListPage />,
          },
          {
            path: 'reservations',
            element: <ReservationsPage />,
          },
          {
            path: 'events',
            element: <EventsPage />,
          },
        ],
      },
      {
        path: 'compliance',
        children: [
          {
            index: true,
            element: <CompliancePage />,
          },
          {
            path: 'licenses',
            element: <LicensesPage />,
          },
          {
            path: 'reports',
            element: <ReportsPage />,
          },
          {
            path: 'inspections',
            element: <InspectionsPage />,
          },
        ],
      },
      {
        path: 'financial',
        children: [
          {
            index: true,
            element: <FinancialPage />,
          },
          {
            path: 'transactions',
            element: <TransactionsPage />,
          },
          {
            path: 'budgets',
            element: <BudgetsPage />,
          },
          {
            path: 'invoices',
            element: <InvoicesPage />,
          },
          {
            path: 'reports',
            element: <FinancialReportsPage />,
          },
        ],
      },
      {
        path: 'agents',
        children: [
          {
            index: true,
            element: <AgentsPage />,
          },
          {
            path: 'tasks',
            element: <TasksPage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
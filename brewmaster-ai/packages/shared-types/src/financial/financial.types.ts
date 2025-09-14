export interface Transaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  currency: string;
  description: string;
  date: Date;
  accountId: string;
  customerId?: string;
  orderId?: string;
  batchId?: string;
  status: TransactionStatus;
  paymentMethod?: PaymentMethod;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense'
}

export enum TransactionCategory {
  // Income
  BEER_SALES = 'beer_sales',
  FOOD_SALES = 'food_sales',
  EVENT_REVENUE = 'event_revenue',
  MERCHANDISE = 'merchandise',
  OTHER_INCOME = 'other_income',
  
  // Expenses
  INGREDIENTS = 'ingredients',
  UTILITIES = 'utilities',
  PAYROLL = 'payroll',
  RENT = 'rent',
  EQUIPMENT = 'equipment',
  MARKETING = 'marketing',
  INSURANCE = 'insurance',
  LICENSES = 'licenses',
  OTHER_EXPENSE = 'other_expense'
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  CHECK = 'check',
  DIGITAL_WALLET = 'digital_wallet'
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  accountNumber?: string;
  bankName?: string;
  currentBalance: number;
  currency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum AccountType {
  CHECKING = 'checking',
  SAVINGS = 'savings',
  CREDIT = 'credit',
  CASH = 'cash',
  INVESTMENT = 'investment'
}

export interface Budget {
  id: string;
  name: string;
  period: BudgetPeriod;
  startDate: Date;
  endDate: Date;
  categories: BudgetCategory[];
  totalBudget: number;
  totalSpent: number;
  status: BudgetStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum BudgetPeriod {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually'
}

export interface BudgetCategory {
  category: TransactionCategory;
  budgetedAmount: number;
  spentAmount: number;
  remainingAmount: number;
}

export enum BudgetStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  EXCEEDED = 'exceeded'
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  supplierId?: string;
  type: InvoiceType;
  issueDate: Date;
  dueDate: Date;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  paymentDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum InvoiceType {
  SALES = 'sales',
  PURCHASE = 'purchase'
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxRate?: number;
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

export interface FinancialReport {
  id: string;
  reportType: FinancialReportType;
  period: ReportPeriod;
  startDate: Date;
  endDate: Date;
  data: FinancialReportData;
  generatedAt: Date;
  generatedBy: string;
}

export enum FinancialReportType {
  PROFIT_LOSS = 'profit_loss',
  BALANCE_SHEET = 'balance_sheet',
  CASH_FLOW = 'cash_flow',
  BUDGET_VARIANCE = 'budget_variance'
}

export interface ReportPeriod {
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  year: number;
  month?: number;
  quarter?: number;
  week?: number;
}

export interface FinancialReportData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  grossMargin: number;
  categoryBreakdown: CategoryBreakdown[];
  trends: TrendData[];
}

export interface CategoryBreakdown {
  category: TransactionCategory;
  amount: number;
  percentage: number;
}

export interface TrendData {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
}
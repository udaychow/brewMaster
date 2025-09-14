import axios, { AxiosInstance } from 'axios';
import {
  // Batch Types
  Batch,
  BatchStatus,
  FermentationLog,
  QualityCheck,
  // Recipe Types
  Recipe,
  BrewingSchedule,
  Equipment,
  // AI Types
  Agent,
  Task,
  // Common Types
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  FilterOptions,
  DashboardStats,
  // Namespaced imports
  InventoryTypes,
  CustomerTypes,
  ComplianceTypes,
  FinancialTypes,
} from '@brewmaster/shared-types';

// Type aliases for convenience
type Ingredient = InventoryTypes.Ingredient;
type Supplier = InventoryTypes.Supplier;
type PurchaseOrder = InventoryTypes.PurchaseOrder;
type StockAlert = InventoryTypes.StockAlert;
type Customer = CustomerTypes.Customer;
type Reservation = CustomerTypes.Reservation;
type Event = CustomerTypes.Event;
type Review = CustomerTypes.Review;
type License = ComplianceTypes.License;
type ComplianceReport = ComplianceTypes.ComplianceReport;
type Inspection = ComplianceTypes.Inspection;
type ComplianceAlert = ComplianceTypes.ComplianceAlert;
type Transaction = FinancialTypes.Transaction;
type Account = FinancialTypes.Account;
type Budget = FinancialTypes.Budget;
type Invoice = FinancialTypes.Invoice;
type FinancialReport = FinancialTypes.FinancialReport;

// Auth types (these should be in common)
interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

interface AuthTokens {
  token: string;
  refreshToken?: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = 'http://localhost:3000') {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for auth token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle token refresh or logout
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  get axios() {
    return this.client;
  }

  // Authentication API
  auth = {
    login: (credentials: LoginCredentials): Promise<ApiResponse<AuthTokens & { user: User }>> =>
      this.client.post('/api/auth/login', credentials).then(res => res.data),
    
    register: (data: RegisterData): Promise<ApiResponse<User>> =>
      this.client.post('/api/auth/register', data).then(res => res.data),
    
    logout: (): Promise<ApiResponse<void>> =>
      this.client.post('/api/auth/logout').then(res => res.data),
    
    refreshToken: (): Promise<ApiResponse<AuthTokens>> =>
      this.client.post('/api/auth/refresh').then(res => res.data),
    
    getProfile: (): Promise<ApiResponse<User>> =>
      this.client.get('/api/auth/profile').then(res => res.data),
  };

  // Production API
  production = {
    // Batches
    getBatches: (params?: PaginationParams & FilterOptions): Promise<PaginatedResponse<Batch>> =>
      this.client.get('/api/production/batches', { params }).then(res => res.data),
    
    getBatch: (id: string): Promise<ApiResponse<Batch>> =>
      this.client.get(`/api/production/batches/${id}`).then(res => res.data),
    
    createBatch: (batch: Omit<Batch, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Batch>> =>
      this.client.post('/api/production/batches', batch).then(res => res.data),
    
    updateBatch: (id: string, batch: Partial<Batch>): Promise<ApiResponse<Batch>> =>
      this.client.put(`/api/production/batches/${id}`, batch).then(res => res.data),
    
    updateBatchStatus: (id: string, status: BatchStatus): Promise<ApiResponse<Batch>> =>
      this.client.patch(`/api/production/batches/${id}/status`, { status }).then(res => res.data),
    
    addFermentationLog: (batchId: string, log: Omit<FermentationLog, 'id' | 'batchId'>): Promise<ApiResponse<FermentationLog>> =>
      this.client.post(`/api/production/batches/${batchId}/fermentation-logs`, log).then(res => res.data),
    
    addQualityCheck: (batchId: string, check: Omit<QualityCheck, 'id' | 'batchId'>): Promise<ApiResponse<QualityCheck>> =>
      this.client.post(`/api/production/batches/${batchId}/quality-checks`, check).then(res => res.data),

    // Recipes
    getRecipes: (params?: PaginationParams & FilterOptions): Promise<PaginatedResponse<Recipe>> =>
      this.client.get('/api/production/recipes', { params }).then(res => res.data),
    
    getRecipe: (id: string): Promise<ApiResponse<Recipe>> =>
      this.client.get(`/api/production/recipes/${id}`).then(res => res.data),
    
    createRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Recipe>> =>
      this.client.post('/api/production/recipes', recipe).then(res => res.data),
    
    updateRecipe: (id: string, recipe: Partial<Recipe>): Promise<ApiResponse<Recipe>> =>
      this.client.put(`/api/production/recipes/${id}`, recipe).then(res => res.data),
    
    deleteRecipe: (id: string): Promise<ApiResponse<void>> =>
      this.client.delete(`/api/production/recipes/${id}`).then(res => res.data),

    // Scheduling
    getSchedule: (params?: FilterOptions): Promise<ApiResponse<BrewingSchedule[]>> =>
      this.client.get('/api/production/schedule', { params }).then(res => res.data),
    
    createSchedule: (schedule: Omit<BrewingSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<BrewingSchedule>> =>
      this.client.post('/api/production/schedule', schedule).then(res => res.data),

    // Equipment
    getEquipment: (): Promise<ApiResponse<Equipment[]>> =>
      this.client.get('/api/production/equipment').then(res => res.data),
    
    updateEquipmentStatus: (id: string, status: string): Promise<ApiResponse<Equipment>> =>
      this.client.patch(`/api/production/equipment/${id}/status`, { status }).then(res => res.data),
  };

  // Inventory API
  inventory = {
    // Ingredients
    getIngredients: (params?: PaginationParams & FilterOptions): Promise<PaginatedResponse<Ingredient>> =>
      this.client.get('/api/inventory/ingredients', { params }).then(res => res.data),
    
    getIngredient: (id: string): Promise<ApiResponse<Ingredient>> =>
      this.client.get(`/api/inventory/ingredients/${id}`).then(res => res.data),
    
    createIngredient: (ingredient: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Ingredient>> =>
      this.client.post('/api/inventory/ingredients', ingredient).then(res => res.data),
    
    updateIngredient: (id: string, ingredient: Partial<Ingredient>): Promise<ApiResponse<Ingredient>> =>
      this.client.put(`/api/inventory/ingredients/${id}`, ingredient).then(res => res.data),
    
    adjustStock: (id: string, quantity: number, reason: string): Promise<ApiResponse<Ingredient>> =>
      this.client.patch(`/api/inventory/ingredients/${id}/adjust`, { quantity, reason }).then(res => res.data),

    // Suppliers
    getSuppliers: (params?: PaginationParams & FilterOptions): Promise<PaginatedResponse<Supplier>> =>
      this.client.get('/api/inventory/suppliers', { params }).then(res => res.data),
    
    getSupplier: (id: string): Promise<ApiResponse<Supplier>> =>
      this.client.get(`/api/inventory/suppliers/${id}`).then(res => res.data),
    
    createSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Supplier>> =>
      this.client.post('/api/inventory/suppliers', supplier).then(res => res.data),
    
    updateSupplier: (id: string, supplier: Partial<Supplier>): Promise<ApiResponse<Supplier>> =>
      this.client.put(`/api/inventory/suppliers/${id}`, supplier).then(res => res.data),

    // Purchase Orders
    getPurchaseOrders: (params?: PaginationParams & FilterOptions): Promise<PaginatedResponse<PurchaseOrder>> =>
      this.client.get('/api/inventory/purchase-orders', { params }).then(res => res.data),
    
    getPurchaseOrder: (id: string): Promise<ApiResponse<PurchaseOrder>> =>
      this.client.get(`/api/inventory/purchase-orders/${id}`).then(res => res.data),
    
    createPurchaseOrder: (order: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<PurchaseOrder>> =>
      this.client.post('/api/inventory/purchase-orders', order).then(res => res.data),
    
    updatePurchaseOrderStatus: (id: string, status: string): Promise<ApiResponse<PurchaseOrder>> =>
      this.client.patch(`/api/inventory/purchase-orders/${id}/status`, { status }).then(res => res.data),

    // Alerts
    getStockAlerts: (): Promise<ApiResponse<StockAlert[]>> =>
      this.client.get('/api/inventory/alerts').then(res => res.data),
    
    resolveAlert: (id: string): Promise<ApiResponse<StockAlert>> =>
      this.client.patch(`/api/inventory/alerts/${id}/resolve`).then(res => res.data),
  };

  // Customer API
  customers = {
    getCustomers: (params?: PaginationParams & FilterOptions): Promise<PaginatedResponse<Customer>> =>
      this.client.get('/api/customers', { params }).then(res => res.data),
    
    getCustomer: (id: string): Promise<ApiResponse<Customer>> =>
      this.client.get(`/api/customers/${id}`).then(res => res.data),
    
    createCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Customer>> =>
      this.client.post('/api/customers', customer).then(res => res.data),
    
    updateCustomer: (id: string, customer: Partial<Customer>): Promise<ApiResponse<Customer>> =>
      this.client.put(`/api/customers/${id}`, customer).then(res => res.data),

    // Reservations
    getReservations: (params?: PaginationParams & FilterOptions): Promise<PaginatedResponse<Reservation>> =>
      this.client.get('/api/customers/reservations', { params }).then(res => res.data),
    
    createReservation: (reservation: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Reservation>> =>
      this.client.post('/api/customers/reservations', reservation).then(res => res.data),
    
    updateReservationStatus: (id: string, status: string): Promise<ApiResponse<Reservation>> =>
      this.client.patch(`/api/customers/reservations/${id}/status`, { status }).then(res => res.data),

    // Events
    getEvents: (params?: PaginationParams & FilterOptions): Promise<PaginatedResponse<Event>> =>
      this.client.get('/api/customers/events', { params }).then(res => res.data),
    
    createEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Event>> =>
      this.client.post('/api/customers/events', event).then(res => res.data),

    // Reviews
    getReviews: (params?: PaginationParams & FilterOptions): Promise<PaginatedResponse<Review>> =>
      this.client.get('/api/customers/reviews', { params }).then(res => res.data),
  };

  // Compliance API
  compliance = {
    getLicenses: (): Promise<ApiResponse<License[]>> =>
      this.client.get('/api/compliance/licenses').then(res => res.data),
    
    updateLicense: (id: string, license: Partial<License>): Promise<ApiResponse<License>> =>
      this.client.put(`/api/compliance/licenses/${id}`, license).then(res => res.data),

    getReports: (params?: PaginationParams & FilterOptions): Promise<PaginatedResponse<ComplianceReport>> =>
      this.client.get('/api/compliance/reports', { params }).then(res => res.data),
    
    generateReport: (reportType: string, period: any): Promise<ApiResponse<ComplianceReport>> =>
      this.client.post('/api/compliance/reports/generate', { reportType, period }).then(res => res.data),
    
    submitReport: (id: string): Promise<ApiResponse<ComplianceReport>> =>
      this.client.patch(`/api/compliance/reports/${id}/submit`).then(res => res.data),

    getInspections: (): Promise<ApiResponse<Inspection[]>> =>
      this.client.get('/api/compliance/inspections').then(res => res.data),
    
    createInspection: (inspection: Omit<Inspection, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Inspection>> =>
      this.client.post('/api/compliance/inspections', inspection).then(res => res.data),

    getAlerts: (): Promise<ApiResponse<ComplianceAlert[]>> =>
      this.client.get('/api/compliance/alerts').then(res => res.data),
    
    resolveAlert: (id: string): Promise<ApiResponse<ComplianceAlert>> =>
      this.client.patch(`/api/compliance/alerts/${id}/resolve`).then(res => res.data),
  };

  // Financial API
  financial = {
    getTransactions: (params?: PaginationParams & FilterOptions): Promise<PaginatedResponse<Transaction>> =>
      this.client.get('/api/financial/transactions', { params }).then(res => res.data),
    
    createTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Transaction>> =>
      this.client.post('/api/financial/transactions', transaction).then(res => res.data),

    getAccounts: (): Promise<ApiResponse<Account[]>> =>
      this.client.get('/api/financial/accounts').then(res => res.data),
    
    createAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Account>> =>
      this.client.post('/api/financial/accounts', account).then(res => res.data),

    getBudgets: (): Promise<ApiResponse<Budget[]>> =>
      this.client.get('/api/financial/budgets').then(res => res.data),
    
    createBudget: (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Budget>> =>
      this.client.post('/api/financial/budgets', budget).then(res => res.data),

    getInvoices: (params?: PaginationParams & FilterOptions): Promise<PaginatedResponse<Invoice>> =>
      this.client.get('/api/financial/invoices', { params }).then(res => res.data),
    
    createInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Invoice>> =>
      this.client.post('/api/financial/invoices', invoice).then(res => res.data),

    getReports: (type: string, period: any): Promise<ApiResponse<FinancialReport>> =>
      this.client.get(`/api/financial/reports/${type}`, { params: period }).then(res => res.data),
  };

  // AI Agents API
  agents = {
    getAgents: (): Promise<ApiResponse<Agent[]>> =>
      this.client.get('/api/agents').then(res => res.data),
    
    getAgent: (id: string): Promise<ApiResponse<Agent>> =>
      this.client.get(`/api/agents/${id}`).then(res => res.data),
    
    updateAgentStatus: (id: string, status: string): Promise<ApiResponse<Agent>> =>
      this.client.patch(`/api/agents/${id}/status`, { status }).then(res => res.data),

    getTasks: (params?: PaginationParams & FilterOptions): Promise<PaginatedResponse<Task>> =>
      this.client.get('/api/agents/tasks', { params }).then(res => res.data),
    
    createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Task>> =>
      this.client.post('/api/agents/tasks', task).then(res => res.data),
    
    assignTask: (taskId: string, agentId: string): Promise<ApiResponse<Task>> =>
      this.client.patch(`/api/agents/tasks/${taskId}/assign`, { agentId }).then(res => res.data),
  };

  // Dashboard API
  dashboard = {
    getStats: (): Promise<ApiResponse<DashboardStats>> =>
      this.client.get('/api/dashboard/stats').then(res => res.data),
    
    getChartData: (chartType: string, period: string): Promise<ApiResponse<any>> =>
      this.client.get(`/api/dashboard/charts/${chartType}`, { params: { period } }).then(res => res.data),
  };
}

export const apiClient = new ApiClient();
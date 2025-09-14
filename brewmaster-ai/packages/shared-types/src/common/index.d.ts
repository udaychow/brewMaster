export interface ApiResponse<T> {
    data: T;
    message?: string;
    success: boolean;
}
export interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export interface FilterOptions {
    [key: string]: any;
}
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    permissions: Permission[];
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum UserRole {
    ADMIN = "admin",
    MANAGER = "manager",
    BREWER = "brewer",
    SERVER = "server",
    VIEWER = "viewer"
}
export interface Permission {
    resource: string;
    actions: string[];
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
}
export interface LoginCredentials {
    email: string;
    password: string;
}
export interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
}
export interface DashboardStats {
    totalBatches: number;
    activeBatches: number;
    totalCustomers: number;
    monthlyRevenue: number;
    inventoryAlerts: number;
    complianceAlerts: number;
}
export interface NotificationPreferences {
    email: boolean;
    push: boolean;
    sms: boolean;
}
export interface SystemSettings {
    brewery: BreweryInfo;
    currency: string;
    timezone: string;
    dateFormat: string;
    notifications: NotificationPreferences;
}
export interface BreweryInfo {
    name: string;
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    phone: string;
    email: string;
    website?: string;
    established?: Date;
    capacity: number;
}

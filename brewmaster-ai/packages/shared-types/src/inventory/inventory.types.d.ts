export interface Ingredient {
    id: string;
    name: string;
    type: IngredientType;
    category: string;
    unit: string;
    currentStock: number;
    minStock: number;
    maxStock: number;
    costPerUnit: number;
    supplierId: string;
    expirationDate?: Date;
    batchNumbers?: string[];
    createdAt: Date;
    updatedAt: Date;
}
export declare enum IngredientType {
    GRAIN = "grain",
    HOP = "hop",
    YEAST = "yeast",
    ADJUNCT = "adjunct",
    CHEMICAL = "chemical",
    PACKAGING = "packaging"
}
export interface Supplier {
    id: string;
    name: string;
    contactEmail: string;
    contactPhone: string;
    address: Address;
    paymentTerms: string;
    leadTime: number;
    reliabilityScore: number;
    ingredients: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}
export interface PurchaseOrder {
    id: string;
    orderNumber: string;
    supplierId: string;
    status: OrderStatus;
    orderDate: Date;
    expectedDeliveryDate: Date;
    actualDeliveryDate?: Date;
    items: PurchaseOrderItem[];
    totalAmount: number;
    notes?: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface PurchaseOrderItem {
    id: string;
    ingredientId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    receivedQuantity?: number;
}
export declare enum OrderStatus {
    DRAFT = "draft",
    SENT = "sent",
    CONFIRMED = "confirmed",
    SHIPPED = "shipped",
    DELIVERED = "delivered",
    CANCELLED = "cancelled"
}
export interface InventoryMovement {
    id: string;
    ingredientId: string;
    movementType: MovementType;
    quantity: number;
    referenceId?: string;
    referenceType?: string;
    reason: string;
    performedBy: string;
    timestamp: Date;
}
export declare enum MovementType {
    IN = "in",
    OUT = "out",
    ADJUSTMENT = "adjustment"
}
export interface StockAlert {
    id: string;
    ingredientId: string;
    alertType: AlertType;
    threshold: number;
    currentLevel: number;
    severity: AlertSeverity;
    isResolved: boolean;
    createdAt: Date;
    resolvedAt?: Date;
}
export declare enum AlertType {
    LOW_STOCK = "low_stock",
    OUT_OF_STOCK = "out_of_stock",
    EXPIRING_SOON = "expiring_soon",
    EXPIRED = "expired"
}
export declare enum AlertSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}

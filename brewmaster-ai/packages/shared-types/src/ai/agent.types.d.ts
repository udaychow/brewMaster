export interface Agent {
    id: string;
    type: AgentType;
    name: string;
    description: string;
    capabilities: AgentCapability[];
    status: AgentStatus;
    memory: AgentMemory;
    config: AgentConfig;
}
export declare enum AgentType {
    PRODUCTION_PLANNING = "production_planning",
    INVENTORY_INTELLIGENCE = "inventory_intelligence",
    COMPLIANCE = "compliance",
    CUSTOMER_EXPERIENCE = "customer_experience",
    FINANCIAL_OPERATIONS = "financial_operations"
}
export declare enum AgentStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    PROCESSING = "processing",
    ERROR = "error"
}
export interface AgentCapability {
    name: string;
    description: string;
    parameters: Record<string, any>;
}
export interface AgentMemory {
    shortTerm: Record<string, any>;
    longTerm: Record<string, any>;
    contextHistory: ContextEntry[];
}
export interface ContextEntry {
    timestamp: Date;
    context: string;
    relevance: number;
}
export interface AgentConfig {
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
}
export interface Task {
    id: string;
    type: string;
    priority: TaskPriority;
    assignedAgentId?: string;
    status: TaskStatus;
    input: Record<string, any>;
    output?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}
export declare enum TaskPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent"
}
export declare enum TaskStatus {
    PENDING = "pending",
    ASSIGNED = "assigned",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed"
}

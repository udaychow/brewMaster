"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskStatus = exports.TaskPriority = exports.AgentStatus = exports.AgentType = void 0;
var AgentType;
(function (AgentType) {
    AgentType["PRODUCTION_PLANNING"] = "production_planning";
    AgentType["INVENTORY_INTELLIGENCE"] = "inventory_intelligence";
    AgentType["COMPLIANCE"] = "compliance";
    AgentType["CUSTOMER_EXPERIENCE"] = "customer_experience";
    AgentType["FINANCIAL_OPERATIONS"] = "financial_operations";
})(AgentType || (exports.AgentType = AgentType = {}));
var AgentStatus;
(function (AgentStatus) {
    AgentStatus["ACTIVE"] = "active";
    AgentStatus["INACTIVE"] = "inactive";
    AgentStatus["PROCESSING"] = "processing";
    AgentStatus["ERROR"] = "error";
})(AgentStatus || (exports.AgentStatus = AgentStatus = {}));
var TaskPriority;
(function (TaskPriority) {
    TaskPriority["LOW"] = "low";
    TaskPriority["MEDIUM"] = "medium";
    TaskPriority["HIGH"] = "high";
    TaskPriority["URGENT"] = "urgent";
})(TaskPriority || (exports.TaskPriority = TaskPriority = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "pending";
    TaskStatus["ASSIGNED"] = "assigned";
    TaskStatus["PROCESSING"] = "processing";
    TaskStatus["COMPLETED"] = "completed";
    TaskStatus["FAILED"] = "failed";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));

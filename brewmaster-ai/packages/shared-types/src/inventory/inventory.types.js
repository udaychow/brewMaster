"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertSeverity = exports.AlertType = exports.MovementType = exports.OrderStatus = exports.IngredientType = void 0;
var IngredientType;
(function (IngredientType) {
    IngredientType["GRAIN"] = "grain";
    IngredientType["HOP"] = "hop";
    IngredientType["YEAST"] = "yeast";
    IngredientType["ADJUNCT"] = "adjunct";
    IngredientType["CHEMICAL"] = "chemical";
    IngredientType["PACKAGING"] = "packaging";
})(IngredientType || (exports.IngredientType = IngredientType = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["DRAFT"] = "draft";
    OrderStatus["SENT"] = "sent";
    OrderStatus["CONFIRMED"] = "confirmed";
    OrderStatus["SHIPPED"] = "shipped";
    OrderStatus["DELIVERED"] = "delivered";
    OrderStatus["CANCELLED"] = "cancelled";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var MovementType;
(function (MovementType) {
    MovementType["IN"] = "in";
    MovementType["OUT"] = "out";
    MovementType["ADJUSTMENT"] = "adjustment";
})(MovementType || (exports.MovementType = MovementType = {}));
var AlertType;
(function (AlertType) {
    AlertType["LOW_STOCK"] = "low_stock";
    AlertType["OUT_OF_STOCK"] = "out_of_stock";
    AlertType["EXPIRING_SOON"] = "expiring_soon";
    AlertType["EXPIRED"] = "expired";
})(AlertType || (exports.AlertType = AlertType = {}));
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["LOW"] = "low";
    AlertSeverity["MEDIUM"] = "medium";
    AlertSeverity["HIGH"] = "high";
    AlertSeverity["CRITICAL"] = "critical";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));

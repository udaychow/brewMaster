"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertSeverity = exports.AlertType = exports.ActionStatus = exports.FindingSeverity = exports.InspectionStatus = exports.InspectionType = exports.ReportStatus = exports.ReportingPeriod = exports.ReportType = exports.LicenseStatus = exports.LicenseType = void 0;
var LicenseType;
(function (LicenseType) {
    LicenseType["BREWING_LICENSE"] = "brewing_license";
    LicenseType["LIQUOR_LICENSE"] = "liquor_license";
    LicenseType["FOOD_SERVICE"] = "food_service";
    LicenseType["RETAIL"] = "retail";
    LicenseType["DISTRIBUTION"] = "distribution";
    LicenseType["HEALTH_PERMIT"] = "health_permit";
    LicenseType["FIRE_PERMIT"] = "fire_permit";
    LicenseType["BUILDING_PERMIT"] = "building_permit";
})(LicenseType || (exports.LicenseType = LicenseType = {}));
var LicenseStatus;
(function (LicenseStatus) {
    LicenseStatus["ACTIVE"] = "active";
    LicenseStatus["EXPIRED"] = "expired";
    LicenseStatus["PENDING_RENEWAL"] = "pending_renewal";
    LicenseStatus["SUSPENDED"] = "suspended";
    LicenseStatus["REVOKED"] = "revoked";
})(LicenseStatus || (exports.LicenseStatus = LicenseStatus = {}));
var ReportType;
(function (ReportType) {
    ReportType["MONTHLY_PRODUCTION"] = "monthly_production";
    ReportType["QUARTERLY_TAX"] = "quarterly_tax";
    ReportType["ANNUAL_SUMMARY"] = "annual_summary";
    ReportType["INVENTORY_REPORT"] = "inventory_report";
    ReportType["SALES_REPORT"] = "sales_report";
    ReportType["WASTE_REPORT"] = "waste_report";
})(ReportType || (exports.ReportType = ReportType = {}));
var ReportingPeriod;
(function (ReportingPeriod) {
    ReportingPeriod["DAILY"] = "daily";
    ReportingPeriod["WEEKLY"] = "weekly";
    ReportingPeriod["MONTHLY"] = "monthly";
    ReportingPeriod["QUARTERLY"] = "quarterly";
    ReportingPeriod["ANNUALLY"] = "annually";
})(ReportingPeriod || (exports.ReportingPeriod = ReportingPeriod = {}));
var ReportStatus;
(function (ReportStatus) {
    ReportStatus["DRAFT"] = "draft";
    ReportStatus["PENDING_REVIEW"] = "pending_review";
    ReportStatus["SUBMITTED"] = "submitted";
    ReportStatus["APPROVED"] = "approved";
    ReportStatus["REJECTED"] = "rejected";
    ReportStatus["OVERDUE"] = "overdue";
})(ReportStatus || (exports.ReportStatus = ReportStatus = {}));
var InspectionType;
(function (InspectionType) {
    InspectionType["ROUTINE"] = "routine";
    InspectionType["FOLLOW_UP"] = "follow_up";
    InspectionType["COMPLAINT"] = "complaint";
    InspectionType["LICENSE_RENEWAL"] = "license_renewal";
})(InspectionType || (exports.InspectionType = InspectionType = {}));
var InspectionStatus;
(function (InspectionStatus) {
    InspectionStatus["SCHEDULED"] = "scheduled";
    InspectionStatus["IN_PROGRESS"] = "in_progress";
    InspectionStatus["COMPLETED"] = "completed";
    InspectionStatus["PASSED"] = "passed";
    InspectionStatus["FAILED"] = "failed";
})(InspectionStatus || (exports.InspectionStatus = InspectionStatus = {}));
var FindingSeverity;
(function (FindingSeverity) {
    FindingSeverity["LOW"] = "low";
    FindingSeverity["MEDIUM"] = "medium";
    FindingSeverity["HIGH"] = "high";
    FindingSeverity["CRITICAL"] = "critical";
})(FindingSeverity || (exports.FindingSeverity = FindingSeverity = {}));
var ActionStatus;
(function (ActionStatus) {
    ActionStatus["PENDING"] = "pending";
    ActionStatus["IN_PROGRESS"] = "in_progress";
    ActionStatus["COMPLETED"] = "completed";
    ActionStatus["OVERDUE"] = "overdue";
})(ActionStatus || (exports.ActionStatus = ActionStatus = {}));
var AlertType;
(function (AlertType) {
    AlertType["LICENSE_EXPIRING"] = "license_expiring";
    AlertType["REPORT_OVERDUE"] = "report_overdue";
    AlertType["INSPECTION_SCHEDULED"] = "inspection_scheduled";
    AlertType["VIOLATION_DETECTED"] = "violation_detected";
    AlertType["RENEWAL_REQUIRED"] = "renewal_required";
})(AlertType || (exports.AlertType = AlertType = {}));
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["INFO"] = "info";
    AlertSeverity["WARNING"] = "warning";
    AlertSeverity["ERROR"] = "error";
    AlertSeverity["CRITICAL"] = "critical";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));

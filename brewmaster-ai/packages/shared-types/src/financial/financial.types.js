"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialReportType = exports.InvoiceStatus = exports.InvoiceType = exports.BudgetStatus = exports.BudgetPeriod = exports.AccountType = exports.PaymentMethod = exports.TransactionStatus = exports.TransactionCategory = exports.TransactionType = void 0;
var TransactionType;
(function (TransactionType) {
    TransactionType["INCOME"] = "income";
    TransactionType["EXPENSE"] = "expense";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var TransactionCategory;
(function (TransactionCategory) {
    // Income
    TransactionCategory["BEER_SALES"] = "beer_sales";
    TransactionCategory["FOOD_SALES"] = "food_sales";
    TransactionCategory["EVENT_REVENUE"] = "event_revenue";
    TransactionCategory["MERCHANDISE"] = "merchandise";
    TransactionCategory["OTHER_INCOME"] = "other_income";
    // Expenses
    TransactionCategory["INGREDIENTS"] = "ingredients";
    TransactionCategory["UTILITIES"] = "utilities";
    TransactionCategory["PAYROLL"] = "payroll";
    TransactionCategory["RENT"] = "rent";
    TransactionCategory["EQUIPMENT"] = "equipment";
    TransactionCategory["MARKETING"] = "marketing";
    TransactionCategory["INSURANCE"] = "insurance";
    TransactionCategory["LICENSES"] = "licenses";
    TransactionCategory["OTHER_EXPENSE"] = "other_expense";
})(TransactionCategory || (exports.TransactionCategory = TransactionCategory = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "pending";
    TransactionStatus["COMPLETED"] = "completed";
    TransactionStatus["FAILED"] = "failed";
    TransactionStatus["CANCELLED"] = "cancelled";
    TransactionStatus["REFUNDED"] = "refunded";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "cash";
    PaymentMethod["CREDIT_CARD"] = "credit_card";
    PaymentMethod["DEBIT_CARD"] = "debit_card";
    PaymentMethod["BANK_TRANSFER"] = "bank_transfer";
    PaymentMethod["CHECK"] = "check";
    PaymentMethod["DIGITAL_WALLET"] = "digital_wallet";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var AccountType;
(function (AccountType) {
    AccountType["CHECKING"] = "checking";
    AccountType["SAVINGS"] = "savings";
    AccountType["CREDIT"] = "credit";
    AccountType["CASH"] = "cash";
    AccountType["INVESTMENT"] = "investment";
})(AccountType || (exports.AccountType = AccountType = {}));
var BudgetPeriod;
(function (BudgetPeriod) {
    BudgetPeriod["MONTHLY"] = "monthly";
    BudgetPeriod["QUARTERLY"] = "quarterly";
    BudgetPeriod["ANNUALLY"] = "annually";
})(BudgetPeriod || (exports.BudgetPeriod = BudgetPeriod = {}));
var BudgetStatus;
(function (BudgetStatus) {
    BudgetStatus["ACTIVE"] = "active";
    BudgetStatus["COMPLETED"] = "completed";
    BudgetStatus["EXCEEDED"] = "exceeded";
})(BudgetStatus || (exports.BudgetStatus = BudgetStatus = {}));
var InvoiceType;
(function (InvoiceType) {
    InvoiceType["SALES"] = "sales";
    InvoiceType["PURCHASE"] = "purchase";
})(InvoiceType || (exports.InvoiceType = InvoiceType = {}));
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["DRAFT"] = "draft";
    InvoiceStatus["SENT"] = "sent";
    InvoiceStatus["PAID"] = "paid";
    InvoiceStatus["OVERDUE"] = "overdue";
    InvoiceStatus["CANCELLED"] = "cancelled";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
var FinancialReportType;
(function (FinancialReportType) {
    FinancialReportType["PROFIT_LOSS"] = "profit_loss";
    FinancialReportType["BALANCE_SHEET"] = "balance_sheet";
    FinancialReportType["CASH_FLOW"] = "cash_flow";
    FinancialReportType["BUDGET_VARIANCE"] = "budget_variance";
})(FinancialReportType || (exports.FinancialReportType = FinancialReportType = {}));

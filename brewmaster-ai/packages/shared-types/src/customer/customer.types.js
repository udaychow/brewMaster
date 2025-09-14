"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewCategory = exports.RegistrationStatus = exports.EventStatus = exports.EventType = exports.ReservationStatus = exports.ContactMethod = exports.LoyaltyTier = void 0;
var LoyaltyTier;
(function (LoyaltyTier) {
    LoyaltyTier["BRONZE"] = "bronze";
    LoyaltyTier["SILVER"] = "silver";
    LoyaltyTier["GOLD"] = "gold";
    LoyaltyTier["PLATINUM"] = "platinum";
})(LoyaltyTier || (exports.LoyaltyTier = LoyaltyTier = {}));
var ContactMethod;
(function (ContactMethod) {
    ContactMethod["EMAIL"] = "email";
    ContactMethod["PHONE"] = "phone";
    ContactMethod["SMS"] = "sms";
})(ContactMethod || (exports.ContactMethod = ContactMethod = {}));
var ReservationStatus;
(function (ReservationStatus) {
    ReservationStatus["PENDING"] = "pending";
    ReservationStatus["CONFIRMED"] = "confirmed";
    ReservationStatus["SEATED"] = "seated";
    ReservationStatus["COMPLETED"] = "completed";
    ReservationStatus["CANCELLED"] = "cancelled";
    ReservationStatus["NO_SHOW"] = "no_show";
})(ReservationStatus || (exports.ReservationStatus = ReservationStatus = {}));
var EventType;
(function (EventType) {
    EventType["TASTING"] = "tasting";
    EventType["TOUR"] = "tour";
    EventType["PRIVATE_EVENT"] = "private_event";
    EventType["FESTIVAL"] = "festival";
    EventType["EDUCATIONAL"] = "educational";
})(EventType || (exports.EventType = EventType = {}));
var EventStatus;
(function (EventStatus) {
    EventStatus["DRAFT"] = "draft";
    EventStatus["PUBLISHED"] = "published";
    EventStatus["FULL"] = "full";
    EventStatus["CANCELLED"] = "cancelled";
    EventStatus["COMPLETED"] = "completed";
})(EventStatus || (exports.EventStatus = EventStatus = {}));
var RegistrationStatus;
(function (RegistrationStatus) {
    RegistrationStatus["REGISTERED"] = "registered";
    RegistrationStatus["CONFIRMED"] = "confirmed";
    RegistrationStatus["ATTENDED"] = "attended";
    RegistrationStatus["NO_SHOW"] = "no_show";
    RegistrationStatus["CANCELLED"] = "cancelled";
})(RegistrationStatus || (exports.RegistrationStatus = RegistrationStatus = {}));
var ReviewCategory;
(function (ReviewCategory) {
    ReviewCategory["FOOD"] = "food";
    ReviewCategory["BEER"] = "beer";
    ReviewCategory["SERVICE"] = "service";
    ReviewCategory["ATMOSPHERE"] = "atmosphere";
    ReviewCategory["OVERALL"] = "overall";
})(ReviewCategory || (exports.ReviewCategory = ReviewCategory = {}));

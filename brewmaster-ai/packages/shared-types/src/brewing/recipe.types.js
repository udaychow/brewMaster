"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaintenanceFrequency = exports.EquipmentStatus = exports.EquipmentType = exports.ScheduleStatus = exports.RecipeDifficulty = exports.BrewingPhase = exports.AdditionTime = void 0;
var AdditionTime;
(function (AdditionTime) {
    AdditionTime["MASH"] = "mash";
    AdditionTime["FIRST_WORT"] = "first_wort";
    AdditionTime["BOIL_60"] = "boil_60";
    AdditionTime["BOIL_30"] = "boil_30";
    AdditionTime["BOIL_15"] = "boil_15";
    AdditionTime["BOIL_5"] = "boil_5";
    AdditionTime["FLAMEOUT"] = "flameout";
    AdditionTime["WHIRLPOOL"] = "whirlpool";
    AdditionTime["FERMENTATION"] = "fermentation";
    AdditionTime["DRY_HOP"] = "dry_hop";
})(AdditionTime || (exports.AdditionTime = AdditionTime = {}));
var BrewingPhase;
(function (BrewingPhase) {
    BrewingPhase["PREPARATION"] = "preparation";
    BrewingPhase["MASHING"] = "mashing";
    BrewingPhase["LAUTERING"] = "lautering";
    BrewingPhase["BOILING"] = "boiling";
    BrewingPhase["COOLING"] = "cooling";
    BrewingPhase["FERMENTATION"] = "fermentation";
    BrewingPhase["CONDITIONING"] = "conditioning";
    BrewingPhase["PACKAGING"] = "packaging";
})(BrewingPhase || (exports.BrewingPhase = BrewingPhase = {}));
var RecipeDifficulty;
(function (RecipeDifficulty) {
    RecipeDifficulty["BEGINNER"] = "beginner";
    RecipeDifficulty["INTERMEDIATE"] = "intermediate";
    RecipeDifficulty["ADVANCED"] = "advanced";
    RecipeDifficulty["EXPERT"] = "expert";
})(RecipeDifficulty || (exports.RecipeDifficulty = RecipeDifficulty = {}));
var ScheduleStatus;
(function (ScheduleStatus) {
    ScheduleStatus["SCHEDULED"] = "scheduled";
    ScheduleStatus["IN_PROGRESS"] = "in_progress";
    ScheduleStatus["COMPLETED"] = "completed";
    ScheduleStatus["CANCELLED"] = "cancelled";
    ScheduleStatus["RESCHEDULED"] = "rescheduled";
})(ScheduleStatus || (exports.ScheduleStatus = ScheduleStatus = {}));
var EquipmentType;
(function (EquipmentType) {
    EquipmentType["MASH_TUN"] = "mash_tun";
    EquipmentType["KETTLE"] = "kettle";
    EquipmentType["FERMENTER"] = "fermenter";
    EquipmentType["BRIGHT_TANK"] = "bright_tank";
    EquipmentType["HEAT_EXCHANGER"] = "heat_exchanger";
    EquipmentType["PUMP"] = "pump";
    EquipmentType["FILTER"] = "filter";
    EquipmentType["KEGERATOR"] = "kegerator";
})(EquipmentType || (exports.EquipmentType = EquipmentType = {}));
var EquipmentStatus;
(function (EquipmentStatus) {
    EquipmentStatus["AVAILABLE"] = "available";
    EquipmentStatus["IN_USE"] = "in_use";
    EquipmentStatus["MAINTENANCE"] = "maintenance";
    EquipmentStatus["OUT_OF_SERVICE"] = "out_of_service";
})(EquipmentStatus || (exports.EquipmentStatus = EquipmentStatus = {}));
var MaintenanceFrequency;
(function (MaintenanceFrequency) {
    MaintenanceFrequency["DAILY"] = "daily";
    MaintenanceFrequency["WEEKLY"] = "weekly";
    MaintenanceFrequency["MONTHLY"] = "monthly";
    MaintenanceFrequency["QUARTERLY"] = "quarterly";
    MaintenanceFrequency["ANNUALLY"] = "annually";
})(MaintenanceFrequency || (exports.MaintenanceFrequency = MaintenanceFrequency = {}));

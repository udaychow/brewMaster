export interface Customer {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: Date;
    address?: Address;
    loyaltyTier: LoyaltyTier;
    totalSpent: number;
    visitCount: number;
    lastVisit?: Date;
    preferences: CustomerPreferences;
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
export declare enum LoyaltyTier {
    BRONZE = "bronze",
    SILVER = "silver",
    GOLD = "gold",
    PLATINUM = "platinum"
}
export interface CustomerPreferences {
    beerStyles: string[];
    foodPreferences: string[];
    allergens: string[];
    preferredContactMethod: ContactMethod;
    marketingOptIn: boolean;
}
export declare enum ContactMethod {
    EMAIL = "email",
    PHONE = "phone",
    SMS = "sms"
}
export interface Reservation {
    id: string;
    customerId: string;
    partySize: number;
    reservationDate: Date;
    reservationTime: string;
    status: ReservationStatus;
    tableNumber?: string;
    specialRequests?: string;
    createdAt: Date;
    updatedAt: Date;
    confirmedAt?: Date;
    cancelledAt?: Date;
}
export declare enum ReservationStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    SEATED = "seated",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    NO_SHOW = "no_show"
}
export interface Event {
    id: string;
    name: string;
    description: string;
    eventType: EventType;
    startDate: Date;
    endDate: Date;
    capacity: number;
    currentAttendees: number;
    price: number;
    status: EventStatus;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum EventType {
    TASTING = "tasting",
    TOUR = "tour",
    PRIVATE_EVENT = "private_event",
    FESTIVAL = "festival",
    EDUCATIONAL = "educational"
}
export declare enum EventStatus {
    DRAFT = "draft",
    PUBLISHED = "published",
    FULL = "full",
    CANCELLED = "cancelled",
    COMPLETED = "completed"
}
export interface EventRegistration {
    id: string;
    eventId: string;
    customerId: string;
    registrationDate: Date;
    attendeeCount: number;
    totalPrice: number;
    status: RegistrationStatus;
    paymentId?: string;
}
export declare enum RegistrationStatus {
    REGISTERED = "registered",
    CONFIRMED = "confirmed",
    ATTENDED = "attended",
    NO_SHOW = "no_show",
    CANCELLED = "cancelled"
}
export interface Review {
    id: string;
    customerId: string;
    rating: number;
    title?: string;
    content?: string;
    category: ReviewCategory;
    isVerified: boolean;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum ReviewCategory {
    FOOD = "food",
    BEER = "beer",
    SERVICE = "service",
    ATMOSPHERE = "atmosphere",
    OVERALL = "overall"
}

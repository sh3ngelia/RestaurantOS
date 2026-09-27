using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Application.Reservations;

public record ReservationResponse(
    Guid Id,
    Guid TableId,
    int TableNumber,
    string GuestName,
    string GuestPhoneNumber,
    int GuestCount,
    DateTime ReservationTime,
    ReservationStatus Status,
    string? Notes);

public record CreateReservationRequest(
    Guid TableId,
    string GuestName,
    string GuestPhoneNumber,
    int GuestCount,
    DateTimeOffset ReservationTime,
    string? Notes);

public record UpdateReservationGuestInfoRequest(
    string GuestName,
    string GuestPhoneNumber,
    int GuestCount,
    string? Notes);

public record RescheduleReservationRequest(DateTimeOffset ReservationTime);
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Application.Tables;

public record TableReservationInfo(
    Guid ReservationId,
    DateTime ReservationTime,
    string GuestName,
    int GuestCount,
    bool IsLate);

public record TableResponse(
    Guid Id,
    int TableNumber,
    int Capacity,
    TableStatus Status,
    bool IsHeld,                           
    TableReservationInfo? NextReservation);  

public record CreateTableRequest(int TableNumber, int Capacity);
public record UpdateTableRequest(int TableNumber, int Capacity);
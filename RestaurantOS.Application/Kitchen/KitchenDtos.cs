using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Application.Kitchen;

public record KitchenTicketItemResponse(
    Guid Id,
    string Name,
    int Quantity,
    Course Course,
    int? SeatNumber,
    string? Notes,
    IReadOnlyList<Allergen> Allergens,
    OrderItemStatus Status,
    Guid StationId,
    string StationName,
    DateTime? FiredAt);

public record KitchenTicketResponse(
    Guid OrderId,
    string OrderNumber,
    int? TableNumber,
    DateTime FiredAt,
    IReadOnlyList<KitchenTicketItemResponse> Items);
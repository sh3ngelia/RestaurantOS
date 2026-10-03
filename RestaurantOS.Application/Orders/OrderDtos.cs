using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Application.Orders;

public record OrderItemResponse(
    Guid Id,
    Guid MenuItemId,
    string Name,
    decimal UnitPrice,
    int Quantity,
    decimal TotalPrice,
    Course Course,
    Guid StationId,
    string StationName,
    PreparationStation StationType,
    IReadOnlyList<Allergen> Allergens,
    int? SeatNumber,
    string? Notes,
    OrderItemStatus Status,
    DateTime? FiredAt,
    DateTime? ReadyAt);

public record OrderResponse(
    Guid Id,
    string OrderNumber,
    OrderType Type,
    OrderStatus Status,
    Guid? TableId,
    int? TableNumber,
    Guid? WaiterId,
    string? Notes,
    Course? CurrentCourse,
    decimal TotalAmount,
    DateTime CreatedAt,
    IReadOnlyList<OrderItemResponse> Items);

public record OpenOrderRequest(Guid TableId, string? Notes);

public record AddOrderItemRequest(
    Guid MenuItemId,
    int Quantity,
    Course Course,
    string? Notes,
    int? SeatNumber);

public record UpdateOrderItemQuantityRequest(int Quantity);
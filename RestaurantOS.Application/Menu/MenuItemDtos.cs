using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Application.Menu;

public record MenuItemResponse(
    Guid Id,
    string Name,
    string? Description,
    decimal Price,
    Guid CategoryId,
    string CategoryName,
    PreparationStation PreparationStation,
    bool IsAvailable,
    int PreparationTimeInMinutes);

public record CreateMenuItemRequest(
    string Name,
    string? Description,
    decimal Price,
    Guid CategoryId,
    PreparationStation PreparationStation,
    int PreparationTimeInMinutes);

public record UpdateMenuItemRequest(
    string Name,
    string? Description,
    decimal Price,
    Guid CategoryId,
    PreparationStation PreparationStation,
    int PreparationTimeInMinutes);

public record ChangePriceRequest(decimal NewPrice);

public record SetAvailabilityRequest(bool IsAvailable);
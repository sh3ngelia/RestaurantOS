using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Application.Menu;

public record MenuItemResponse(
    Guid Id,
    string Name,
    string? Description,
    decimal Price,
    Guid CategoryId,
    string CategoryName,
    Guid StationId,
    string StationName,
    PreparationStation StationType,
    bool IsAvailable,
    int PreparationTimeInMinutes,
    IReadOnlyList<Allergen> Allergens);

public record CreateMenuItemRequest(
    string Name,
    string? Description,
    decimal Price,
    Guid CategoryId,
    Guid StationId,
    int PreparationTimeInMinutes,
    IReadOnlyList<Allergen>? Allergens);

public record UpdateMenuItemRequest(
    string Name,
    string? Description,
    decimal Price,
    Guid CategoryId,
    Guid StationId,
    int PreparationTimeInMinutes,
    IReadOnlyList<Allergen>? Allergens);

public record ChangePriceRequest(decimal NewPrice);

public record SetAvailabilityRequest(bool IsAvailable);
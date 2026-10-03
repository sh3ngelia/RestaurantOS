using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Application.Stations;

public record StationResponse(
    Guid Id,
    string Name,
    PreparationStation Type,
    bool FiresImmediately,
    int DisplayOrder,
    bool IsActive);

public record CreateStationRequest(string Name, PreparationStation Type, bool FiresImmediately, int DisplayOrder);
public record UpdateStationRequest(string Name, PreparationStation Type, bool FiresImmediately, int DisplayOrder);
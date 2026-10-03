using RestaurantOS.Domain.Entities;

namespace RestaurantOS.Application.Stations;

public static class StationMappings
{
    public static StationResponse ToResponse(this Station station) =>
        new(station.Id, station.Name, station.Type, station.FiresImmediately, station.DisplayOrder, station.IsActive);
}
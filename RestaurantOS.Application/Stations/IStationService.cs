namespace RestaurantOS.Application.Stations;

public interface IStationService
{
    Task<IReadOnlyList<StationResponse>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<StationResponse> CreateAsync(CreateStationRequest request, CancellationToken cancellationToken = default);
    Task<StationResponse> UpdateAsync(Guid id, UpdateStationRequest request, CancellationToken cancellationToken = default);
    Task<StationResponse> ActivateAsync(Guid id, CancellationToken cancellationToken = default);
    Task<StationResponse> DeactivateAsync(Guid id, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Application.Kitchen;

public interface IKitchenService
{
    Task<IReadOnlyList<KitchenTicketResponse>> GetTicketsAsync(
        Guid? stationId,
        PreparationStation? stationType,
        CancellationToken cancellationToken = default);
}
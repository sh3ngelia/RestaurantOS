namespace RestaurantOS.Application.Kitchen;

public interface IKitchenService
{
    Task<IReadOnlyList<KitchenTicketResponse>> GetTicketsAsync(Guid? stationId, CancellationToken cancellationToken = default);
}
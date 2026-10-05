namespace RestaurantOS.Application.Common.Interfaces;

public interface IKitchenNotifier
{
    Task OrderChangedAsync(Guid orderId, IEnumerable<Guid> stationIds, CancellationToken cancellationToken = default);

    Task ItemReadyAsync(Guid orderId, int? tableNumber, string itemName, CancellationToken cancellationToken = default);
}
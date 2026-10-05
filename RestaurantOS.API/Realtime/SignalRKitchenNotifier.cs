using Microsoft.AspNetCore.SignalR;
using RestaurantOS.Application.Common.Interfaces;

namespace RestaurantOS.API.Realtime;

public class SignalRKitchenNotifier : IKitchenNotifier
{
    private readonly IHubContext<KitchenHub> _hub;

    public SignalRKitchenNotifier(IHubContext<KitchenHub> hub)
    {
        _hub = hub;
    }

    public Task OrderChangedAsync(Guid orderId, IEnumerable<Guid> stationIds, CancellationToken cancellationToken = default)
    {
        var groups = stationIds
            .Distinct()
            .Select(KitchenHub.StationGroup)
            .Append(KitchenHub.PassGroup)
            .Append(KitchenHub.FloorGroup)
            .ToList();

        return _hub.Clients.Groups(groups).SendAsync("OrderChanged", new { orderId }, cancellationToken);
    }

    public Task ItemReadyAsync(Guid orderId, int? tableNumber, string itemName, CancellationToken cancellationToken = default) =>
        _hub.Clients.Group(KitchenHub.FloorGroup)
            .SendAsync("ItemReady", new { orderId, tableNumber, itemName }, cancellationToken);
}
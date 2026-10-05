using RestaurantOS.Domain.Entities;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Application.Common.Interfaces;

public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Order>> GetOpenAsync(Guid? tableId = null, CancellationToken cancellationToken = default);
    Task<bool> HasOpenOrderForTableAsync(Guid tableId, CancellationToken cancellationToken = default);
    Task<int> CountCreatedSinceAsync(DateTime sinceUtc, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Order>> GetWithKitchenItemsAsync(Guid? stationId, OrderItemStatus[] statuses, CancellationToken cancellationToken = default);
    void Add(Order order);
}
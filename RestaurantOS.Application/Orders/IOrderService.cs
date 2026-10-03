namespace RestaurantOS.Application.Orders;

public interface IOrderService
{
    Task<IReadOnlyList<OrderResponse>> GetOpenAsync(Guid? tableId, CancellationToken cancellationToken = default);
    Task<OrderResponse> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<OrderResponse> OpenAsync(OpenOrderRequest request, CancellationToken cancellationToken = default);

    Task<OrderResponse> AddItemAsync(Guid orderId, AddOrderItemRequest request, CancellationToken cancellationToken = default);
    Task<OrderResponse> UpdateItemQuantityAsync(Guid orderId, Guid itemId, UpdateOrderItemQuantityRequest request, CancellationToken cancellationToken = default);
    Task<OrderResponse> RemoveItemAsync(Guid orderId, Guid itemId, CancellationToken cancellationToken = default);

    Task<OrderResponse> SendRoundAsync(Guid orderId, CancellationToken cancellationToken = default);
    Task<OrderResponse> FireNextCourseAsync(Guid orderId, CancellationToken cancellationToken = default);

    Task<OrderResponse> StartItemAsync(Guid orderId, Guid itemId, CancellationToken cancellationToken = default);
    Task<OrderResponse> MarkItemReadyAsync(Guid orderId, Guid itemId, CancellationToken cancellationToken = default);
    Task<OrderResponse> MarkItemServedAsync(Guid orderId, Guid itemId, CancellationToken cancellationToken = default);
    Task<OrderResponse> CancelItemAsync(Guid orderId, Guid itemId, CancellationToken cancellationToken = default);

    Task<OrderResponse> CloseAsync(Guid orderId, CancellationToken cancellationToken = default);
    Task<OrderResponse> CancelAsync(Guid orderId, CancellationToken cancellationToken = default);
}
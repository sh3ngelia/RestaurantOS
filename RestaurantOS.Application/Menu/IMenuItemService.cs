namespace RestaurantOS.Application.Menu;

public interface IMenuItemService
{
    Task<IReadOnlyList<MenuItemResponse>> GetAllAsync(Guid? categoryId = null, CancellationToken cancellationToken = default);
    Task<MenuItemResponse> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<MenuItemResponse> CreateAsync(CreateMenuItemRequest request, CancellationToken cancellationToken = default);
    Task<MenuItemResponse> UpdateAsync(Guid id, UpdateMenuItemRequest request, CancellationToken cancellationToken = default);
    Task<MenuItemResponse> ChangePriceAsync(Guid id, ChangePriceRequest request, CancellationToken cancellationToken = default);
    Task<MenuItemResponse> SetAvailabilityAsync(Guid id, bool isAvailable, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
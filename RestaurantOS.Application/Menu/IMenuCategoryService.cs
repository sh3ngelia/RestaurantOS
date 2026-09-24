namespace RestaurantOS.Application.Menu;

public interface IMenuCategoryService
{
    Task<IReadOnlyList<MenuCategoryResponse>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<MenuCategoryResponse> CreateAsync(CreateMenuCategoryRequest request, CancellationToken cancellationToken = default);
    Task<MenuCategoryResponse> UpdateAsync(Guid id, UpdateMenuCategoryRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
using RestaurantOS.Domain.Entities;

namespace RestaurantOS.Application.Common.Interfaces;

public interface IMenuCategoryRepository
{
    Task<MenuCategory?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MenuCategory>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<bool> ExistsByNameAsync(string name, Guid? excludeId = null, CancellationToken cancellationToken = default);
    void Add(MenuCategory category);
}
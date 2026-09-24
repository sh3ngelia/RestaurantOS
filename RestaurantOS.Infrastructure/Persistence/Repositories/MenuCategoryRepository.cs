using Microsoft.EntityFrameworkCore;
using RestaurantOS.Application.Common.Interfaces;
using RestaurantOS.Domain.Entities;

namespace RestaurantOS.Infrastructure.Persistence.Repositories;

public class MenuCategoryRepository : IMenuCategoryRepository
{
    private readonly RestaurantDbContext _context;

    public MenuCategoryRepository(RestaurantDbContext context)
    {
        _context = context;
    }

    public async Task<MenuCategory?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.MenuCategories.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<MenuCategory>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.MenuCategories
            .AsNoTracking()
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> ExistsByNameAsync(string name, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        var trimmed = name.Trim();
        return await _context.MenuCategories
            .AnyAsync(c => c.Name == trimmed && c.Id != excludeId, cancellationToken);
    }

    public void Add(MenuCategory category)
    {
        _context.MenuCategories.Add(category);
    }
}
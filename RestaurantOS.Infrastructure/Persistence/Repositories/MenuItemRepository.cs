using Microsoft.EntityFrameworkCore;
using RestaurantOS.Application.Common.Interfaces;
using RestaurantOS.Domain.Entities;

namespace RestaurantOS.Infrastructure.Persistence.Repositories;

public class MenuItemRepository : IMenuItemRepository
{
    private readonly RestaurantDbContext _context;

    public MenuItemRepository(RestaurantDbContext context)
    {
        _context = context;
    }

    public async Task<MenuItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.MenuItems
            .Include(mi => mi.Category)
            .FirstOrDefaultAsync(mi => mi.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<MenuItem>> GetAllAsync(Guid? categoryId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.MenuItems
            .AsNoTracking()
            .Include(mi => mi.Category)
            .AsQueryable();

        if (categoryId.HasValue)
            query = query.Where(mi => mi.CategoryId == categoryId.Value);

        return await query
            .OrderBy(mi => mi.Category.DisplayOrder)
            .ThenBy(mi => mi.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> ExistsByNameAsync(string name, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        var trimmed = name.Trim();
        return await _context.MenuItems
            .AnyAsync(mi => mi.Name == trimmed && mi.Id != excludeId, cancellationToken);
    }

    public async Task<bool> AnyInCategoryAsync(Guid categoryId, CancellationToken cancellationToken = default)
    {
        return await _context.MenuItems
            .AnyAsync(mi => mi.CategoryId == categoryId, cancellationToken);
    }

    public void Add(MenuItem item)
    {
        _context.MenuItems.Add(item);
    }
}
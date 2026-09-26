using Microsoft.EntityFrameworkCore;
using RestaurantOS.Application.Common.Interfaces;
using RestaurantOS.Domain.Entities;

namespace RestaurantOS.Infrastructure.Persistence.Repositories;

public class TableRepository : ITableRepository
{
    private readonly RestaurantDbContext _context;

    public TableRepository(RestaurantDbContext context)
    {
        _context = context;
    }

    public async Task<Table?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await _context.Tables.FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

    public async Task<IReadOnlyList<Table>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _context.Tables
            .AsNoTracking()
            .OrderBy(t => t.TableNumber)
            .ToListAsync(cancellationToken);

    public async Task<bool> ExistsByNumberAsync(int tableNumber, Guid? excludeId = null, CancellationToken cancellationToken = default) =>
        await _context.Tables.AnyAsync(t => t.TableNumber == tableNumber && t.Id != excludeId, cancellationToken);

    public void Add(Table table) => _context.Tables.Add(table);
}
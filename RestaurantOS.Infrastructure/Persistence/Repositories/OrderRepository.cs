using Microsoft.EntityFrameworkCore;
using RestaurantOS.Application.Common.Interfaces;
using RestaurantOS.Domain.Entities;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Infrastructure.Persistence.Repositories;

public class OrderRepository : IOrderRepository
{
    private readonly RestaurantDbContext _context;

    public OrderRepository(RestaurantDbContext context)
    {
        _context = context;
    }

    public async Task<Order?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);

    public async Task<IReadOnlyList<Order>> GetOpenAsync(Guid? tableId = null, CancellationToken cancellationToken = default) =>
        await _context.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .Where(o => o.Status == OrderStatus.Opened && (tableId == null || o.TableId == tableId))
            .OrderBy(o => o.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task<bool> HasOpenOrderForTableAsync(Guid tableId, CancellationToken cancellationToken = default) =>
        await _context.Orders.AnyAsync(o => o.TableId == tableId && o.Status == OrderStatus.Opened, cancellationToken);
    public async Task<int> CountCreatedSinceAsync(DateTime sinceUtc, CancellationToken cancellationToken = default) =>
        await _context.Orders
            .IgnoreQueryFilters()
            .CountAsync(o => o.CreatedAt >= sinceUtc, cancellationToken);

    public async Task<IReadOnlyList<Order>> GetWithKitchenItemsAsync(
        Guid? stationId,
        PreparationStation? stationType,
        OrderItemStatus[] statuses,
        CancellationToken cancellationToken = default) =>
        await _context.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .Where(o => o.Status == OrderStatus.Opened &&
                        o.Items.Any(i => statuses.Contains(i.Status) &&
                                         (stationId == null || i.StationId == stationId) &&
                                         (stationType == null || i.StationType == stationType)))
            .ToListAsync(cancellationToken);

    public void Add(Order order) => _context.Orders.Add(order);
}
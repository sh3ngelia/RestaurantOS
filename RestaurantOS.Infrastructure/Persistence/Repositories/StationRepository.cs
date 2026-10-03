using Microsoft.EntityFrameworkCore;
using RestaurantOS.Application.Common.Interfaces;
using RestaurantOS.Domain.Entities;

namespace RestaurantOS.Infrastructure.Persistence.Repositories;

public class StationRepository : IStationRepository
{
    private readonly RestaurantDbContext _context;

    public StationRepository(RestaurantDbContext context)
    {
        _context = context;
    }

    public async Task<Station?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await _context.Stations.FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

    public async Task<IReadOnlyList<Station>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _context.Stations
            .AsNoTracking()
            .OrderBy(s => s.DisplayOrder)
            .ThenBy(s => s.Name)
            .ToListAsync(cancellationToken);

    public async Task<bool> ExistsByNameAsync(string name, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        var trimmed = name.Trim();
        return await _context.Stations.AnyAsync(s => s.Name == trimmed && s.Id != excludeId, cancellationToken);
    }

    public async Task<bool> AnyAsync(CancellationToken cancellationToken = default) =>
        await _context.Stations.IgnoreQueryFilters().AnyAsync(cancellationToken);

    public void Add(Station station) => _context.Stations.Add(station);
}
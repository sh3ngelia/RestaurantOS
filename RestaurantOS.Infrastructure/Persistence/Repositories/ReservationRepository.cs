using Microsoft.EntityFrameworkCore;
using RestaurantOS.Application.Common.Interfaces;
using RestaurantOS.Domain.Entities;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Infrastructure.Persistence.Repositories;

public class ReservationRepository : IReservationRepository
{
    private readonly RestaurantDbContext _context;

    public ReservationRepository(RestaurantDbContext context)
    {
        _context = context;
    }

    public async Task<Reservation?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await _context.Reservations
            .Include(r => r.Table)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

    public async Task<IReadOnlyList<Reservation>> GetInRangeAsync(DateTime fromUtc, DateTime toUtc, CancellationToken cancellationToken = default) =>
        await _context.Reservations
            .AsNoTracking()
            .Include(r => r.Table)
            .Where(r => r.ReservationTime >= fromUtc && r.ReservationTime < toUtc)
            .OrderBy(r => r.ReservationTime)
            .ToListAsync(cancellationToken);

    public async Task<bool> HasOverlapAsync(Guid tableId, DateTime timeUtc, TimeSpan window, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        var from = timeUtc - window;
        var to = timeUtc + window;

        return await _context.Reservations.AnyAsync(r =>
            r.TableId == tableId &&
            r.Id != excludeId &&
            (r.Status == ReservationStatus.Pending || r.Status == ReservationStatus.Confirmed) &&
            r.ReservationTime > from &&
            r.ReservationTime < to,
            cancellationToken);
    }

    public void Add(Reservation reservation) => _context.Reservations.Add(reservation);

    public async Task<IReadOnlyList<Reservation>> GetConfirmedBetweenAsync(DateTime fromUtc, DateTime toUtc, CancellationToken cancellationToken = default) =>
    await _context.Reservations
        .AsNoTracking()
        .Where(r => r.Status == ReservationStatus.Confirmed &&
                    r.ReservationTime >= fromUtc &&
                    r.ReservationTime < toUtc)
        .OrderBy(r => r.ReservationTime)
        .ToListAsync(cancellationToken);
}
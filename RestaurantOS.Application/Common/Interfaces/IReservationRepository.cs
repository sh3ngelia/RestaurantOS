using RestaurantOS.Domain.Entities;

namespace RestaurantOS.Application.Common.Interfaces;

public interface IReservationRepository
{
    Task<Reservation?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Reservation>> GetInRangeAsync(DateTime fromUtc, DateTime toUtc, CancellationToken cancellationToken = default);
    Task<bool> HasOverlapAsync(Guid tableId, DateTime timeUtc, TimeSpan window, Guid? excludeId = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Reservation>> GetConfirmedBetweenAsync(DateTime fromUtc, DateTime toUtc, CancellationToken cancellationToken = default);
    void Add(Reservation reservation);
}
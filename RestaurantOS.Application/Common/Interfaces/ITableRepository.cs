using RestaurantOS.Domain.Entities;

namespace RestaurantOS.Application.Common.Interfaces;

public interface ITableRepository
{
    Task<Table?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Table>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<bool> ExistsByNumberAsync(int tableNumber, Guid? excludeId = null, CancellationToken cancellationToken = default);
    void Add(Table table);
}
namespace RestaurantOS.Application.Tables;

public interface ITableService
{
    Task<IReadOnlyList<TableResponse>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<TableResponse> CreateAsync(CreateTableRequest request, CancellationToken cancellationToken = default);
    Task<TableResponse> UpdateAsync(Guid id, UpdateTableRequest request, CancellationToken cancellationToken = default);
    Task<TableResponse> OccupyAsync(Guid id, CancellationToken cancellationToken = default);
    Task<TableResponse> ReserveAsync(Guid id, CancellationToken cancellationToken = default);
    Task<TableResponse> FreeAsync(Guid id, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
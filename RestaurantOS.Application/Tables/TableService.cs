using FluentValidation;
using RestaurantOS.Application.Common.Exceptions;
using RestaurantOS.Application.Common.Interfaces;
using RestaurantOS.Domain.Entities;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Application.Tables;

public class TableService : ITableService
{
    private readonly ITableRepository _tableRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IValidator<CreateTableRequest> _createValidator;
    private readonly IValidator<UpdateTableRequest> _updateValidator;

    public TableService(
        ITableRepository tableRepository,
        IUnitOfWork unitOfWork,
        IValidator<CreateTableRequest> createValidator,
        IValidator<UpdateTableRequest> updateValidator)
    {
        _tableRepository = tableRepository;
        _unitOfWork = unitOfWork;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    public async Task<IReadOnlyList<TableResponse>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var tables = await _tableRepository.GetAllAsync(cancellationToken);
        return tables.Select(t => t.ToResponse()).ToList();
    }

    public async Task<TableResponse> CreateAsync(CreateTableRequest request, CancellationToken cancellationToken = default)
    {
        await _createValidator.ValidateAndThrowAsync(request, cancellationToken);

        if (await _tableRepository.ExistsByNumberAsync(request.TableNumber, cancellationToken: cancellationToken))
            throw new ConflictException($"Table {request.TableNumber} already exists.");

        var table = new Table(request.TableNumber, request.Capacity);
        _tableRepository.Add(table);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return table.ToResponse();
    }

    public async Task<TableResponse> UpdateAsync(Guid id, UpdateTableRequest request, CancellationToken cancellationToken = default)
    {
        await _updateValidator.ValidateAndThrowAsync(request, cancellationToken);

        var table = await GetTableOrThrowAsync(id, cancellationToken);

        if (await _tableRepository.ExistsByNumberAsync(request.TableNumber, id, cancellationToken))
            throw new ConflictException($"Table {request.TableNumber} already exists.");

        table.UpdateDetails(request.TableNumber, request.Capacity);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return table.ToResponse();
    }

    public Task<TableResponse> OccupyAsync(Guid id, CancellationToken cancellationToken = default) =>
        ChangeStatusAsync(id, t => t.Occupy(), cancellationToken);

    public Task<TableResponse> ReserveAsync(Guid id, CancellationToken cancellationToken = default) =>
        ChangeStatusAsync(id, t => t.Reserve(), cancellationToken);

    public Task<TableResponse> FreeAsync(Guid id, CancellationToken cancellationToken = default) =>
        ChangeStatusAsync(id, t => t.Free(), cancellationToken);

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var table = await GetTableOrThrowAsync(id, cancellationToken);

        if (table.Status != TableStatus.Available)
            throw new ConflictException($"Table {table.TableNumber} is {table.Status.ToString().ToLower()} and cannot be deleted.");

        table.SoftDelete();
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<TableResponse> ChangeStatusAsync(
        Guid id,
        Action<Table> change,
        CancellationToken cancellationToken)
    {
        var table = await GetTableOrThrowAsync(id, cancellationToken);
        change(table);                                  
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return table.ToResponse();
    }

    private async Task<Table> GetTableOrThrowAsync(Guid id, CancellationToken cancellationToken) =>
        await _tableRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Table", id);
}
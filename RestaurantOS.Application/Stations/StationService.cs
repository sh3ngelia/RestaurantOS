using FluentValidation;
using RestaurantOS.Application.Common.Exceptions;
using RestaurantOS.Application.Common.Interfaces;
using RestaurantOS.Domain.Entities;

namespace RestaurantOS.Application.Stations;

public class StationService : IStationService
{
    private readonly IStationRepository _stationRepository;
    private readonly IMenuItemRepository _menuItemRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IValidator<CreateStationRequest> _createValidator;
    private readonly IValidator<UpdateStationRequest> _updateValidator;

    public StationService(
        IStationRepository stationRepository,
        IMenuItemRepository menuItemRepository,
        IUnitOfWork unitOfWork,
        IValidator<CreateStationRequest> createValidator,
        IValidator<UpdateStationRequest> updateValidator)
    {
        _stationRepository = stationRepository;
        _menuItemRepository = menuItemRepository;
        _unitOfWork = unitOfWork;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    public async Task<IReadOnlyList<StationResponse>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var stations = await _stationRepository.GetAllAsync(cancellationToken);
        return stations.Select(s => s.ToResponse()).ToList();
    }

    public async Task<StationResponse> CreateAsync(CreateStationRequest request, CancellationToken cancellationToken = default)
    {
        await _createValidator.ValidateAndThrowAsync(request, cancellationToken);

        if (await _stationRepository.ExistsByNameAsync(request.Name, cancellationToken: cancellationToken))
            throw new ConflictException($"Station '{request.Name.Trim()}' already exists.");

        var station = new Station(request.Name, request.Type, request.FiresImmediately, request.DisplayOrder);
        _stationRepository.Add(station);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return station.ToResponse();
    }

    public async Task<StationResponse> UpdateAsync(Guid id, UpdateStationRequest request, CancellationToken cancellationToken = default)
    {
        await _updateValidator.ValidateAndThrowAsync(request, cancellationToken);

        var station = await GetStationOrThrowAsync(id, cancellationToken);

        if (await _stationRepository.ExistsByNameAsync(request.Name, id, cancellationToken))
            throw new ConflictException($"Station '{request.Name.Trim()}' already exists.");

        station.Update(request.Name, request.Type, request.FiresImmediately, request.DisplayOrder);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return station.ToResponse();
    }

    public Task<StationResponse> ActivateAsync(Guid id, CancellationToken cancellationToken = default) =>
        ChangeAsync(id, s => s.Activate(), cancellationToken);

    public async Task<StationResponse> DeactivateAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var station = await GetStationOrThrowAsync(id, cancellationToken);
        await EnsureNoMenuItemsAsync(station, "deactivated", cancellationToken);

        station.Deactivate();
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return station.ToResponse();
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var station = await GetStationOrThrowAsync(id, cancellationToken);
        await EnsureNoMenuItemsAsync(station, "deleted", cancellationToken);

        station.SoftDelete();
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<StationResponse> ChangeAsync(Guid id, Action<Station> change, CancellationToken cancellationToken)
    {
        var station = await GetStationOrThrowAsync(id, cancellationToken);
        change(station);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return station.ToResponse();
    }

    private async Task<Station> GetStationOrThrowAsync(Guid id, CancellationToken cancellationToken) =>
        await _stationRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Station", id);

    // station cannot be deactivated or deleted if it has menu items assigned to it
    private async Task EnsureNoMenuItemsAsync(Station station, string action, CancellationToken cancellationToken)
    {
        var count = await _menuItemRepository.CountByStationAsync(station.Id, cancellationToken);
        if (count > 0)
            throw new ConflictException(
                $"Station '{station.Name}' has {count} menu item(s). Move them to another station before it can be {action}.");
    }
}
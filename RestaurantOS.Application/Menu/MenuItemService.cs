using FluentValidation;
using RestaurantOS.Application.Common.Exceptions;
using RestaurantOS.Application.Common.Interfaces;
using RestaurantOS.Domain.Common;
using RestaurantOS.Domain.Entities;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Application.Menu;

public class MenuItemService : IMenuItemService
{
    private readonly IMenuItemRepository _itemRepository;
    private readonly IMenuCategoryRepository _categoryRepository;
    private readonly IStationRepository _stationRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IValidator<CreateMenuItemRequest> _createValidator;
    private readonly IValidator<UpdateMenuItemRequest> _updateValidator;
    private readonly IValidator<ChangePriceRequest> _priceValidator;
    private readonly ICurrentUserService _currentUser;

    public MenuItemService(
        IMenuItemRepository itemRepository,
        IMenuCategoryRepository categoryRepository,
        IStationRepository stationRepository,
        IUnitOfWork unitOfWork,
        IValidator<CreateMenuItemRequest> createValidator,
        IValidator<UpdateMenuItemRequest> updateValidator,
        IValidator<ChangePriceRequest> priceValidator,
        ICurrentUserService currentUser)
    {
        _itemRepository = itemRepository;
        _categoryRepository = categoryRepository;
        _stationRepository = stationRepository;
        _unitOfWork = unitOfWork;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
        _priceValidator = priceValidator;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<MenuItemResponse>> GetAllAsync(
        Guid? categoryId = null,
        CancellationToken cancellationToken = default)
    {
        var items = await _itemRepository.GetAllAsync(categoryId, cancellationToken);
        return items.Select(i => i.ToResponse()).ToList();
    }

    public async Task<MenuItemResponse> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var item = await GetItemOrThrowAsync(id, cancellationToken);
        return item.ToResponse();
    }

    public async Task<MenuItemResponse> CreateAsync(
        CreateMenuItemRequest request,
        CancellationToken cancellationToken = default)
    {
        await _createValidator.ValidateAndThrowAsync(request, cancellationToken);

        var category = await GetCategoryOrThrowAsync(request.CategoryId, cancellationToken);
        var station = await GetActiveStationOrThrowAsync(request.StationId, cancellationToken);

        if (await _itemRepository.ExistsByNameAsync(request.Name, cancellationToken: cancellationToken))
            throw new ConflictException($"Menu item '{request.Name.Trim()}' already exists.");

        var item = new MenuItem(
            request.Name.Trim(),
            request.Description,
            request.Price,
            request.CategoryId,
            request.StationId,
            request.PreparationTimeInMinutes,
            request.Allergens.ToFlags());

        _itemRepository.Add(item);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return item.ToResponse() with
        {
            CategoryName = category.Name,
            StationName = station.Name,
            StationType = station.Type
        };
    }

    public async Task<MenuItemResponse> UpdateAsync(
        Guid id,
        UpdateMenuItemRequest request,
        CancellationToken cancellationToken = default)
    {
        await _updateValidator.ValidateAndThrowAsync(request, cancellationToken);

        var item = await GetItemOrThrowAsync(id, cancellationToken);
        var category = await GetCategoryOrThrowAsync(request.CategoryId, cancellationToken);
        var station = await GetActiveStationOrThrowAsync(request.StationId, cancellationToken);

        if (await _itemRepository.ExistsByNameAsync(request.Name, id, cancellationToken))
            throw new ConflictException($"Menu item '{request.Name.Trim()}' already exists.");

        item.Update(
            request.Name.Trim(),
            request.Description,
            request.Price,
            request.CategoryId,
            request.StationId,
            request.PreparationTimeInMinutes,
            request.Allergens.ToFlags());

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return item.ToResponse() with
        {
            CategoryName = category.Name,
            StationName = station.Name,
            StationType = station.Type
        };
    }

    public async Task<MenuItemResponse> ChangePriceAsync(
        Guid id,
        ChangePriceRequest request,
        CancellationToken cancellationToken = default)
    {
        await _priceValidator.ValidateAndThrowAsync(request, cancellationToken);

        var item = await GetItemOrThrowAsync(id, cancellationToken);
        item.ChangePrice(request.NewPrice);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return item.ToResponse();
    }

    public async Task<MenuItemResponse> SetAvailabilityAsync(
        Guid id,
        bool isAvailable,
        CancellationToken cancellationToken = default)
    {
        var item = await GetItemOrThrowAsync(id, cancellationToken);
        EnsureCanChangeAvailability(item);

        if (item.IsAvailable == isAvailable)
            return item.ToResponse();

        if (isAvailable)
            item.MakeAvailable();
        else
            item.MakeUnavailable();

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return item.ToResponse();
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var item = await GetItemOrThrowAsync(id, cancellationToken);
        item.SoftDelete();

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }


    private async Task<MenuItem> GetItemOrThrowAsync(Guid id, CancellationToken cancellationToken) =>
        await _itemRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Menu item", id);

    private async Task<MenuCategory> GetCategoryOrThrowAsync(Guid id, CancellationToken cancellationToken) =>
        await _categoryRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Menu category", id);

    private async Task<Station> GetActiveStationOrThrowAsync(Guid id, CancellationToken cancellationToken)
    {
        var station = await _stationRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Station", id);

        if (!station.IsActive)
            throw new DomainException($"Station '{station.Name}' is inactive.");

        return station;
    }

    private void EnsureCanChangeAvailability(MenuItem item)
    {
        if (_currentUser.IsInRole(UserRole.Manager))
            return;

        var allowed = item.Station.Type switch
        {
            PreparationStation.Kitchen => _currentUser.IsInRole(UserRole.Kitchen),
            PreparationStation.Bar => _currentUser.IsInRole(UserRole.Bar),
            _ => false
        };

        if (!allowed)
            throw new ForbiddenException($"You cannot change the availability of {item.Name}.");
    }
}
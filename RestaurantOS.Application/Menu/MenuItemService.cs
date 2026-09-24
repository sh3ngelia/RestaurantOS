using FluentValidation;
using RestaurantOS.Application.Common.Exceptions;
using RestaurantOS.Application.Common.Interfaces;
using RestaurantOS.Domain.Entities;

namespace RestaurantOS.Application.Menu;

public class MenuItemService : IMenuItemService
{
    private readonly IMenuItemRepository _itemRepository;
    private readonly IMenuCategoryRepository _categoryRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IValidator<CreateMenuItemRequest> _createValidator;
    private readonly IValidator<UpdateMenuItemRequest> _updateValidator;
    private readonly IValidator<ChangePriceRequest> _priceValidator;

    public MenuItemService(
        IMenuItemRepository itemRepository,
        IMenuCategoryRepository categoryRepository,
        IUnitOfWork unitOfWork,
        IValidator<CreateMenuItemRequest> createValidator,
        IValidator<UpdateMenuItemRequest> updateValidator,
        IValidator<ChangePriceRequest> priceValidator)
    {
        _itemRepository = itemRepository;
        _categoryRepository = categoryRepository;
        _unitOfWork = unitOfWork;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
        _priceValidator = priceValidator;
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

        if (await _itemRepository.ExistsByNameAsync(request.Name, cancellationToken: cancellationToken))
            throw new ConflictException($"Menu item '{request.Name.Trim()}' already exists.");

        var item = new MenuItem(
            request.Name.Trim(),
            request.Description,
            request.Price,
            request.CategoryId,
            request.PreparationStation,
            request.PreparationTimeInMinutes);

        _itemRepository.Add(item);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return item.ToResponse() with { CategoryName = category.Name };
    }

    public async Task<MenuItemResponse> UpdateAsync(
        Guid id,
        UpdateMenuItemRequest request,
        CancellationToken cancellationToken = default)
    {
        await _updateValidator.ValidateAndThrowAsync(request, cancellationToken);

        var item = await GetItemOrThrowAsync(id, cancellationToken);
        var category = await GetCategoryOrThrowAsync(request.CategoryId, cancellationToken);

        if (await _itemRepository.ExistsByNameAsync(request.Name, id, cancellationToken))
            throw new ConflictException($"Menu item '{request.Name.Trim()}' already exists.");

        item.Update(
            request.Name.Trim(),
            request.Description,
            request.Price,
            request.CategoryId,
            request.PreparationStation,
            request.PreparationTimeInMinutes);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return item.ToResponse() with { CategoryName = category.Name };
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
}
using FluentValidation;
using RestaurantOS.Application.Common.Exceptions;
using RestaurantOS.Application.Common.Interfaces;
using RestaurantOS.Domain.Entities;

namespace RestaurantOS.Application.Menu;

public class MenuCategoryService : IMenuCategoryService
{
    private readonly IMenuCategoryRepository _categoryRepository;
    private readonly IMenuItemRepository _itemRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IValidator<CreateMenuCategoryRequest> _createValidator;
    private readonly IValidator<UpdateMenuCategoryRequest> _updateValidator;

    public MenuCategoryService(
        IMenuCategoryRepository categoryRepository,
        IMenuItemRepository itemRepository,
        IUnitOfWork unitOfWork,
        IValidator<CreateMenuCategoryRequest> createValidator,
        IValidator<UpdateMenuCategoryRequest> updateValidator)
    {
        _categoryRepository = categoryRepository;
        _itemRepository = itemRepository;
        _unitOfWork = unitOfWork;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    public async Task<IReadOnlyList<MenuCategoryResponse>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var categories = await _categoryRepository.GetAllAsync(cancellationToken);
        return categories.Select(c => c.ToResponse()).ToList();
    }

    public async Task<MenuCategoryResponse> CreateAsync(
        CreateMenuCategoryRequest request,
        CancellationToken cancellationToken = default)
    {
        await _createValidator.ValidateAndThrowAsync(request, cancellationToken);

        if (await _categoryRepository.ExistsByNameAsync(request.Name, cancellationToken: cancellationToken))
            throw new ConflictException($"Category '{request.Name.Trim()}' already exists.");

        var category = new MenuCategory(request.Name.Trim(), request.Description, request.DisplayOrder);
        _categoryRepository.Add(category);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return category.ToResponse();
    }

    public async Task<MenuCategoryResponse> UpdateAsync(
        Guid id,
        UpdateMenuCategoryRequest request,
        CancellationToken cancellationToken = default)
    {
        await _updateValidator.ValidateAndThrowAsync(request, cancellationToken);

        var category = await _categoryRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Menu category", id);

        if (await _categoryRepository.ExistsByNameAsync(request.Name, id, cancellationToken))
            throw new ConflictException($"Category '{request.Name.Trim()}' already exists.");

        category.Update(request.Name.Trim(), request.Description, request.DisplayOrder);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return category.ToResponse();
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var category = await _categoryRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Menu category", id);

        if (await _itemRepository.AnyInCategoryAsync(id, cancellationToken))
            throw new ConflictException("Cannot delete a category that still has menu items.");

        category.SoftDelete();

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
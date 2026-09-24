using RestaurantOS.Domain.Entities;

namespace RestaurantOS.Application.Menu;

public static class MenuMappings
{
    public static MenuCategoryResponse ToResponse(this MenuCategory category) =>
        new(
            category.Id,
            category.Name,
            category.Description,
            category.DisplayOrder,
            category.IsActive);

    public static MenuItemResponse ToResponse(this MenuItem item) =>
        new(
            item.Id,
            item.Name,
            item.Description,
            item.Price,
            item.CategoryId,
            item.Category?.Name ?? string.Empty,
            item.PreparationStation,
            item.IsAvailable,
            item.PreparationTimeInMinutes);
}

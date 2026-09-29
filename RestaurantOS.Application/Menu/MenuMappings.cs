using RestaurantOS.Domain.Entities;
using RestaurantOS.Domain.Enums;

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
            item.PreparationTimeInMinutes,
            item.Allergens.ToList());

    public static IReadOnlyList<Allergen> ToList(this Allergen allergens) =>
        Enum.GetValues<Allergen>()
            .Where(a => a != Allergen.None && allergens.HasFlag(a))
            .ToList();

    public static Allergen ToFlags(this IEnumerable<Allergen>? allergens) =>
        allergens?.Aggregate(Allergen.None, (combined, next) => combined | next) ?? Allergen.None;
}

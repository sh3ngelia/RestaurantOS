namespace RestaurantOS.Application.Menu;

public record MenuCategoryResponse(
    Guid Id,
    string Name,
    string? Description,
    int DisplayOrder,
    bool IsActive);

public record CreateMenuCategoryRequest(string Name, string? Description, int DisplayOrder);
public record UpdateMenuCategoryRequest(string Name, string? Description, int DisplayOrder);
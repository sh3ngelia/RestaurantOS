using RestaurantOS.Domain.Common;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Domain.Entities;

public class MenuItem : BaseEntity
{
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public decimal Price { get; private set; }
    public Guid CategoryId { get; private set; }
    public MenuCategory Category { get; private set; } = null!;
    public Guid StationId { get; private set; }
    public Station Station { get; private set; } = null!;
    public bool IsAvailable { get; private set; }
    public int PreparationTimeInMinutes { get; private set; }
    public Allergen Allergens { get; private set; }

    private MenuItem() { } 

    public MenuItem(
        string name,
        string? description,
        decimal price,
        Guid categoryId,
        Guid stationId,
        int preparationTimeInMinutes,
        Allergen allergens = Allergen.None)
    {
        Validate(name, price, stationId, preparationTimeInMinutes);

        Name = name;
        Description = description;
        Price = price;
        CategoryId = categoryId;
        StationId = stationId;
        PreparationTimeInMinutes = preparationTimeInMinutes;
        Allergens = allergens;
        IsAvailable = true;
    }

    public void Update(
        string name,
        string? description,
        decimal price,
        Guid categoryId,
        Guid stationId,
        int preparationTimeInMinutes,
        Allergen allergens = Allergen.None)
    {
        Validate(name, price, stationId, preparationTimeInMinutes);

        Name = name;
        Description = description;
        Price = price;
        CategoryId = categoryId;
        StationId = stationId;
        PreparationTimeInMinutes = preparationTimeInMinutes;
        Allergens = allergens;
        MarkAsUpdated();
    }

    public void ChangePrice(decimal newPrice)
    {
        ValidatePrice(newPrice);
        Price = newPrice;
        MarkAsUpdated();
    }

    public void MakeAvailable()
    {
        if (IsAvailable)
            throw new DomainException("Menu item is already available");
        IsAvailable = true;
        MarkAsUpdated();
    }

    public void MakeUnavailable()
    {
        if (!IsAvailable)
            throw new DomainException("Menu item is already unavailable");
        IsAvailable = false;
        MarkAsUpdated();
    }

    public void ChangeCategory(Guid newCategoryId)
    {
        if (CategoryId == newCategoryId)
            throw new DomainException("Menu item already belongs to this category");
        CategoryId = newCategoryId;
        MarkAsUpdated();
    }

    private static void Validate(string name, decimal price, Guid stationId, int preparationTimeInMinutes)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Name cannot be empty");
        ValidatePrice(price);
        if (stationId == Guid.Empty)
            throw new DomainException("Station is required");
        if (preparationTimeInMinutes <= 0)
            throw new DomainException("Preparation time must be greater than zero");
    }

    private static void ValidatePrice(decimal price)
    {
        if (price <= 0)
            throw new DomainException("Price must be greater than zero");
    }
}
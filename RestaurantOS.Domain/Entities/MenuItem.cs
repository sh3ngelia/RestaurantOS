using RestaurantOS.Domain.Common;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Domain.Entities;

public class MenuItem : BaseEntity
{
    public string Name { get; private set; }
    public string? Description { get; private set; }
    public decimal Price { get; private set; }
    public Guid CategoryId { get; private set; }
    public MenuCategory Category { get; private set; }
    public PreparationStation PreparationStation { get; private set; }
    public bool IsAvailable { get; private set; }
    public int PreparationTimeInMinutes { get; private set; }

    public MenuItem(string name, string? description, decimal price, Guid categoryId, PreparationStation preparationStation, int preparationTimeInMinutes)
    {
        Validate(name, price, preparationTimeInMinutes);
        Name = name;
        Description = description;
        Price = price;
        CategoryId = categoryId;
        PreparationStation = preparationStation;
        IsAvailable = true;
        PreparationTimeInMinutes = preparationTimeInMinutes;
    }

    public void Update(string name, string? description, decimal price, Guid categoryId, PreparationStation preparationStation, int preparationTimeInMinutes)
    {
        Validate(name, price, preparationTimeInMinutes);
        Name = name;
        Description = description;
        Price = price;
        CategoryId = categoryId;
        PreparationStation = preparationStation;
        PreparationTimeInMinutes = preparationTimeInMinutes;
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

    private static void Validate(string name, decimal price, int preparationTimeInMinutes)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Name cannot be empty");
        ValidatePrice(price);
        if (preparationTimeInMinutes <= 0)
            throw new DomainException("Preparation time must be greater than zero");
    }

    private static void ValidatePrice(decimal price)
    {
        if (price <= 0)
            throw new DomainException("Price must be greater than zero");
    }
}

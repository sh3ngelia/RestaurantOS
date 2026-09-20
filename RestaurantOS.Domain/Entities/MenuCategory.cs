using RestaurantOS.Domain.Common;

namespace RestaurantOS.Domain.Entities;

public class MenuCategory : BaseEntity
{
    public string Name { get; private set; }
    public string? Description { get; private set; }
    public int DisplayOrder { get; private set; }
    public bool IsActive { get; private set; }

    public MenuCategory(string name, string? description, int displayOrder)
    {
        Validate(name, displayOrder);
        Name = name;
        Description = description;
        DisplayOrder = displayOrder;
        IsActive = true;
    }

    public void Update(string name, string? description, int displayOrder)
    {
        Validate(name, displayOrder);
        Name = name;
        Description = description;
        DisplayOrder = displayOrder;
        MarkAsUpdated();
    }

    public void Activate()
    {
        if (IsActive)
            throw new DomainException("Menu category is already active");
        IsActive = true;
        MarkAsUpdated();
    }

    public void Deactivate()
    {
        if (!IsActive)
            throw new DomainException("Menu category is already inactive");
        IsActive = false;
        MarkAsUpdated();
    } 
    
    private static void Validate(string name, int displayOrder)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Name cannot be empty");
        if (displayOrder < 0)
            throw new DomainException("Display order must be non-negative");
    }

}

using RestaurantOS.Domain.Common;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Domain.Entities;

public class Station : BaseEntity
{
    public string Name { get; private set; } = string.Empty;
    public PreparationStation Type { get; private set; }
    public bool FiresImmediately { get; private set; }
    public int DisplayOrder { get; private set; }
    public bool IsActive { get; private set; }

    private Station() { }

    public Station(string name, PreparationStation type, bool firesImmediately, int displayOrder)
    {
        Validate(name, displayOrder);

        Name = name.Trim();
        Type = type;
        FiresImmediately = firesImmediately;
        DisplayOrder = displayOrder;
        IsActive = true;
    }

    public void Update(string name, PreparationStation type, bool firesImmediately, int displayOrder)
    {
        Validate(name, displayOrder);

        Name = name.Trim();
        Type = type;
        FiresImmediately = firesImmediately;
        DisplayOrder = displayOrder;
        MarkAsUpdated();
    }

    public void Activate()
    {
        if (IsActive)
            throw new DomainException("Station is already active");
        IsActive = true;
        MarkAsUpdated();
    }

    public void Deactivate()
    {
        if (!IsActive)
            throw new DomainException("Station is already inactive");
        IsActive = false;
        MarkAsUpdated();
    }

    private static void Validate(string name, int displayOrder)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Station name cannot be empty");
        if (displayOrder < 0)
            throw new DomainException("Display order must be non-negative");
    }
}
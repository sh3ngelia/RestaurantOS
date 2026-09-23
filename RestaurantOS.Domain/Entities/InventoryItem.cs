using RestaurantOS.Domain.Common;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Domain.Entities;

public class InventoryItem : BaseEntity
{
    public string Name { get; private set; }
    public MeasurementUnit Unit { get; private set; }
    public decimal CurrentQuantity { get; private set; }
    public decimal MinimumQuantity { get; private set; }
    public decimal CostPerUnit { get; private set; }
    public bool IsActive { get; private set; }

    private InventoryItem() { }
    public InventoryItem(string name, MeasurementUnit unit, decimal currentQuantity, decimal minimumQuantity, decimal costPerUnit)
    {
        Validate(name, currentQuantity, minimumQuantity, costPerUnit);
        Name = name;
        Unit = unit;
        CurrentQuantity = currentQuantity;
        MinimumQuantity = minimumQuantity;
        CostPerUnit = costPerUnit;
        IsActive = true;
    }

    public bool IsLowStock => CurrentQuantity <= MinimumQuantity;

    public void AddStock(decimal quantityToAdd)
    {
        if (quantityToAdd <= 0)
            throw new DomainException("Quantity to add must be greater than zero");
        CurrentQuantity += quantityToAdd;
        MarkAsUpdated();
    }

    public void ConsumeStock(decimal quantityToConsume)
    {
        if (quantityToConsume <= 0)
            throw new DomainException("Quantity to consume must be greater than zero");
        if (quantityToConsume > CurrentQuantity)
            throw new DomainException("Cannot consume more than the current stock");
        CurrentQuantity -= quantityToConsume;
        MarkAsUpdated();
    }

    public void AdjustStock(decimal newQuantity, string reason)
    {
        if (newQuantity < 0)
            throw new DomainException("New quantity must be non-negative");
        if (string.IsNullOrWhiteSpace(reason))
            throw new DomainException("Reason for stock adjustment is required");
        // TODO: create StockMovement record
        CurrentQuantity = newQuantity;
        MarkAsUpdated();
    }

    public void UpdateMinimumQuantity(decimal newMinimumQuantity)
    {
        if (newMinimumQuantity < 0)
            throw new DomainException("Minimum quantity must be non-negative");
        MinimumQuantity = newMinimumQuantity;
        MarkAsUpdated();
    }

    public void UpdateCostPerUnit(decimal newCostPerUnit)
    {
        if (newCostPerUnit <= 0)
            throw new DomainException("Cost per unit must be greater than zero");
        CostPerUnit = newCostPerUnit;
        MarkAsUpdated();
    }

    public void Activate()
    {
        if (IsActive)
            throw new DomainException("Inventory item is already active");
        IsActive = true;
        MarkAsUpdated();
    }

    public void Deactivate()
    {
        if (!IsActive)
            throw new DomainException("Inventory item is already inactive");
        IsActive = false;
        MarkAsUpdated();
    }

    private static void Validate(string name, decimal currentQuantity, decimal minimumQuantity, decimal costPerUnit)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Name cannot be empty");
        if (currentQuantity < 0)
            throw new DomainException("Current quantity must be non-negative");
        if (minimumQuantity < 0)
            throw new DomainException("Minimum quantity must be non-negative");
        if (costPerUnit <= 0)
            throw new DomainException("Cost per unit must be greater than zero");
    }
}

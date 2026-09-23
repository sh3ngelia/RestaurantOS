using RestaurantOS.Domain.Common;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Domain.Entities;

public class OrderItem : BaseEntity
{
    public Guid OrderId { get; private set; }
    public Guid MenuItemId { get; private set; }
    public MenuItem MenuItem { get; private set; }
    public int Quantity { get; private set; }
    public decimal UnitPrice { get; private set; }
    public int? SeatNumber { get; private set; }
    public OrderItemStatus Status { get; private set; }
    public string? Notes { get; private set; }

    private OrderItem() { }
    public OrderItem(
        Guid orderId, 
        Guid menuItemId, 
        int quantity, 
        decimal unitPrice,
        string? notes = null,
        int? seatNumber = null)
    {
        Validate(quantity, unitPrice, seatNumber);
        OrderId = orderId;
        MenuItemId = menuItemId;
        Quantity = quantity;
        UnitPrice = unitPrice;
        Notes = notes;
        SeatNumber = seatNumber;
        Status = OrderItemStatus.Pending;
    }

    public decimal TotalPrice => UnitPrice * Quantity;

    public void UpdateQuantity(int newQuantity)
    {
        if(Status is not OrderItemStatus.Pending)
            throw new DomainException("Only pending order items can have their quantity updated");
        ValidateQuantity(newQuantity);
        Quantity = newQuantity;
        MarkAsUpdated();
    }

    public void UpdateNotes(string? newNotes)
    {
        Notes = newNotes;
        MarkAsUpdated();
    }

    public void StartPreparation()
    {
        if (Status is not OrderItemStatus.Pending)
            throw new DomainException("Only pending order items can be started for preparation");
        Status = OrderItemStatus.InProgress;
        MarkAsUpdated();
    }

    public void MarkAsReady()
    {
        if (Status is not OrderItemStatus.InProgress)
            throw new DomainException("Only in-progress order items can be marked as ready");
        Status = OrderItemStatus.Ready;
        MarkAsUpdated();
    }

    public void MarkAsServed()
    {
        if (Status is not OrderItemStatus.Ready)
            throw new DomainException("Only ready order items can be marked as served");
        Status = OrderItemStatus.Served;
        MarkAsUpdated();
    }

    public void Cancel()
    {
        if (Status is OrderItemStatus.Served or OrderItemStatus.Cancelled or OrderItemStatus.Ready)
            throw new DomainException("Only pending or in-progress items can be cancelled"); 
        Status = OrderItemStatus.Cancelled;
        MarkAsUpdated();
    }

    private static void Validate(int quantity, decimal unitPrice, int? seatNumber)
    {
        ValidateQuantity(quantity);
        ValidateUnitPrice(unitPrice);
        ValidateSeatNumber(seatNumber); 
    }

    private static void ValidateQuantity(int quantity)
    {
        if (quantity <= 0)
            throw new DomainException("Quantity must be greater than zero");
    }

    private static void ValidateUnitPrice(decimal unitPrice)
    {
        if (unitPrice <= 0)
            throw new DomainException("Unit price must be greater than zero");
    }

    private static void ValidateSeatNumber(int? seatNumber)
    {
        if (seatNumber.HasValue && seatNumber.Value <= 0)
            throw new DomainException("Seat number must be greater than zero");
    }
}

using RestaurantOS.Domain.Common;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Domain.Entities;

public class OrderItem : BaseEntity
{
    public Guid OrderId { get; private set; }
    public Guid MenuItemId { get; private set; }
    public MenuItem MenuItem { get; private set; } = null!;

    // Snapshot — შეკვეთის მომენტისას
    public string MenuItemName { get; private set; } = string.Empty;
    public decimal UnitPrice { get; private set; }
    public Allergen Allergens { get; private set; }

    // სადგური — ასევე snapshot
    public Guid StationId { get; private set; }
    public string StationName { get; private set; } = string.Empty;
    public PreparationStation StationType { get; private set; }
    public bool FiresImmediately { get; private set; }

    public Course Course { get; private set; }
    public int Quantity { get; private set; }
    public int? SeatNumber { get; private set; }
    public string? Notes { get; private set; }
    public OrderItemStatus Status { get; private set; }

    // სამზარეულოს ტაიმერებისა და სტატისტიკისთვის
    public DateTime? FiredAt { get; private set; }
    public DateTime? ReadyAt { get; private set; }

    private OrderItem() { } // EF Core

    internal OrderItem(Guid orderId, MenuItem menuItem, int quantity, Course course, string? notes, int? seatNumber)
    {
        ValidateQuantity(quantity);
        ValidateSeatNumber(seatNumber);

        OrderId = orderId;
        MenuItemId = menuItem.Id;
        MenuItemName = menuItem.Name;
        UnitPrice = menuItem.Price;
        Allergens = menuItem.Allergens;

        StationId = menuItem.StationId;
        StationName = menuItem.Station.Name;
        StationType = menuItem.Station.Type;
        FiresImmediately = menuItem.Station.FiresImmediately;

        Course = course;
        Quantity = quantity;
        Notes = notes;
        SeatNumber = seatNumber;
        Status = OrderItemStatus.Draft;
    }

    public decimal TotalPrice => UnitPrice * Quantity;

    public bool IsActive => Status is not (OrderItemStatus.Served or OrderItemStatus.Cancelled);

    internal void UpdateQuantity(int quantity)
    {
        if (Status != OrderItemStatus.Draft)
            throw new DomainException("Quantity can only be changed before the item is sent.");

        ValidateQuantity(quantity);
        Quantity = quantity;
        MarkAsUpdated();
    }

    internal void Send(bool fireNow)
    {
        if (Status != OrderItemStatus.Draft)
            throw new DomainException("Only new items can be sent.");

        if (fireNow)
        {
            Fire();
            return;
        }

        Status = OrderItemStatus.Held;
        MarkAsUpdated();
    }

    internal void Fire()
    {
        if (Status is not (OrderItemStatus.Draft or OrderItemStatus.Held))
            throw new DomainException("Only new or held items can be fired.");

        Status = OrderItemStatus.Pending;
        FiredAt = DateTime.UtcNow;
        MarkAsUpdated();
    }

    internal void StartPreparation()
    {
        if (Status != OrderItemStatus.Pending)
            throw new DomainException("Only fired items can be started.");

        Status = OrderItemStatus.InProgress;
        MarkAsUpdated();
    }

    internal void MarkAsReady()
    {
        if (Status is not (OrderItemStatus.Pending or OrderItemStatus.InProgress))
            throw new DomainException("Only fired or in-progress items can be marked as ready.");

        Status = OrderItemStatus.Ready;
        ReadyAt = DateTime.UtcNow;
        MarkAsUpdated();
    }

    internal void MarkAsServed()
    {
        if (Status != OrderItemStatus.Ready)
            throw new DomainException("Only ready items can be served.");

        Status = OrderItemStatus.Served;
        MarkAsUpdated();
    }

    internal void Cancel()
    {
        if (Status is OrderItemStatus.Ready or OrderItemStatus.Served or OrderItemStatus.Cancelled)
            throw new DomainException("Ready, served or cancelled items cannot be cancelled.");

        Status = OrderItemStatus.Cancelled;
        MarkAsUpdated();
    }

    private static void ValidateQuantity(int quantity)
    {
        if (quantity <= 0)
            throw new DomainException("Quantity must be greater than zero");
    }

    private static void ValidateSeatNumber(int? seatNumber)
    {
        if (seatNumber.HasValue && seatNumber.Value <= 0)
            throw new DomainException("Seat number must be greater than zero");
    }
}
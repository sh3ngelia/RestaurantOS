using RestaurantOS.Domain.Common;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Domain.Entities;

public class Order : BaseEntity
{
    public string OrderNumber { get; private set; } = string.Empty;
    public OrderType Type { get; private set; }
    public OrderStatus Status { get; private set; }
    public Guid? TableId { get; private set; }
    public Guid? WaiterId { get; private set; }
    public Guid? CustomerId { get; private set; }
    public string? DeliveryAddress { get; private set; }
    public string? Notes { get; private set; }

   public Course? CurrentCourse { get; private set; }

    private readonly List<OrderItem> _items = new();
    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();

    private Order() { }

    public Order(
        string orderNumber,
        OrderType type,
        Guid? tableId = null,
        Guid? waiterId = null,
        Guid? customerId = null,
        string? deliveryAddress = null,
        string? notes = null)
    {
        ValidateOrderNumber(orderNumber);
        ValidateOrderType(type, tableId, waiterId, customerId, deliveryAddress);

        OrderNumber = orderNumber;
        Type = type;
        Status = OrderStatus.Opened;
        TableId = tableId;
        WaiterId = waiterId;
        CustomerId = customerId;
        DeliveryAddress = deliveryAddress;
        Notes = notes;
    }

    public decimal TotalAmount => _items
        .Where(i => i.Status != OrderItemStatus.Cancelled)
        .Sum(i => i.TotalPrice);

    public OrderItem AddItem(MenuItem menuItem, int quantity, Course course, string? notes = null, int? seatNumber = null)
    {
        EnsureOpen();

        if (!menuItem.IsAvailable)
            throw new DomainException($"{menuItem.Name} is not available right now.");

        var item = new OrderItem(Id, menuItem, quantity, course, notes, seatNumber);
        _items.Add(item);
        MarkAsUpdated();
        return item;
    }

    public void RemoveItem(Guid itemId)
    {
        EnsureOpen();
        var item = GetItem(itemId);

        if (item.Status != OrderItemStatus.Draft)
            throw new DomainException("Only items that have not been sent can be removed. Cancel the item instead.");

        _items.Remove(item);
        MarkAsUpdated();
    }

    public void UpdateItemQuantity(Guid itemId, int quantity) =>
        ChangeItem(itemId, i => i.UpdateQuantity(quantity));

    public void SendRound()
    {
        EnsureOpen();

        var drafts = _items.Where(i => i.Status == OrderItemStatus.Draft).ToList();
        if (drafts.Count == 0)
            throw new DomainException("There are no new items to send.");

        var kitchenDrafts = drafts.Where(i => !i.FiresImmediately).ToList();
        if (CurrentCourse is null && kitchenDrafts.Count > 0)
            CurrentCourse = kitchenDrafts.Min(i => i.Course);

        foreach (var item in drafts)
        {
            var fireNow = item.FiresImmediately || item.Course <= CurrentCourse;
            item.Send(fireNow);
        }

        MarkAsUpdated();
    }

    public void FireNextCourse()
    {
        EnsureOpen();

        var held = _items.Where(i => i.Status == OrderItemStatus.Held).ToList();
        if (held.Count == 0)
            throw new DomainException("There is no held course to fire.");

        var nextCourse = held.Min(i => i.Course);
        CurrentCourse = nextCourse;

        foreach (var item in held.Where(i => i.Course <= nextCourse))
            item.Fire();

        MarkAsUpdated();
    }

    public void StartItem(Guid itemId) => ChangeItem(itemId, i => i.StartPreparation());
    public void MarkItemReady(Guid itemId) => ChangeItem(itemId, i => i.MarkAsReady());
    public void MarkItemServed(Guid itemId) => ChangeItem(itemId, i => i.MarkAsServed());
    public void CancelItem(Guid itemId) => ChangeItem(itemId, i => i.Cancel());

    public void Close()
    {
        EnsureOpen();

        if (_items.Any(i => i.IsActive))
            throw new DomainException("All items must be served or cancelled before the order can be closed.");

        if (!_items.Any(i => i.Status == OrderItemStatus.Served))
            throw new DomainException("Nothing was served on this order. Cancel it instead.");

        Status = OrderStatus.Closed;
        MarkAsUpdated();
    }

    public void Cancel()
    {
        EnsureOpen();

        if (_items.Any(i => i.Status is not (OrderItemStatus.Draft or OrderItemStatus.Cancelled)))
            throw new DomainException("Items have already been sent. Cancel them individually instead.");

        Status = OrderStatus.Cancelled;
        MarkAsUpdated();
    }

    private void ChangeItem(Guid itemId, Action<OrderItem> change)
    {
        EnsureOpen();
        change(GetItem(itemId));
        MarkAsUpdated();
    }

    private OrderItem GetItem(Guid itemId) =>
        _items.FirstOrDefault(i => i.Id == itemId)
            ?? throw new DomainException("Item not found on this order.");

    private void EnsureOpen()
    {
        if (Status != OrderStatus.Opened)
            throw new DomainException("This order is no longer open.");
    }

    private static void ValidateOrderNumber(string orderNumber)
    {
        if (string.IsNullOrWhiteSpace(orderNumber))
            throw new DomainException("Order number cannot be empty");
    }

    private static void ValidateOrderType(
        OrderType type,
        Guid? tableId,
        Guid? waiterId,
        Guid? customerId,
        string? deliveryAddress)
    {
        switch (type)
        {
            case OrderType.DineIn:
                if (!tableId.HasValue)
                    throw new DomainException("Dine-in order requires a table");
                if (!waiterId.HasValue)
                    throw new DomainException("Dine-in order requires a waiter");
                break;

            case OrderType.Delivery:
                if (!customerId.HasValue)
                    throw new DomainException("Delivery order requires a customer");
                if (string.IsNullOrWhiteSpace(deliveryAddress))
                    throw new DomainException("Delivery order requires a delivery address");
                break;

            case OrderType.Takeaway:
                if (!customerId.HasValue)
                    throw new DomainException("Takeaway order requires a customer");
                break;
        }
    }
}
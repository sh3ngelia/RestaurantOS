using RestaurantOS.Domain.Common;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Domain.Entities;

public class Order : BaseEntity
{
    public string OrderNumber { get; private set; }
    public OrderType Type { get; private set; }
    public OrderStatus Status { get; private set; }
    public Guid? TableId { get; private set; }
    public Guid? WaiterId { get; private set; }
    public Guid? CustomerId { get; private set; }
    public string? DeliveryAddress { get; private set; }
    public string? Notes { get; private set; }
    private readonly List<OrderItem> _items = new();
    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();

    private Order() { }
    public Order(string orderNumber, OrderType type, Guid? tableId = null, Guid? waiterId = null, Guid? customerId = null, string? deliveryAddress = null, string? notes = null)
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

    public void AddItem(Guid menuItemId, int quantity, decimal unitPrice, int? seatNumber = null, string? notes = null)
    {
        if (Status != OrderStatus.Opened)
            throw new DomainException("Items can only be added to orders that are in progress");
        var orderItem = new OrderItem(Id, menuItemId, quantity, unitPrice, notes, seatNumber);
        _items.Add(orderItem);
        MarkAsUpdated();
    }

    public void RemoveItem(Guid orderItemId)
    {
        var item = _items.FirstOrDefault(i => i.Id == orderItemId);
        if (item is null)
            throw new DomainException("Order item not found");
        _items.Remove(item);
        MarkAsUpdated();
    }

    public void SendToKitchen()
    {
        if (Status != OrderStatus.Opened)
            throw new DomainException("Only opened orders can be sent to the kitchen");
        if (!_items.Any())
            throw new DomainException("Cannot send an order with no items to the kitchen");
        Status = OrderStatus.SentToKitchen;
        MarkAsUpdated();
    }
    
    public void StartPreparation()
    {
        if (Status != OrderStatus.SentToKitchen)
            throw new DomainException("Only orders that are sent to the kitchen can be started for preparation");
        Status = OrderStatus.InProgress;
        MarkAsUpdated();
    }

    public void MarkAsReady()
    {
        if(Status != OrderStatus.SentToKitchen && Status != OrderStatus.InProgress)
            throw new DomainException("Only orders that are sent to the kitchen or in progress can be marked as ready");
        Status = OrderStatus.Ready;
        MarkAsUpdated();
    }

    public void MarkAsServed()
    {
        if(Status != OrderStatus.Ready)
            throw new DomainException("Only ready orders can be marked as served");
        Status = OrderStatus.Served;
        MarkAsUpdated();
    }

    public void Close()
    {
        if (Status != OrderStatus.Served)
            throw new DomainException("Only served orders can be closed");
        Status = OrderStatus.Closed;
        MarkAsUpdated();
    }

    public void Cancel()
    {
        if (Status == OrderStatus.Closed || Status == OrderStatus.Cancelled)
            throw new DomainException("Only opened, sent to kitchen, in progress, or ready orders can be cancelled");
        Status = OrderStatus.Cancelled;
        MarkAsUpdated();
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

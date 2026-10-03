using RestaurantOS.Application.Menu;
using RestaurantOS.Domain.Entities;

namespace RestaurantOS.Application.Orders;

public static class OrderMappings
{
    public static OrderItemResponse ToResponse(this OrderItem item) =>
        new(
            item.Id,
            item.MenuItemId,
            item.MenuItemName,
            item.UnitPrice,
            item.Quantity,
            item.TotalPrice,
            item.Course,
            item.StationId,
            item.StationName,
            item.StationType,
            item.Allergens.ToList(),
            item.SeatNumber,
            item.Notes,
            item.Status,
            item.FiredAt,
            item.ReadyAt);

    public static OrderResponse ToResponse(this Order order, int? tableNumber) =>
        new(
            order.Id,
            order.OrderNumber,
            order.Type,
            order.Status,
            order.TableId,
            tableNumber,
            order.WaiterId,
            order.Notes,
            order.CurrentCourse,
            order.TotalAmount,
            order.CreatedAt,
            order.Items.OrderBy(i => i.CreatedAt).Select(i => i.ToResponse()).ToList());
}
using RestaurantOS.Application.Common.Interfaces;
using RestaurantOS.Application.Menu;
using RestaurantOS.Domain.Entities;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Application.Kitchen;

public class KitchenService : IKitchenService
{
    private static readonly OrderItemStatus[] StationStatuses =
        [OrderItemStatus.Pending, OrderItemStatus.InProgress];

    private static readonly OrderItemStatus[] PassStatuses =
        [OrderItemStatus.Pending, OrderItemStatus.InProgress, OrderItemStatus.Ready];

    private readonly IOrderRepository _orderRepository;
    private readonly ITableRepository _tableRepository;

    public KitchenService(IOrderRepository orderRepository, ITableRepository tableRepository)
    {
        _orderRepository = orderRepository;
        _tableRepository = tableRepository;
    }

    public async Task<IReadOnlyList<KitchenTicketResponse>> GetTicketsAsync(Guid? stationId, CancellationToken cancellationToken = default)
    {
        var statuses = stationId is null ? PassStatuses : StationStatuses;

        var orders = await _orderRepository.GetWithKitchenItemsAsync(stationId, statuses, cancellationToken);
        var tables = await _tableRepository.GetAllAsync(cancellationToken);
        var tableNumbers = tables.ToDictionary(t => t.Id, t => t.TableNumber);

        return orders
            .Select(order => ToTicket(order, stationId, statuses, tableNumbers))
            .Where(ticket => ticket.Items.Count > 0)
            .OrderBy(ticket => ticket.FiredAt)          // ყველაზე ძველი ბონი — პირველი
            .ToList();
    }

    private static KitchenTicketResponse ToTicket(
        Order order,
        Guid? stationId,
        OrderItemStatus[] statuses,
        Dictionary<Guid, int> tableNumbers)
    {
        var items = order.Items
            .Where(i => statuses.Contains(i.Status) && (stationId is null || i.StationId == stationId))
            .OrderBy(i => i.Course)
            .ThenBy(i => i.FiredAt)
            .ToList();

        int? tableNumber = order.TableId is { } id && tableNumbers.TryGetValue(id, out var n) ? n : null;

        return new KitchenTicketResponse(
            order.Id,
            order.OrderNumber,
            tableNumber,
            items.Min(i => i.FiredAt) ?? order.CreatedAt,
            items.Select(i => new KitchenTicketItemResponse(
                i.Id,
                i.MenuItemName,
                i.Quantity,
                i.Course,
                i.SeatNumber,
                i.Notes,
                i.Allergens.ToList(),
                i.Status,
                i.StationId,
                i.StationName,
                i.FiredAt)).ToList());
    }
}
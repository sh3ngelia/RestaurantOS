using RestaurantOS.Application.Common.Exceptions;
using RestaurantOS.Application.Common.Interfaces;
using RestaurantOS.Application.Menu;
using RestaurantOS.Domain.Entities;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Application.Kitchen;

public class KitchenService : IKitchenService
{
    private static readonly OrderItemStatus[] StationStatuses =
        [OrderItemStatus.Held, OrderItemStatus.Pending, OrderItemStatus.InProgress];

    private static readonly OrderItemStatus[] OverviewStatuses =
        [OrderItemStatus.Held, OrderItemStatus.Pending, OrderItemStatus.InProgress, OrderItemStatus.Ready];

    private readonly IOrderRepository _orderRepository;
    private readonly ITableRepository _tableRepository;
    private readonly IStationRepository _stationRepository;
    private readonly ICurrentUserService _currentUser;

    public KitchenService(
        IOrderRepository orderRepository,
        ITableRepository tableRepository,
        IStationRepository stationRepository,
        ICurrentUserService currentUser)
    {
        _orderRepository = orderRepository;
        _tableRepository = tableRepository;
        _stationRepository = stationRepository;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<KitchenTicketResponse>> GetTicketsAsync(
        Guid? stationId,
        PreparationStation? stationType,
        CancellationToken cancellationToken = default)
    {
        if (stationId is { } id)
        {
            var station = await _stationRepository.GetByIdAsync(id, cancellationToken)
                ?? throw new NotFoundException("Station", id);

            EnsureCanView(station.Type);
            return await BuildTicketsAsync(id, null, StationStatuses, cancellationToken);
        }

        if (stationType is { } type)
        {
            EnsureCanView(type);
            return await BuildTicketsAsync(null, type, OverviewStatuses, cancellationToken);
        }

        if (!_currentUser.IsInRole(UserRole.Manager))
            throw new ForbiddenException("Only managers can view all stations at once.");

        return await BuildTicketsAsync(null, null, OverviewStatuses, cancellationToken);
    }

    private void EnsureCanView(PreparationStation type)
    {
        if (_currentUser.IsInRole(UserRole.Manager))
            return;

        var allowed = type switch
        {
            PreparationStation.Kitchen => _currentUser.IsInRole(UserRole.Kitchen),
            PreparationStation.Bar => _currentUser.IsInRole(UserRole.Bar),
            _ => false
        };

        if (!allowed)
            throw new ForbiddenException($"Your role cannot view {type.ToString().ToLowerInvariant()} tickets.");
    }

    private async Task<IReadOnlyList<KitchenTicketResponse>> BuildTicketsAsync(
        Guid? stationId,
        PreparationStation? stationType,
        OrderItemStatus[] statuses,
        CancellationToken cancellationToken)
    {
        var orders = await _orderRepository.GetWithKitchenItemsAsync(stationId, stationType, statuses, cancellationToken);
        var tables = await _tableRepository.GetAllAsync(cancellationToken);
        var tableNumbers = tables.ToDictionary(t => t.Id, t => t.TableNumber);

        return orders
            .Select(order => ToTicket(order, stationId, stationType, statuses, tableNumbers))
            .Where(ticket => ticket.Items.Count > 0)
            .OrderBy(ticket => ticket.FiredAt)
            .ToList();
    }

    private static KitchenTicketResponse ToTicket(
        Order order,
        Guid? stationId,
        PreparationStation? stationType,
        OrderItemStatus[] statuses,
        Dictionary<Guid, int> tableNumbers)
    {
        var items = order.Items
            .Where(i => statuses.Contains(i.Status) &&
                        (stationId is null || i.StationId == stationId) &&
                        (stationType is null || i.StationType == stationType))
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
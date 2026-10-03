using FluentValidation;
using RestaurantOS.Application.Common.Exceptions;
using RestaurantOS.Application.Common.Interfaces;
using RestaurantOS.Domain.Common;
using RestaurantOS.Domain.Entities;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Application.Orders;

public class OrderService : IOrderService
{
    private readonly IOrderRepository _orderRepository;
    private readonly ITableRepository _tableRepository;
    private readonly IMenuItemRepository _menuItemRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IValidator<OpenOrderRequest> _openValidator;
    private readonly IValidator<AddOrderItemRequest> _addItemValidator;
    private readonly IValidator<UpdateOrderItemQuantityRequest> _quantityValidator;

    public OrderService(
        IOrderRepository orderRepository,
        ITableRepository tableRepository,
        IMenuItemRepository menuItemRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        IValidator<OpenOrderRequest> openValidator,
        IValidator<AddOrderItemRequest> addItemValidator,
        IValidator<UpdateOrderItemQuantityRequest> quantityValidator)
    {
        _orderRepository = orderRepository;
        _tableRepository = tableRepository;
        _menuItemRepository = menuItemRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _openValidator = openValidator;
        _addItemValidator = addItemValidator;
        _quantityValidator = quantityValidator;
    }


    public async Task<IReadOnlyList<OrderResponse>> GetOpenAsync(Guid? tableId, CancellationToken cancellationToken = default)
    {
        var orders = await _orderRepository.GetOpenAsync(tableId, cancellationToken);
        var tables = await _tableRepository.GetAllAsync(cancellationToken);
        var tableNumbers = tables.ToDictionary(t => t.Id, t => t.TableNumber);

        return orders
            .Select(o => o.ToResponse(o.TableId is { } id && tableNumbers.TryGetValue(id, out var n) ? n : null))
            .ToList();
    }

    public async Task<OrderResponse> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var order = await GetOrderOrThrowAsync(id, cancellationToken);
        return await ToResponseAsync(order, cancellationToken);
    }


    public async Task<OrderResponse> OpenAsync(OpenOrderRequest request, CancellationToken cancellationToken = default)
    {
        await _openValidator.ValidateAndThrowAsync(request, cancellationToken);

        var table = await _tableRepository.GetByIdAsync(request.TableId, cancellationToken)
            ?? throw new NotFoundException("Table", request.TableId);

        if (table.Status != TableStatus.Occupied)
            throw new DomainException($"Seat guests at table {table.TableNumber} before opening an order.");

        if (await _orderRepository.HasOpenOrderForTableAsync(table.Id, cancellationToken))
            throw new ConflictException($"Table {table.TableNumber} already has an open order.");

        var waiterId = _currentUser.UserId
            ?? throw new AuthenticationFailedException("Unknown user.");

        var orderNumber = await GenerateOrderNumberAsync(cancellationToken);

        var order = new Order(orderNumber, OrderType.DineIn, table.Id, waiterId, notes: request.Notes);
        _orderRepository.Add(order);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return order.ToResponse(table.TableNumber);
    }


    public async Task<OrderResponse> AddItemAsync(Guid orderId, AddOrderItemRequest request, CancellationToken cancellationToken = default)
    {
        await _addItemValidator.ValidateAndThrowAsync(request, cancellationToken);

        var order = await GetOrderOrThrowAsync(orderId, cancellationToken);

        var menuItem = await _menuItemRepository.GetByIdAsync(request.MenuItemId, cancellationToken)
            ?? throw new NotFoundException("Menu item", request.MenuItemId);

        order.AddItem(menuItem, request.Quantity, request.Course, request.Notes, request.SeatNumber);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return await ToResponseAsync(order, cancellationToken);
    }

    public async Task<OrderResponse> UpdateItemQuantityAsync(Guid orderId, Guid itemId, UpdateOrderItemQuantityRequest request, CancellationToken cancellationToken = default)
    {
        await _quantityValidator.ValidateAndThrowAsync(request, cancellationToken);
        return await ChangeAsync(orderId, o => o.UpdateItemQuantity(itemId, request.Quantity), cancellationToken);
    }

    public Task<OrderResponse> RemoveItemAsync(Guid orderId, Guid itemId, CancellationToken cancellationToken = default) =>
        ChangeAsync(orderId, o => o.RemoveItem(itemId), cancellationToken);


    public Task<OrderResponse> SendRoundAsync(Guid orderId, CancellationToken cancellationToken = default) =>
        ChangeAsync(orderId, o => o.SendRound(), cancellationToken);

    public Task<OrderResponse> FireNextCourseAsync(Guid orderId, CancellationToken cancellationToken = default) =>
        ChangeAsync(orderId, o => o.FireNextCourse(), cancellationToken);

    public Task<OrderResponse> StartItemAsync(Guid orderId, Guid itemId, CancellationToken cancellationToken = default) =>
        ChangeAsync(orderId, o => o.StartItem(itemId), cancellationToken);

    public Task<OrderResponse> MarkItemReadyAsync(Guid orderId, Guid itemId, CancellationToken cancellationToken = default) =>
        ChangeAsync(orderId, o => o.MarkItemReady(itemId), cancellationToken);

    public Task<OrderResponse> MarkItemServedAsync(Guid orderId, Guid itemId, CancellationToken cancellationToken = default) =>
        ChangeAsync(orderId, o => o.MarkItemServed(itemId), cancellationToken);

    public Task<OrderResponse> CancelItemAsync(Guid orderId, Guid itemId, CancellationToken cancellationToken = default) =>
        ChangeAsync(orderId, o => o.CancelItem(itemId), cancellationToken);


    public Task<OrderResponse> CloseAsync(Guid orderId, CancellationToken cancellationToken = default) =>
        ChangeAsync(orderId, o => o.Close(), cancellationToken);

    public Task<OrderResponse> CancelAsync(Guid orderId, CancellationToken cancellationToken = default) =>
        ChangeAsync(orderId, o => o.Cancel(), cancellationToken);


    private async Task<OrderResponse> ChangeAsync(Guid orderId, Action<Order> change, CancellationToken cancellationToken)
    {
        var order = await GetOrderOrThrowAsync(orderId, cancellationToken);
        change(order);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return await ToResponseAsync(order, cancellationToken);
    }

    private async Task<Order> GetOrderOrThrowAsync(Guid id, CancellationToken cancellationToken) =>
        await _orderRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Order", id);

    private async Task<OrderResponse> ToResponseAsync(Order order, CancellationToken cancellationToken)
    {
        int? tableNumber = null;
        if (order.TableId is { } tableId)
            tableNumber = (await _tableRepository.GetByIdAsync(tableId, cancellationToken))?.TableNumber;

        return order.ToResponse(tableNumber);
    }

    private async Task<string> GenerateOrderNumberAsync(CancellationToken cancellationToken)
    {
        var todayUtc = DateTime.UtcNow.Date;
        var count = await _orderRepository.CountCreatedSinceAsync(todayUtc, cancellationToken);
        return $"{todayUtc:yyMMdd}-{count + 1:D3}";
    }
}
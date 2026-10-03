using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantOS.Application.Orders;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.API.Controllers;

[ApiController]
[Route("api/orders")]
[Authorize]
public class OrdersController : ControllerBase
{
    private const string FloorRoles = $"{nameof(UserRole.Waiter)},{nameof(UserRole.Manager)}";
    private const string ProductionRoles = $"{nameof(UserRole.Kitchen)},{nameof(UserRole.Bar)},{nameof(UserRole.Manager)}";

    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpGet]
    [Authorize(Roles = FloorRoles)]
    public async Task<ActionResult<IReadOnlyList<OrderResponse>>> GetOpen([FromQuery] Guid? tableId, CancellationToken ct) =>
        Ok(await _orderService.GetOpenAsync(tableId, ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<OrderResponse>> GetById(Guid id, CancellationToken ct) =>
        Ok(await _orderService.GetByIdAsync(id, ct));

    [HttpPost]
    [Authorize(Roles = FloorRoles)]
    public async Task<ActionResult<OrderResponse>> Open(OpenOrderRequest request, CancellationToken ct)
    {
        var response = await _orderService.OpenAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = response.Id }, response);
    }

    [HttpPost("{id:guid}/items")]
    [Authorize(Roles = FloorRoles)]
    public async Task<ActionResult<OrderResponse>> AddItem(Guid id, AddOrderItemRequest request, CancellationToken ct) =>
        Ok(await _orderService.AddItemAsync(id, request, ct));

    [HttpPatch("{id:guid}/items/{itemId:guid}")]
    [Authorize(Roles = FloorRoles)]
    public async Task<ActionResult<OrderResponse>> UpdateItemQuantity(Guid id, Guid itemId, UpdateOrderItemQuantityRequest request, CancellationToken ct) =>
        Ok(await _orderService.UpdateItemQuantityAsync(id, itemId, request, ct));

    [HttpDelete("{id:guid}/items/{itemId:guid}")]
    [Authorize(Roles = FloorRoles)]
    public async Task<ActionResult<OrderResponse>> RemoveItem(Guid id, Guid itemId, CancellationToken ct) =>
        Ok(await _orderService.RemoveItemAsync(id, itemId, ct));

    [HttpPost("{id:guid}/send")]
    [Authorize(Roles = FloorRoles)]
    public async Task<ActionResult<OrderResponse>> SendRound(Guid id, CancellationToken ct) =>
        Ok(await _orderService.SendRoundAsync(id, ct));

    [HttpPost("{id:guid}/fire-next")]
    [Authorize(Roles = FloorRoles)]
    public async Task<ActionResult<OrderResponse>> FireNextCourse(Guid id, CancellationToken ct) =>
        Ok(await _orderService.FireNextCourseAsync(id, ct));

    [HttpPost("{id:guid}/items/{itemId:guid}/serve")]
    [Authorize(Roles = FloorRoles)]
    public async Task<ActionResult<OrderResponse>> ServeItem(Guid id, Guid itemId, CancellationToken ct) =>
        Ok(await _orderService.MarkItemServedAsync(id, itemId, ct));

    [HttpPost("{id:guid}/items/{itemId:guid}/cancel")]
    [Authorize(Roles = FloorRoles)]
    public async Task<ActionResult<OrderResponse>> CancelItem(Guid id, Guid itemId, CancellationToken ct) =>
        Ok(await _orderService.CancelItemAsync(id, itemId, ct));

    [HttpPost("{id:guid}/close")]
    [Authorize(Roles = FloorRoles)]
    public async Task<ActionResult<OrderResponse>> Close(Guid id, CancellationToken ct) =>
        Ok(await _orderService.CloseAsync(id, ct));

    [HttpPost("{id:guid}/cancel")]
    [Authorize(Roles = FloorRoles)]
    public async Task<ActionResult<OrderResponse>> Cancel(Guid id, CancellationToken ct) =>
        Ok(await _orderService.CancelAsync(id, ct));

    [HttpPost("{id:guid}/items/{itemId:guid}/start")]
    [Authorize(Roles = ProductionRoles)]
    public async Task<ActionResult<OrderResponse>> StartItem(Guid id, Guid itemId, CancellationToken ct) =>
        Ok(await _orderService.StartItemAsync(id, itemId, ct));

    [HttpPost("{id:guid}/items/{itemId:guid}/ready")]
    [Authorize(Roles = ProductionRoles)]
    public async Task<ActionResult<OrderResponse>> MarkItemReady(Guid id, Guid itemId, CancellationToken ct) =>
        Ok(await _orderService.MarkItemReadyAsync(id, itemId, ct));
}
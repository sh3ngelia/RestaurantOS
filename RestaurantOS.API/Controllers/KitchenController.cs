using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantOS.Application.Kitchen;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.API.Controllers;

[ApiController]
[Route("api/kitchen")]
[Authorize(Roles = $"{nameof(UserRole.Kitchen)},{nameof(UserRole.Bar)},{nameof(UserRole.Manager)}")]
public class KitchenController : ControllerBase
{
    private readonly IKitchenService _kitchenService;

    public KitchenController(IKitchenService kitchenService)
    {
        _kitchenService = kitchenService;
    }

    [HttpGet("tickets")]
    public async Task<ActionResult<IReadOnlyList<KitchenTicketResponse>>> GetTickets(
    [FromQuery] Guid? stationId,
    [FromQuery] PreparationStation? type,
    CancellationToken ct) =>
    Ok(await _kitchenService.GetTicketsAsync(stationId, type, ct));
}
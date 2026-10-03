using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantOS.Application.Stations;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.API.Controllers;

[ApiController]
[Route("api/stations")]
[Authorize]
public class StationsController : ControllerBase
{
    private readonly IStationService _stationService;

    public StationsController(IStationService stationService)
    {
        _stationService = stationService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<StationResponse>>> GetAll(CancellationToken ct) =>
        Ok(await _stationService.GetAllAsync(ct));

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Manager))]
    public async Task<ActionResult<StationResponse>> Create(CreateStationRequest request, CancellationToken ct) =>
        StatusCode(StatusCodes.Status201Created, await _stationService.CreateAsync(request, ct));

    [HttpPut("{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Manager))]
    public async Task<ActionResult<StationResponse>> Update(Guid id, UpdateStationRequest request, CancellationToken ct) =>
        Ok(await _stationService.UpdateAsync(id, request, ct));

    [HttpPost("{id:guid}/activate")]
    [Authorize(Roles = nameof(UserRole.Manager))]
    public async Task<ActionResult<StationResponse>> Activate(Guid id, CancellationToken ct) =>
        Ok(await _stationService.ActivateAsync(id, ct));

    [HttpPost("{id:guid}/deactivate")]
    [Authorize(Roles = nameof(UserRole.Manager))]
    public async Task<ActionResult<StationResponse>> Deactivate(Guid id, CancellationToken ct) =>
        Ok(await _stationService.DeactivateAsync(id, ct));

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Manager))]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _stationService.DeleteAsync(id, ct);
        return NoContent();
    }
}
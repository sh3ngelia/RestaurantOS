using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantOS.Application.Reservations;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.API.Controllers;

[ApiController]
[Route("api/reservations")]
[Authorize(Roles = $"{nameof(UserRole.Host)},{nameof(UserRole.Manager)}")]
public class ReservationsController : ControllerBase
{
    private readonly IReservationService _reservationService;

    public ReservationsController(IReservationService reservationService)
    {
        _reservationService = reservationService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ReservationResponse>>> GetInRange(
        [FromQuery] DateTimeOffset from,
        [FromQuery] DateTimeOffset to,
        CancellationToken cancellationToken) =>
        Ok(await _reservationService.GetInRangeAsync(from, to, cancellationToken));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ReservationResponse>> GetById(Guid id, CancellationToken cancellationToken) =>
        Ok(await _reservationService.GetByIdAsync(id, cancellationToken));

    [HttpPost]
    public async Task<ActionResult<ReservationResponse>> Create(CreateReservationRequest request, CancellationToken cancellationToken)
    {
        var response = await _reservationService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = response.Id }, response);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ReservationResponse>> UpdateGuestInfo(Guid id, UpdateReservationGuestInfoRequest request, CancellationToken cancellationToken) =>
        Ok(await _reservationService.UpdateGuestInfoAsync(id, request, cancellationToken));

    [HttpPatch("{id:guid}/reschedule")]
    public async Task<ActionResult<ReservationResponse>> Reschedule(Guid id, RescheduleReservationRequest request, CancellationToken cancellationToken) =>
        Ok(await _reservationService.RescheduleAsync(id, request, cancellationToken));

    [HttpPost("{id:guid}/confirm")]
    public async Task<ActionResult<ReservationResponse>> Confirm(Guid id, CancellationToken cancellationToken) =>
        Ok(await _reservationService.ConfirmAsync(id, cancellationToken));

    [HttpPost("{id:guid}/arrive")]
    public async Task<ActionResult<ReservationResponse>> Arrive(Guid id, CancellationToken cancellationToken) =>
        Ok(await _reservationService.ArriveAsync(id, cancellationToken));

    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult<ReservationResponse>> Cancel(Guid id, CancellationToken cancellationToken) =>
        Ok(await _reservationService.CancelAsync(id, cancellationToken));

    [HttpPost("{id:guid}/no-show")]
    public async Task<ActionResult<ReservationResponse>> NoShow(Guid id, CancellationToken cancellationToken) =>
        Ok(await _reservationService.MarkNoShowAsync(id, cancellationToken));
}
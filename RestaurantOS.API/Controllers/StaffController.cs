using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantOS.Application.Staff;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.API.Controllers;

[ApiController]
[Route("api/staff")]
[Authorize(Roles = nameof(UserRole.Manager))]
public class StaffController : ControllerBase
{
    private readonly IStaffService _staffService;

    public StaffController(IStaffService staffService)
    {
        _staffService = staffService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<StaffResponse>>> GetAll(CancellationToken ct) =>
        Ok(await _staffService.GetAllAsync(ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<StaffResponse>> GetById(Guid id, CancellationToken ct) =>
        Ok(await _staffService.GetByIdAsync(id, ct));

    [HttpPost]
    public async Task<ActionResult<StaffResponse>> Create(CreateStaffRequest request, CancellationToken ct)
    {
        var response = await _staffService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = response.Id }, response);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<StaffResponse>> UpdateProfile(Guid id, UpdateStaffProfileRequest request, CancellationToken ct) =>
        Ok(await _staffService.UpdateProfileAsync(id, request, ct));

    [HttpPatch("{id:guid}/role")]
    public async Task<ActionResult<StaffResponse>> ChangeRole(Guid id, ChangeRoleRequest request, CancellationToken ct) =>
        Ok(await _staffService.ChangeRoleAsync(id, request, ct));

    [HttpPost("{id:guid}/deactivate")]
    public async Task<ActionResult<StaffResponse>> Deactivate(Guid id, CancellationToken ct) =>
        Ok(await _staffService.DeactivateAsync(id, ct));

    [HttpPost("{id:guid}/activate")]
    public async Task<ActionResult<StaffResponse>> Activate(Guid id, CancellationToken ct) =>
        Ok(await _staffService.ActivateAsync(id, ct));

    [HttpPost("{id:guid}/reset-password")]
    public async Task<IActionResult> ResetPassword(Guid id, ResetPasswordRequest request, CancellationToken ct)
    {
        await _staffService.ResetPasswordAsync(id, request, ct);
        return NoContent();
    }
}
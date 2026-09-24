using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantOS.Application.Menu;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.API.Controllers;

[ApiController]
[Route("api/menu/items")]
[Authorize]
public class MenuItemsController : ControllerBase
{
    private readonly IMenuItemService _itemService;

    public MenuItemsController(IMenuItemService itemService)
    {
        _itemService = itemService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<MenuItemResponse>>> GetAll(
        [FromQuery] Guid? categoryId,
        CancellationToken cancellationToken)
    {
        return Ok(await _itemService.GetAllAsync(categoryId, cancellationToken));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<MenuItemResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        return Ok(await _itemService.GetByIdAsync(id, cancellationToken));
    }

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Manager))]
    public async Task<ActionResult<MenuItemResponse>> Create(
        CreateMenuItemRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _itemService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = response.Id }, response);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Manager))]
    public async Task<ActionResult<MenuItemResponse>> Update(
        Guid id,
        UpdateMenuItemRequest request,
        CancellationToken cancellationToken)
    {
        return Ok(await _itemService.UpdateAsync(id, request, cancellationToken));
    }

    [HttpPatch("{id:guid}/price")]
    [Authorize(Roles = nameof(UserRole.Manager))]
    public async Task<ActionResult<MenuItemResponse>> ChangePrice(
        Guid id,
        ChangePriceRequest request,
        CancellationToken cancellationToken)
    {
        return Ok(await _itemService.ChangePriceAsync(id, request, cancellationToken));
    }

    [HttpPatch("{id:guid}/availability")]
    [Authorize(Roles = $"{nameof(UserRole.Manager)},{nameof(UserRole.Kitchen)},{nameof(UserRole.Bar)}")]
    public async Task<ActionResult<MenuItemResponse>> SetAvailability(
        Guid id,
        SetAvailabilityRequest request,
        CancellationToken cancellationToken)
    {
        return Ok(await _itemService.SetAvailabilityAsync(id, request.IsAvailable, cancellationToken));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Manager))]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _itemService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
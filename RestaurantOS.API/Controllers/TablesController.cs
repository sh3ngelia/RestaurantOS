using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantOS.Application.Tables;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.API.Controllers;

[ApiController]
[Route("api/tables")]
[Authorize(Roles = $"{nameof(UserRole.Host)},{nameof(UserRole.Manager)}")] // მიმღები + მენეჯერი
public class TablesController : ControllerBase
{
    private readonly ITableService _tableService;

    public TablesController(ITableService tableService)
    {
        _tableService = tableService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TableResponse>>> GetAll(CancellationToken cancellationToken) =>
        Ok(await _tableService.GetAllAsync(cancellationToken));

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Manager))]
    public async Task<ActionResult<TableResponse>> Create(CreateTableRequest request, CancellationToken cancellationToken) =>
        StatusCode(StatusCodes.Status201Created, await _tableService.CreateAsync(request, cancellationToken));

    [HttpPut("{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Manager))]
    public async Task<ActionResult<TableResponse>> Update(Guid id, UpdateTableRequest request, CancellationToken cancellationToken) =>
        Ok(await _tableService.UpdateAsync(id, request, cancellationToken));

    [HttpPost("{id:guid}/occupy")]
    public async Task<ActionResult<TableResponse>> Occupy(Guid id, CancellationToken cancellationToken) =>
        Ok(await _tableService.OccupyAsync(id, cancellationToken));

    [HttpPost("{id:guid}/reserve")]
    public async Task<ActionResult<TableResponse>> Reserve(Guid id, CancellationToken cancellationToken) =>
        Ok(await _tableService.ReserveAsync(id, cancellationToken));

    [HttpPost("{id:guid}/free")]
    public async Task<ActionResult<TableResponse>> Free(Guid id, CancellationToken cancellationToken) =>
        Ok(await _tableService.FreeAsync(id, cancellationToken));

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Manager))]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _tableService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
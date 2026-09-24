using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantOS.Application.Menu;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.API.Controllers;

[ApiController]
[Route("api/menu/categories")]
[Authorize]
public class MenuCategoriesController : ControllerBase
{
    private readonly IMenuCategoryService _categoryService;

    public MenuCategoriesController(IMenuCategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<MenuCategoryResponse>>> GetAll(CancellationToken cancellationToken)
    {
        return Ok(await _categoryService.GetAllAsync(cancellationToken));
    }

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Manager))]
    public async Task<ActionResult<MenuCategoryResponse>> Create(
        CreateMenuCategoryRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _categoryService.CreateAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Manager))]
    public async Task<ActionResult<MenuCategoryResponse>> Update(
        Guid id,
        UpdateMenuCategoryRequest request,
        CancellationToken cancellationToken)
    {
        return Ok(await _categoryService.UpdateAsync(id, request, cancellationToken));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = nameof(UserRole.Manager))]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _categoryService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
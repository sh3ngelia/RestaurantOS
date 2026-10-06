using RestaurantOS.Application.Common.Interfaces;
using RestaurantOS.Domain.Enums;
using System.Security.Claims;

namespace RestaurantOS.API.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? UserId
    {
        get
        {
            var value = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(value, out var id) ? id : null;
        }
    }

    public bool IsInRole(UserRole role) =>
    _httpContextAccessor.HttpContext?.User.IsInRole(role.ToString()) ?? false;
}
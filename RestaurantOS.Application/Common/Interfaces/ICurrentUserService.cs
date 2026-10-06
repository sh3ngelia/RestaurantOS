using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    bool IsInRole(UserRole role);
}
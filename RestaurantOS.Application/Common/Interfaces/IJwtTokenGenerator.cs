using RestaurantOS.Domain.Entities;

namespace RestaurantOS.Application.Common.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user);
}

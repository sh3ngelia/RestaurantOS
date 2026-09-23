using Microsoft.Extensions.DependencyInjection;
using RestaurantOS.Application.Authentication;

namespace RestaurantOS.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        return services;
    }
}
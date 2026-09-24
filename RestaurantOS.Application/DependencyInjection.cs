using Microsoft.Extensions.DependencyInjection;
using RestaurantOS.Application.Authentication;
using FluentValidation;

namespace RestaurantOS.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();

        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        return services;
    }
}
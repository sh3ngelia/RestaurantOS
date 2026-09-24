using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using RestaurantOS.Application.Authentication;
using RestaurantOS.Application.Menu;

namespace RestaurantOS.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();

        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        services.AddScoped<IMenuCategoryService, MenuCategoryService>();

        return services;
    }
}
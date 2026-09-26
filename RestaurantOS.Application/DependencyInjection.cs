using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using RestaurantOS.Application.Authentication;
using RestaurantOS.Application.Menu;
using RestaurantOS.Application.Tables;

namespace RestaurantOS.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();

        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        services.AddScoped<IMenuCategoryService, MenuCategoryService>();

        services.AddScoped<IMenuItemService, MenuItemService>();

        services.AddScoped<ITableService, TableService>();

        return services;
    }
}
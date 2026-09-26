using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RestaurantOS.Application.Common.Interfaces;
using RestaurantOS.Infrastructure.Authentication;
using RestaurantOS.Infrastructure.Persistence;
using RestaurantOS.Infrastructure.Persistence.Repositories;

namespace RestaurantOS.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");

        services.AddDbContext<RestaurantDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddSingleton<IPasswordHasher, PasswordHasher>();

        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));
        
        services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();

        services.AddScoped<IUserRepository, UserRepository>();

        services.AddScoped<DatabaseSeeder>();

        services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<RestaurantDbContext>());

        services.AddScoped<IMenuCategoryRepository, MenuCategoryRepository>();
        services.AddScoped<IMenuItemRepository, MenuItemRepository>();

        services.AddScoped<ITableRepository, TableRepository>();

        return services;
    }
}
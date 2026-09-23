using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using RestaurantOS.Application.Common.Interfaces;
using RestaurantOS.Domain.Entities;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Infrastructure.Persistence;

public class DatabaseSeeder
{
    private readonly RestaurantDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DatabaseSeeder> _logger;

    public DatabaseSeeder(
        RestaurantDbContext context,
        IPasswordHasher passwordHasher,
        IConfiguration configuration,
        ILogger<DatabaseSeeder> logger)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        // უკვე ვინმე არის? (წაშლილების ჩათვლით) → არაფერს ვაკეთებთ
        if (await _context.Users.IgnoreQueryFilters().AnyAsync(cancellationToken))
            return;

        var email = _configuration["Seed:ManagerEmail"];
        var password = _configuration["Seed:ManagerPassword"];

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            _logger.LogWarning("Seed credentials are not configured. Skipping seeding.");
            return;
        }

        var manager = new User(
            "Restaurant",
            "Manager",
            email,
            _passwordHasher.Hash(password),
            UserRole.Manager);

        _context.Users.Add(manager);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Initial manager created: {Email}", manager.Email);
    }
}
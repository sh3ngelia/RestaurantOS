using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using RestaurantOS.Application.Common.Interfaces;
using RestaurantOS.Domain.Entities;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Infrastructure.Persistence;

// მხოლოდ Development-ში: ცარიელ ბაზას რეალისტური demo მონაცემებით ავსებს
public class DemoDataSeeder
{
    private readonly RestaurantDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DemoDataSeeder> _logger;

    public DemoDataSeeder(
        RestaurantDbContext context,
        IPasswordHasher passwordHasher,
        IConfiguration configuration,
        ILogger<DemoDataSeeder> logger)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        // სადგურები უკვე არის? — ესე იგი ბაზა უკვე შევსებულია
        if (await _context.Stations.IgnoreQueryFilters().AnyAsync(cancellationToken))
            return;

        // --- სადგურები ---
        var cold = new Station("Cold", PreparationStation.Kitchen, firesImmediately: false, displayOrder: 1);
        var hot = new Station("Hot", PreparationStation.Kitchen, firesImmediately: false, displayOrder: 2);
        var grill = new Station("Grill", PreparationStation.Kitchen, firesImmediately: false, displayOrder: 3);
        var fry = new Station("Fry", PreparationStation.Kitchen, firesImmediately: false, displayOrder: 4);
        var pastry = new Station("Pastry", PreparationStation.Kitchen, firesImmediately: false, displayOrder: 5);
        var bar = new Station("Bar", PreparationStation.Bar, firesImmediately: true, displayOrder: 6);
        _context.Stations.AddRange(cold, hot, grill, fry, pastry, bar);

        // --- კატეგორიები ---
        var starters = new MenuCategory("Starters", "Cold and warm starters", 1);
        var mains = new MenuCategory("Mains", "Main courses", 2);
        var sides = new MenuCategory("Sides", null, 3);
        var desserts = new MenuCategory("Desserts", null, 4);
        var drinks = new MenuCategory("Drinks", "Wine and soft drinks", 5);
        _context.MenuCategories.AddRange(starters, mains, sides, desserts, drinks);

        // --- კერძები ---
        _context.MenuItems.AddRange(
            new MenuItem("Badrijani Nigvzit", "Fried aubergine rolls with walnut paste", 9.50m, starters.Id, cold.Id, 10, Allergen.Nuts),
            new MenuItem("Pkhali Trio", "Spinach, beetroot and leek pkhali", 8.50m, starters.Id, cold.Id, 10, Allergen.Nuts),
            new MenuItem("Caesar Salad", null, 11.00m, starters.Id, cold.Id, 10, Allergen.Gluten | Allergen.Eggs | Allergen.Milk | Allergen.Fish),

            new MenuItem("Khinkali (5 pcs)", "Pork and beef dumplings", 10.00m, mains.Id, hot.Id, 15, Allergen.Gluten),
            new MenuItem("Khachapuri Adjaruli", "Cheese bread with egg and butter", 16.00m, mains.Id, hot.Id, 20, Allergen.Gluten | Allergen.Eggs | Allergen.Milk),
            new MenuItem("Pork Mtsvadi", "Charcoal-grilled pork skewers", 18.50m, mains.Id, grill.Id, 25),
            new MenuItem("Chicken Tabaka", "Pressed fried chicken with garlic sauce", 17.00m, mains.Id, grill.Id, 30, Allergen.Milk),

            new MenuItem("French Fries", null, 4.50m, sides.Id, fry.Id, 8),
            new MenuItem("Fried Potatoes with Mushrooms", null, 6.50m, sides.Id, fry.Id, 12),

            new MenuItem("Pelamushi", "Grape pudding with walnuts", 7.00m, desserts.Id, pastry.Id, 5, Allergen.Nuts),
            new MenuItem("Honey Cake", null, 6.50m, desserts.Id, pastry.Id, 5, Allergen.Gluten | Allergen.Eggs | Allergen.Milk),

            new MenuItem("Saperavi (glass)", null, 8.00m, drinks.Id, bar.Id, 2, Allergen.Sulphites),
            new MenuItem("Mukuzani (glass)", null, 8.50m, drinks.Id, bar.Id, 2, Allergen.Sulphites),
            new MenuItem("Tarkhuna Lemonade", null, 4.00m, drinks.Id, bar.Id, 1),
            new MenuItem("Borjomi", null, 3.50m, drinks.Id, bar.Id, 1),
            new MenuItem("Espresso", null, 2.80m, drinks.Id, bar.Id, 2));

        // --- მაგიდები ---
        int[] capacities = [2, 2, 4, 4, 4, 6, 6, 8];
        for (var i = 0; i < capacities.Length; i++)
            _context.Tables.Add(new Table(i + 1, capacities[i]));

        // --- თანამშრომლები (თუ პაროლი მითითებულია User Secrets-ში) ---
        var staffPassword = _configuration["Seed:StaffPassword"];
        if (!string.IsNullOrWhiteSpace(staffPassword))
        {
            var hash = _passwordHasher.Hash(staffPassword);
            AddStaffIfMissing("Sara", "Hoffmann", "sara@restaurantos.local", hash, UserRole.Host);
            AddStaffIfMissing("Lukas", "Weber", "lukas@restaurantos.local", hash, UserRole.Waiter);
            AddStaffIfMissing("Mia", "Schulz", "mia@restaurantos.local", hash, UserRole.Kitchen);
            AddStaffIfMissing("Tom", "Becker", "tom@restaurantos.local", hash, UserRole.Bar);
            AddStaffIfMissing("Clara", "Fischer", "clara@restaurantos.local", hash, UserRole.Accountant);
        }

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Demo data created.");
    }

    private void AddStaffIfMissing(string firstName, string lastName, string email, string passwordHash, UserRole role)
    {
        if (_context.Users.IgnoreQueryFilters().Any(u => u.Email == email))
            return;

        _context.Users.Add(new User(firstName, lastName, email, passwordHash, role));
    }
}
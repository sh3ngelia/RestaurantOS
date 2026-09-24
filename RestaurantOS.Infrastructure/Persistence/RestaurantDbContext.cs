using Microsoft.EntityFrameworkCore;
using RestaurantOS.Application.Common.Interfaces;
using RestaurantOS.Domain.Entities;

namespace RestaurantOS.Infrastructure.Persistence;

public class RestaurantDbContext : DbContext, IUnitOfWork
{
    public RestaurantDbContext(DbContextOptions<RestaurantDbContext> options)
    : base(options)
    {
    }
     public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Table> Tables => Set<Table>();
    public DbSet<User> Users => Set<User>();
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<MenuCategory> MenuCategories => Set<MenuCategory>();
    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();
    public DbSet<Shift> Shifts => Set<Shift>();
    

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(RestaurantDbContext).Assembly);
    }
}
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantOS.Domain.Entities;

namespace RestaurantOS.Infrastructure.Persistence.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.OrderNumber)
            .IsRequired()
            .HasMaxLength(20);

        builder.HasIndex(o => o.OrderNumber)
            .IsUnique()
            .HasFilter("\"IsDeleted\" = false");

        builder.Property(o => o.Status)
            .IsRequired();

        builder.Property(o => o.Type)
            .IsRequired();

        builder.Property(o => o.DeliveryAddress)
            .HasMaxLength(500);

        builder.Property(o => o.Notes)
            .HasMaxLength(1000);

        builder.Ignore(o => o.TotalAmount);

        builder.HasMany(o => o.Items)
            .WithOne()
            .HasForeignKey(i => i.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(o => o.Items)
            .UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.HasOne<Table>()
            .WithMany()
            .HasForeignKey(o => o.TableId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(o => o.WaiterId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Customer>()
            .WithMany()
            .HasForeignKey(o => o.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);
        
        builder.HasIndex(o => o.Status);

        builder.HasQueryFilter(o => !o.IsDeleted);

    }
}
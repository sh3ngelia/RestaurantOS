using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantOS.Domain.Entities;

namespace RestaurantOS.Infrastructure.Persistence.Configurations;

public class InventoryItemConfiguration : IEntityTypeConfiguration<InventoryItem>
{
    public void Configure(EntityTypeBuilder<InventoryItem> builder)
    {
        builder.ToTable("InventoryItems");

        builder.HasKey(ii => ii.Id);

        builder.Property(ii => ii.Name)
            .IsRequired()
            .HasMaxLength(150);

        builder.HasIndex(ii => ii.Name)
            .IsUnique()
            .HasFilter("\"IsDeleted\" = false");

        builder.Property(ii => ii.Unit)
            .IsRequired();

        builder.Property(ii => ii.CurrentQuantity)
            .IsRequired()
            .HasPrecision(12, 3);

        builder.Property(ii => ii.MinimumQuantity)
            .IsRequired()
            .HasPrecision(12, 3);

        builder.Property(ii => ii.CostPerUnit)
            .IsRequired()
            .HasPrecision(10, 2);

        builder.Ignore(ii => ii.IsLowStock);

        builder.HasQueryFilter(ii => !ii.IsDeleted);
    }
}
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantOS.Domain.Entities;

namespace RestaurantOS.Infrastructure.Persistence.Configurations;

public class MenuItemConfiguration : IEntityTypeConfiguration<MenuItem>
{
    public void Configure(EntityTypeBuilder<MenuItem> builder)
    {
        builder.ToTable("MenuItems");

        builder.HasKey(mi => mi.Id);

        builder.Property(mi => mi.Name)
            .IsRequired()
            .HasMaxLength(150);

        builder.HasIndex(mi => mi.Name)
            .IsUnique()
            .HasFilter("\"IsDeleted\" = false");

        builder.Property(mi => mi.Description)
            .HasMaxLength(1000);

        builder.Property(mi => mi.Price)
            .IsRequired()
            .HasPrecision(10, 2);

        builder.HasOne(m => m.Category)
            .WithMany()
            .HasForeignKey(m => m.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(mi => !mi.IsDeleted);
    }
}

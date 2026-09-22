using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantOS.Domain.Entities;

namespace RestaurantOS.Infrastructure.Persistence.Configurations;

public class MenuCategoryConfiguration : IEntityTypeConfiguration<MenuCategory>
{
    public void Configure(EntityTypeBuilder<MenuCategory> builder)
    {
        builder.ToTable("MenuCategories");

        builder.HasKey(mc => mc.Id);

        builder.Property(mc => mc.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(mc => mc.Name)
            .IsUnique()
            .HasFilter("\"IsDeleted\" = false");

        builder.Property(mc => mc.Description)
            .HasMaxLength(500);

        builder.HasQueryFilter(mc => !mc.IsDeleted);
    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantOS.Domain.Entities;

namespace RestaurantOS.Infrastructure.Persistence.Configurations;

public class TableConfiguration : IEntityTypeConfiguration<Table>
{
    public void Configure(EntityTypeBuilder<Table> builder)
    {
        builder.ToTable("Tables");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.TableNumber)
            .IsRequired();

        builder.HasIndex(t => t.TableNumber)
            .IsUnique()
            .HasFilter("\"IsDeleted\" = false");

        builder.Property(t => t.Capacity)
            .IsRequired();

        builder.Property(t => t.Status)
            .IsRequired();

        builder.HasQueryFilter(t => !t.IsDeleted);
    }
}
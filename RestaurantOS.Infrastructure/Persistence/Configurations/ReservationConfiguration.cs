using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantOS.Domain.Entities;

namespace RestaurantOS.Infrastructure.Persistence.Configurations;

public class ReservationConfiguration : IEntityTypeConfiguration<Reservation>
{
    public void Configure(EntityTypeBuilder<Reservation> builder)
    {
        builder.ToTable("Reservations");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.GuestName)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(r => r.GuestPhoneNumber)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(r => r.Notes)
            .HasMaxLength(1000);

        builder.Property(r => r.GuestCount)
            .IsRequired();

        builder.Property(r => r.ReservationTime)
            .IsRequired();

        builder.Property(r => r.Status)
            .IsRequired();

        builder.HasOne(r => r.Table)
            .WithMany()
            .HasForeignKey(r => r.TableId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(r => !r.IsDeleted);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(r => r.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Customer>()
            .WithMany()
            .HasForeignKey(r => r.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(r => new { r.TableId, r.ReservationTime });

        builder.HasIndex(r => r.ReservationTime);
    }
}

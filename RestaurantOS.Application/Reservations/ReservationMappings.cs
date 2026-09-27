using RestaurantOS.Domain.Entities;

namespace RestaurantOS.Application.Reservations;

public static class ReservationMappings
{
    public static ReservationResponse ToResponse(this Reservation reservation) =>
        new(
            reservation.Id,
            reservation.TableId,
            reservation.Table?.TableNumber ?? 0,
            reservation.GuestName,
            reservation.GuestPhoneNumber,
            reservation.GuestCount,
            reservation.ReservationTime,
            reservation.Status,
            reservation.Notes);
}
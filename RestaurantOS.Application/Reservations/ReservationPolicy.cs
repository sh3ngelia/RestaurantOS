namespace RestaurantOS.Application.Reservations;

public static class ReservationPolicy
{
    // A single reservation holds a table for approximately two hours
    public static readonly TimeSpan BookingWindow = TimeSpan.FromHours(2);

    // How long before the reservation the table is marked as held
    public static readonly TimeSpan HoldBefore = TimeSpan.FromMinutes(45);

    // How long we wait for a late guest
    public static readonly TimeSpan LateGrace = TimeSpan.FromMinutes(20);

    // How far ahead we look for the next reservation
    public static readonly TimeSpan LookAhead = TimeSpan.FromHours(12);
}
using RestaurantOS.Domain.Common;
using RestaurantOS.Domain.Enums;

namespace RestaurantOS.Domain.Entities;

public class Reservation : BaseEntity
{
    public Guid TableId { get; private set; }
    public Table Table { get; private set; }
    public string GuestName { get; private set; }
    public string GuestPhoneNumber { get; private set; }
    public int GuestCount { get; private set; }
    public DateTime ReservationTime { get; private set; }
    public ReservationStatus Status { get; private set; }
    public string? Notes { get; private set; }
    public Guid? CreatedByUserId { get; private set; }
    public Guid? CustomerId { get; private set; }

    private Reservation() { }
    public Reservation(
        Guid tableId,
        string guestName,
        string guestPhoneNumber,
        int guestCount,
        DateTime reservationTime,
        string? notes = null,
        Guid? createdByUserId = null,
        Guid? customerId = null)
    {
        ValidateGuestInfo(guestName, guestPhoneNumber, guestCount);
        ValidateReservationTime(reservationTime);

        if (!createdByUserId.HasValue && !customerId.HasValue)
            throw new DomainException("Reservation must have either a creator or a customer");

        TableId = tableId;
        GuestName = guestName;
        GuestPhoneNumber = guestPhoneNumber;
        GuestCount = guestCount;
        ReservationTime = reservationTime;
        Notes = notes;
        CreatedByUserId = createdByUserId;
        CustomerId = customerId;

        Status = createdByUserId.HasValue
            ? ReservationStatus.Confirmed
            : ReservationStatus.Pending;
    }

    public void Confirm()
    {
        if (Status != ReservationStatus.Pending)
            throw new DomainException("Only pending reservations can be confirmed");

        Status = ReservationStatus.Confirmed;
        MarkAsUpdated();
    }

    public void MarkAsArrived()
    {
        if (Status != ReservationStatus.Confirmed)
            throw new DomainException("Only confirmed reservations can be marked as arrived");

        Status = ReservationStatus.Arrived;
        MarkAsUpdated();
    }

    public void Cancel()
    {
        EnsureNotFinalized("cancel");

        Status = ReservationStatus.Cancelled;
        MarkAsUpdated();
    }

    public void MarkAsNoShow()
    {
        if (Status != ReservationStatus.Confirmed)
            throw new DomainException("Only confirmed reservations can be marked as no-show");

        Status = ReservationStatus.NoShow;
        MarkAsUpdated();
    }

    public void Reschedule(DateTime newReservationTime)
    {
        EnsureNotFinalized("reschedule");
        ValidateReservationTime(newReservationTime);

        ReservationTime = newReservationTime;
        MarkAsUpdated();
    }

    public void UpdateGuestInfo(string guestName, string guestPhoneNumber, int guestCount)
    {
        ValidateGuestInfo(guestName, guestPhoneNumber, guestCount);

        GuestName = guestName;
        GuestPhoneNumber = guestPhoneNumber;
        GuestCount = guestCount;
        MarkAsUpdated();
    }

    public void UpdateNotes(string? notes)
    {
        Notes = notes;
        MarkAsUpdated();
    }

    private void EnsureNotFinalized(string action)
    {
        if (Status is ReservationStatus.Arrived
                   or ReservationStatus.NoShow
                   or ReservationStatus.Cancelled)
            throw new DomainException($"Cannot {action} a finalized reservation");
    }

    private static void ValidateGuestInfo(string guestName, string guestPhoneNumber, int guestCount)
    {
        if (string.IsNullOrWhiteSpace(guestName))
            throw new DomainException("Guest name cannot be empty");
        if (string.IsNullOrWhiteSpace(guestPhoneNumber))
            throw new DomainException("Guest phone number cannot be empty");
        if (guestCount <= 0)
            throw new DomainException("Guest count must be greater than zero");
    }

    private static void ValidateReservationTime(DateTime reservationTime)
    {
        if (reservationTime < DateTime.UtcNow)
            throw new DomainException("Reservation time must be in the future");
    }
}
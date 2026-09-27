using FluentValidation;

namespace RestaurantOS.Application.Reservations.Validators;

public class RescheduleReservationRequestValidator : AbstractValidator<RescheduleReservationRequest>
{
    public RescheduleReservationRequestValidator()
    {
        RuleFor(x => x.ReservationTime)
            .Must(time => time > DateTimeOffset.UtcNow).WithMessage("Reservation time must be in the future.");
    }
}
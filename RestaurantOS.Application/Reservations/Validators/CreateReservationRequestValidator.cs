using FluentValidation;

namespace RestaurantOS.Application.Reservations.Validators;

public class CreateReservationRequestValidator : AbstractValidator<CreateReservationRequest>
{
    public CreateReservationRequestValidator()
    {
        RuleFor(x => x.TableId)
            .NotEmpty().WithMessage("Table is required.");

        RuleFor(x => x.GuestName)
            .NotEmpty().WithMessage("Guest name is required.")
            .MaximumLength(150);

        RuleFor(x => x.GuestPhoneNumber)
            .NotEmpty().WithMessage("Phone number is required.")
            .MaximumLength(20);

        RuleFor(x => x.GuestCount)
            .InclusiveBetween(1, 30).WithMessage("Guest count must be between 1 and 30.");

        RuleFor(x => x.ReservationTime)
            .Must(time => time > DateTimeOffset.UtcNow).WithMessage("Reservation time must be in the future.");

        RuleFor(x => x.Notes)
            .MaximumLength(1000);
    }
}
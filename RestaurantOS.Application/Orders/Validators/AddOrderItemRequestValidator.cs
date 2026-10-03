using FluentValidation;

namespace RestaurantOS.Application.Orders.Validators;

public class AddOrderItemRequestValidator : AbstractValidator<AddOrderItemRequest>
{
    public AddOrderItemRequestValidator()
    {
        RuleFor(x => x.MenuItemId)
            .NotEmpty().WithMessage("Menu item is required.");

        RuleFor(x => x.Quantity)
            .InclusiveBetween(1, 50).WithMessage("Quantity must be between 1 and 50.");

        RuleFor(x => x.Course)
            .IsInEnum().WithMessage("Invalid course.");

        RuleFor(x => x.Notes)
            .MaximumLength(500);

        RuleFor(x => x.SeatNumber)
            .GreaterThan(0).When(x => x.SeatNumber.HasValue)
            .WithMessage("Seat number must be greater than zero.");
    }
}
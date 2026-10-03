using FluentValidation;

namespace RestaurantOS.Application.Orders.Validators;

public class OpenOrderRequestValidator : AbstractValidator<OpenOrderRequest>
{
    public OpenOrderRequestValidator()
    {
        RuleFor(x => x.TableId)
            .NotEmpty().WithMessage("Table is required.");

        RuleFor(x => x.Notes)
            .MaximumLength(1000);
    }
}
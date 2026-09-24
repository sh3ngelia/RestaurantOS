using FluentValidation;

namespace RestaurantOS.Application.Menu.Validators;

public class ChangePriceRequestValidator : AbstractValidator<ChangePriceRequest>
{
    public ChangePriceRequestValidator()
    {
        RuleFor(x => x.NewPrice)
            .GreaterThan(0).WithMessage("Price must be greater than zero.");
    }
}
using FluentValidation;

namespace RestaurantOS.Application.Orders.Validators;

public class UpdateOrderItemQuantityRequestValidator : AbstractValidator<UpdateOrderItemQuantityRequest>
{
    public UpdateOrderItemQuantityRequestValidator()
    {
        RuleFor(x => x.Quantity)
            .InclusiveBetween(1, 50).WithMessage("Quantity must be between 1 and 50.");
    }
}
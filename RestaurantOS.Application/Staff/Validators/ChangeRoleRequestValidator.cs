using FluentValidation;

namespace RestaurantOS.Application.Staff.Validators;

public class ChangeRoleRequestValidator : AbstractValidator<ChangeRoleRequest>
{
    public ChangeRoleRequestValidator()
    {
        RuleFor(x => x.Role).IsInEnum().WithMessage("Invalid role.");
    }
}
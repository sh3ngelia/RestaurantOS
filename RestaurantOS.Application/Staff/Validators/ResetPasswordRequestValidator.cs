using FluentValidation;

namespace RestaurantOS.Application.Staff.Validators;

public class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordRequestValidator()
    {
        RuleFor(x => x.NewPassword).StrongPassword();
    }
}
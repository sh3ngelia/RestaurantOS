using FluentValidation;

namespace RestaurantOS.Application.Staff.Validators;

public class CreateStaffRequestValidator : AbstractValidator<CreateStaffRequest>
{
    public CreateStaffRequestValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().WithMessage("First name is required.").MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().WithMessage("Last name is required.").MaximumLength(100);

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Email is not valid.")
            .MaximumLength(256);

        RuleFor(x => x.Password).StrongPassword();

        RuleFor(x => x.Role).IsInEnum().WithMessage("Invalid role.");
    }
}
using FluentValidation;

namespace RestaurantOS.Application.Staff.Validators;

public class UpdateStaffProfileRequestValidator : AbstractValidator<UpdateStaffProfileRequest>
{
    public UpdateStaffProfileRequestValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().WithMessage("First name is required.").MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().WithMessage("Last name is required.").MaximumLength(100);

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Email is not valid.")
            .MaximumLength(256);
    }
}